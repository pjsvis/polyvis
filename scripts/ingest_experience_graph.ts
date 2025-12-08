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

    // Prepare Statements
    // Schema matches Drizzle definition: id, title, type, content, external_refs...
    const insertNode = db.prepare(
        `INSERT OR REPLACE INTO nodes (id, title, type, content, external_refs, domain, layer) 
         VALUES (?, ?, ?, ?, ?, 'system', 'experience')`
    );
    // Note: 'edges' table uses 'type' column
    const insertEdge = db.prepare(
        "INSERT OR IGNORE INTO edges (source, target, type) VALUES (?, ?, ?)"
    );

    let nodesAdded = 0;
    let edgesAdded = 0;

    // --- Processing Loop ---
    for (const item of indexData) {
        // 1. Insert Node
        // Mapping: label -> title, definition -> content
        // definition is the relative path (for opening) + excerpt? 
        // For now, let's just store the path in definition so UI can use it.
        // Or better: Store a small excerpt? 
        // Brief says: "definition: Relative path (for file opening)"
        insertNode.run(item.id, item.title, item.type, item.path, "[]");
        nodesAdded++;

        // 2. Scan Content for Edges
        // Read the actual markdown file
        const filePath = join(ROOT_DIR, "public/docs", item.path);
        if (!existsSync(filePath)) {
            console.warn(`⚠️  File not found for scanning: ${filePath}`);
            continue;
        }

        const content = readFileSync(filePath, "utf-8");

        // A. Protocol Citations (OH-xxx, COG-xxx)
        const protocolRegex = /\b(OH-\d{3}|PHI-\d+|COG-\d+)\b/g;
        const protocols = [...new Set(content.match(protocolRegex) || [])];
        
        for (const protoId of protocols) {
            // Verify target exists to avoid dangling edges? 
            // Graphology handles dangling edges fine usually, but cleaner if we check.
            // For speed, we rely on INSERT OR IGNORE and foreign keys (if strict).
            // SQlite defaults FKs off usually.
            insertEdge.run(item.id, protoId, "CITES");
            edgesAdded++;
        }

        // B. WikiLinks [[filename]]
        const wikiRegex = /\[\[(.*?)\]\]/g;
        let match;
        while ((match = wikiRegex.exec(content)) !== null) {
            const linkTarget = match[1].trim();
            // Assuming linkTarget matches an ID (filename without ext)
            // If linkTarget contains pipe [[target|label]], split it
            const cleanTarget = linkTarget.split("|")[0].trim().replace(/\.md$/, "");
            
            if (cleanTarget !== item.id) {
                 insertEdge.run(item.id, cleanTarget, "REFERENCES");
                 edgesAdded++;
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
