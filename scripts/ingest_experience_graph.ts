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
            insertEdge.run(item.id, protoId, "CITES");
            edgesAdded++;
        }

        // B. WikiLinks [[filename]]
        const wikiRegex = /\[\[(.*?)\]\]/g;
        let match;
        while ((match = wikiRegex.exec(content)) !== null) {
            if (!match[1]) continue;
            const linkTarget = match[1].trim();
            // Assuming linkTarget matches an ID (filename without ext)
            // If linkTarget contains pipe [[target|label]], split it
            const cleanTarget = linkTarget.split("|")[0]?.trim().replace(/\.md$/, "");
            if (!cleanTarget) continue; // Safety check
            
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
