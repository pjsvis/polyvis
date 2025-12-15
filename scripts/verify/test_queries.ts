import { ResonanceDB } from "@resonance/src/db";
import { Embedder } from "@resonance/src/services/embedder";
import { join } from "path";
import settings from "@/polyvis.settings.json";

async function main() {
    console.log("🧪 Running Resonance Query Field Tests...\n");
    const dbPath = join(process.cwd(), settings.paths.database.resonance);
    const db = new ResonanceDB(dbPath);
    const embedder = Embedder.getInstance();

    // 1. SQL Metadata Test
    console.log("1️⃣  SQL Metadata Check");
    const nodeCount = db['db'].query("SELECT COUNT(*) as count FROM nodes").get() as { count: number };
    console.log(`   ✅ Nodes: ${nodeCount.count}`);
    if (nodeCount.count === 0) throw new Error("Database is empty!");

    // 2. Vector Search Test
    console.log("\n2️⃣  Vector Search Check");
    const vecStart = performance.now();
    const query = "Resonance Engine Architecture";
    const embedding = await embedder.embed(query);
    if (!embedding) throw new Error("Embedding failed");
    
    const vectorResults = db.findSimilar(embedding, 3);
    const vecTime = (performance.now() - vecStart).toFixed(2);
    console.log(`   ✅ Found ${vectorResults.length} matches in ${vecTime}ms`);
    vectorResults.forEach(r => console.log(`      - [${r.score.toFixed(2)}] ${r.label}`));

    // 3. Graph Traversal Test
    console.log("\n3️⃣  Graph Connectivity Check");
    // Find a node with edges
    const centerNode = db['db'].query(`
        SELECT source FROM edges GROUP BY source HAVING COUNT(*) > 0 LIMIT 1
    `).get() as { source: string };
    
    if (centerNode) {
        const neighbors = db['db'].query(`
            SELECT target, type FROM edges WHERE source = ?
        `).all(centerNode.source) as any[];
        console.log(`   ✅ Node '${centerNode.source}' has ${neighbors.length} outgoing edges.`);
        neighbors.slice(0, 3).forEach(n => console.log(`      -> [${n.type}] ${n.target}`));
    } else {
        console.warn("   ⚠️ No edges found in graph (Islands?).");
    }

    // 4. FTS (Full Text Search) Check
    console.log("\n4️⃣  Full Text Search (FTS) Check");
    // Note: We might not have an exclusive FTS table yet, testing raw LIKE for now as a proxy if FTS isn't set up
    // But let's check if we can find "Resonance" in content
    const ftsStart = performance.now();
    const ftsResults = db['db'].query(`
        SELECT id, title FROM nodes 
        WHERE content LIKE '%Recursive%' 
        LIMIT 3
    `).all() as any[];
    const ftsTime = (performance.now() - ftsStart).toFixed(2);
    
    console.log(`   ✅ Found ${ftsResults.length} matches for 'Recursive' in ${ftsTime}ms`);
    ftsResults.forEach(r => console.log(`      - ${r.title || r.id}`));

    db.close();
    console.log("\n🎉 All Tests Completed.\n");
}

main();
