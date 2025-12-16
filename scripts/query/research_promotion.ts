import { ResonanceDB } from "@src/resonance/db";
import { Embedder } from "@src/resonance/services/embedder";
import { join } from "path";
import settings from "@/polyvis.settings.json";

async function main() {
    console.log("🕵️‍♀️ Running Code Promotion Research...\n");
    const dbPath = join(process.cwd(), settings.paths.database.resonance);
    const db = new ResonanceDB(dbPath);
    const embedder = Embedder.getInstance();
    const startTotal = performance.now();

    const queries = [
        "What code logic should be moved from scripts to src?",
        "difference between scripts and src",
        "Resonance Engine architecture components",
        "Ingestion pipeline core logic refactor"
    ];

    console.log(`📚 Consulting the Oracle (${queries.length} queries)...\n`);

    for (const q of queries) {
        const start = performance.now();
        console.log(`❓ Query: "${q}"`);
        
        const vec = await embedder.embed(q);
        if (!vec) continue;

        // Use VectorEngine for search
        const { VectorEngine } = require("@src/core/VectorEngine");
        const ve = new VectorEngine(db.getRawDb());
        const results = await ve.searchByVector(vec, 3);
        const duration = (performance.now() - start).toFixed(2);
        
        console.log(`   ⏱️  Time: ${duration}ms`);
        console.log(`\nPromoting Research:`);
        results.forEach((r: any) => {
            console.log(`   - [${r.score.toFixed(2)}] ${r.label}`);
            // Peek at content
            const row = db['db'].query("SELECT content FROM nodes WHERE id = ?").get(r.id) as any;
            if (row) {
                const snippet = row.content.slice(0, 150).replace(/\n/g, ' ');
                console.log(`     "${snippet}..."`);
            }
        });
        console.log("");
    }

    // Direct SQL Search for 'TODO'
    console.log("🔍 Scanning for TODOs related to refactoring...");
    const todos = db['db'].query(`
        SELECT id, content FROM nodes 
        WHERE content LIKE '%TODO%' AND (content LIKE '%src%' OR content LIKE '%refactor%')
        LIMIT 5
    `).all() as any[];

    todos.forEach(t => {
        const match = t.content.match(/TODO:?.*?(?=\n|$)/i);
        if (match) {
            console.log(`   [${t.id}] ${match[0]}`);
        }
    });

    console.log(`\n🏁 Total Research Time: ${(performance.now() - startTotal).toFixed(2)}ms`);
    db.close();
}

main();
