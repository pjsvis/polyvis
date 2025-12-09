
import { ResonanceDB } from "../resonance/src/db";
import { Embedder } from "../resonance/src/services/embedder";
import { unlinkSync } from "node:fs";
import { join } from "path";

const TEST_DB = join(process.cwd(), ".resonance/test_pure.db");

console.log("🚀 Starting Pure Bun Resonance Test");

try {
    // Cleanup previous run
    try { unlinkSync(TEST_DB); } catch {}
    try { unlinkSync(TEST_DB + "-shm"); } catch {}
    try { unlinkSync(TEST_DB + "-wal"); } catch {}

    console.log("1. Init DB");
    const db = new ResonanceDB(TEST_DB);
    
    // Auto-migrate for test
    db["db"].run(`
        CREATE TABLE IF NOT EXISTS nodes (
            id TEXT PRIMARY KEY,
            type TEXT,
            title TEXT,
            content TEXT,
            domain TEXT,
            layer TEXT,
            embedding BLOB
        )
    `);

    console.log("2. Init Embedder");
    await Embedder.init();

    const text = "The quick brown fox jumps over the lazy dog";
    console.log(`3. Embed '${text}'`);
    const vec = await Embedder.embed(text);
    console.log("   Vector dim:", vec.length);

    console.log("4. Insert Node");
    db.insertNode({
        id: "test-node-1",
        type: "test",
        label: "Fox Node",
        content: text,
        embedding: vec
    });

    const query = "running fox";
    console.log(`5. Query '${query}'`);
    const queryVec = await Embedder.embed(query);
    const results = db.findSimilar(queryVec, 1);
    
    console.log("   Results:", results);

    if (results.length > 0 && results[0].id === "test-node-1") {
        console.log("✅ SUCCESS: Found semantic match");
        
        // Clean up
        db.close();
        unlinkSync(TEST_DB);
        try { unlinkSync(TEST_DB + "-shm"); } catch {}
        try { unlinkSync(TEST_DB + "-wal"); } catch {}
        
    } else {
        console.error("❌ FAILURE: Node not found");
        process.exit(1);
    }

} catch (e) {
    console.error("❌ ERROR:", e);
    process.exit(1);
}
