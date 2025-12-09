
import { ResonanceDB } from "../resonance/src/db";
import { Embedder } from "../resonance/src/services/embedder";
import { glob } from "glob";
import { readFileSync } from "node:fs";
import { basename, join } from "path";
import { parseArgs } from "util";

// Parse args for fail-fast limit
const { values } = parseArgs({
    args: Bun.argv,
    options: {
        limit: {
            type: 'string',
        },
    },
    strict: true,
    allowPositionals: true,
});

const LIMIT = values.limit ? parseInt(values.limit) : Infinity;

console.log(`🚀 Starting Resonance Sync (Limit: ${LIMIT === Infinity ? "ALL" : LIMIT})`);

async function main() {
    const db = new ResonanceDB();
    await Embedder.init();

    // 1. Ensure Hierarchy
    console.log("📦 Ensuring Hierarchy...");
    
    // GENESIS
    db.insertNode({
        id: "000-GENESIS",
        type: "genesis",
        label: "GENESIS",
        content: "The root of all knowledge.",
        domain: "system",
        layer: "foundation"
    });

    // EXPERIENCE
    db.insertNode({
        id: "EXPERIENCE",
        type: "category",
        label: "Experience",
        content: "Operational knowledge, debriefs, and playbooks.",
        domain: "knowledge",
        layer: "system"
    });

    // Link GENESIS -> EXPERIENCE
    db.insertEdge("000-GENESIS", "EXPERIENCE", "has_part");

    // 2. Scan Files
    const dirs = ["debriefs", "playbooks"];
    let totalProcessed = 0;
    let skipped = 0;
    let updated = 0;

    for (const dir of dirs) {
        if (totalProcessed >= LIMIT) break;

        const pattern = join(process.cwd(), dir, "*.md");
        const files = await glob(pattern);
        
        console.log(`📂 Scanning ${dir}: Found ${files.length} files`);

        for (const file of files) {
            if (totalProcessed >= LIMIT) break;
            
            const filename = basename(file);
            const content = readFileSync(file, "utf-8");
            
            // Calculate Hash (Bun.hash returns a generic number, good enough for quick dirty check)
            // For closer collision resistance we could use crypto.createHash, but for this scale Bun.hash is fast/fine.
            // Wait, Bun.hash is fast. Let's use it.
            const hash = Bun.hash(content).toString();
            
            // Check existing
            const existing = db["db"].query("SELECT hash FROM nodes WHERE id = ?").get(filename) as { hash: string };
            
            if (existing && existing.hash === hash) {
                console.log(`   ⏭️  Skipping (Unchanged): ${filename}`);
                skipped++;
                continue;
            }

            console.log(`   📝 Processing (Changed/New): ${filename}`);
            
            // Embed
            const vec = await Embedder.embed(content);
            
            // Insert Node
            const id = filename; 
            db.insertNode({
                id: id,
                type: dir === "debriefs" ? "debrief" : "playbook",
                label: filename.replace(".md", ""),
                content: content,
                domain: "knowledge",
                layer: "experience",
                embedding: vec,
                hash: hash
            });
            
            // Link EXPERIENCE -> Node
            db.insertEdge("EXPERIENCE", id, "contains");
            
            totalProcessed++;
            updated++;
        }
    }

    console.log(`✅ Sync Complete.`);
    console.log(`   - Updated/Added: ${updated}`);
    console.log(`   - Skipped:       ${skipped}`);
    db.close();
}

main().catch(console.error);
