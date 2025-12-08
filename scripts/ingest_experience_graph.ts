import { Database } from "bun:sqlite";
import { join } from "path";
import { existsSync, readFileSync } from "fs";

// --- Configuration ---
const SETTINGS_PATH = join(import.meta.dir, "../polyvis.settings.json");
const ROOT_DIR = join(import.meta.dir, "..");

// Types for Experience Index
interface ExperienceNode {
    id: string;
    type: "playbook" | "debrief" | "protocol";
    title: string;
    path: string;
    date?: string;
    tags: string[];
}

async function ingest() {
    console.log("🚀 Starting Experience Graph Ingestion...");

    const settings = await Bun.file(SETTINGS_PATH).json();
    const DB_PATH = join(ROOT_DIR, settings.paths.database.legacy);
    const EXP_INDEX_PATH = join(ROOT_DIR, "public/data/experience.json");
    const PUBLIC_DB_PATH = join(ROOT_DIR, "public/data/ctx.db");

    if (!existsSync(DB_PATH)) {
        console.error(`❌ DB not found: ${DB_PATH}`);
        process.exit(1);
    }
    if (!existsSync(EXP_INDEX_PATH)) {
        console.error(`❌ Experience Index not found: ${EXP_INDEX_PATH}. Run 'bun run scripts/build_experience.ts' first.`);
        process.exit(1);
    }

    const db = new Database(DB_PATH);
    const indexData: ExperienceNode[] = await Bun.file(EXP_INDEX_PATH).json();

    console.log(`📥 Loading ${indexData.length} experience artifacts...`);

    // --- Cleanup: Remove existing Experience Data to prevent duplicates ---
    console.log("Cleaning old Experience data...");
    const expIds = indexData.map(n => `'${n.id}'`).join(",");
    if (expIds.length > 0) {
        db.run(`DELETE FROM edges WHERE source IN (${expIds}) OR target IN (${expIds})`);
        db.run(`DELETE FROM nodes WHERE id IN (${expIds})`);
        // Also remove the domain node itself to be safe, though it's structural
        db.run(`DELETE FROM edges WHERE target = '002-EXPERIENCE'`); 
        db.run(`DELETE FROM nodes WHERE id = '002-EXPERIENCE'`);
    }

    // Prepare Statements
    // Schema matches build_db.ts: id, label, type, domain, layer, definition, external_refs
    const insertNode = db.prepare(
        `INSERT OR REPLACE INTO nodes (id, label, type, domain, layer, definition, external_refs) 
         VALUES (?, ?, ?, ?, ?, ?, ?)`
    );
    // Note: 'edges' table uses 'relation' column (fixed from 'type')
    const insertEdge = db.prepare(
        "INSERT OR IGNORE INTO edges (source, target, relation) VALUES (?, ?, ?)"
    );

    let nodesAdded = 0;
    let edgesAdded = 0;

    // 0. Experience Domain Injection
    console.log("Injecting Experience Domain Structure...");
    insertNode.run("002-EXPERIENCE", "Experience Domain", "domain", "resonance", "structure", "The Dynamic Telemetry of the System.", "[]");
    insertEdge.run("002-EXPERIENCE", "000-GENESIS", "BELONGS_TO");

    // --- Processing Loop ---
    for (const item of indexData) {
        // 1. Insert Node
        // Mapping: label -> title, definition -> content mapping
        insertNode.run(item.id, item.title, item.type, "resonance", "telemetry", item.path, "[]");
        
        // Structural Link
        insertEdge.run(item.id, "002-EXPERIENCE", "BELONGS_TO");
        
        nodesAdded++;

        // 2. Scan Content for Edges
        // Read the actual markdown file
        const filePath = join(ROOT_DIR, item.path);
 
        if (!existsSync(filePath)) {
            console.warn(`⚠️  File not found for scanning: ${filePath}`);
            continue;
        }

        const content = readFileSync(filePath, "utf-8");

        // A. Protocol Citations (OH-xxx, COG-xxx)
        const protocolRegex = /\b(OH-\d{3}|PHI-\d+|COG-\d+)\b/g;
        const protocols = [...new Set(content.match(protocolRegex) || [])];
        
        for (const protoId of protocols) {
            insertEdge.run(item.id, protoId, "CITES");
            edgesAdded++;
        }

        // B. WikiLinks [[filename]]
        const wikiRegex = /\[\[(.*?)\]\]/g;
        let match;
        while ((match = wikiRegex.exec(content)) !== null) {
            if (!match[1]) continue;
            const linkTarget = match[1].trim();
            const cleanTarget = linkTarget.split("|")[0]?.trim().replace(/\.md$/, "");
            if (!cleanTarget) continue;
            
            if (cleanTarget !== item.id) {
                 insertEdge.run(item.id, cleanTarget, "REFERENCES");
                 edgesAdded++;
            }
        }


    // --- Stop Words Definition ---
    const stopWords = new Set([
        // Standard English
        "the", "and", "that", "this", "with", "from", "into", "for", "are", "not", "which",
        "what", "how", "why", "who", "when", "where", "can", "may", "will", "has", "have",
        "had", "but", "all", "any", "one", "two", "use", "used", "using", "user", 
        // Generics
        "system", "data", "code", "node", "edge", "graph", "polyvis", "context", "concept",
        "term", "define", "definition", "example", "principle", "heuristic", "directive",
        "type", "value", "layer", "level", "core", "base",
        // Experience Specific (High Frequency / Low Signal)
        "playbook", "debrief", "session", "review", "update", "fix", "refactor", "create", 
        "implement", "polish", "cleanup", "visualization", "engine", "styling", "styles",
        "style", "issue", "problem", "solution", "work", "task", "brief", "protocol",
        "doc", "docs", "documentation", "file", "files", "folder", "script", "scripts"
    ]);

    // C. Semantic Linking (Keyword Matching)
    // Heuristic: If significant keywords from Other.Title appear in Item.Content -> LINK
    for (const other of indexData) {
        if (other.id === item.id) continue;
        if (!other.title) continue;

        // Extract Keywords from Title
        const keywords = other.title
            .split(/[\s-]+/)
            .map(w => w.toLowerCase().replace(/[^a-z0-9]/g, ""))
            .filter(w => w.length > 3 && !stopWords.has(w));

        if (keywords.length === 0) continue;

        // Check if ANY keyword is present (High Recall Strategy)
        // Note: For Persona we check definitions. Here we check full content.
        for (const keyword of keywords) {
            const keywordRegex = new RegExp(`\\b${keyword}\\b`, 'i');
            if (keywordRegex.test(content)) {
                insertEdge.run(item.id, other.id, "MENTIONS");
                edgesAdded++;
                break; // One link per relationship is enough
            }
        }
    }
    }

    console.log(`✅ Ingestion Complete.`);
    console.log(`   + Nodes: ${nodesAdded}`);
    console.log(`   + Edges: ${edgesAdded}`);

    db.close();

    // Copy to Public
    console.log(`📦 Publishing to ${PUBLIC_DB_PATH}...`);
    await Bun.write(PUBLIC_DB_PATH, Bun.file(DB_PATH));
    console.log(`🎉 Done.`);
}

ingest();
