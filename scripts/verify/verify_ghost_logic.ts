
import { Database } from "bun:sqlite";
import { dotProduct } from "@src/js/utils/math.js";

// Verify alias usage (as requested)
// Note: This script uses relative import for math.js because it's a JS file in src.
// Ideally we'd use @src/js/utils/math.js if aliases are set up.

console.log("🧪 Testing Ghost Graph SQL Logic...");

const db = new Database(".resonance/resonance.db");

// 1. Inject UDF (mirroring index.html logic)
// Bun:sqlite uses .function()
// Note: bun:sqlite passes Uint8Array for BLOBs automatically.
db.function("vec_dot", (a: Uint8Array, b: Uint8Array) => {
    return dotProduct(a, b);
});

// 2. Pick a random node with a vector
const sourceNode = db.query("SELECT id, label, embedding FROM nodes WHERE embedding IS NOT NULL LIMIT 1").get() as any;

if (!sourceNode) {
    console.error("❌ No nodes with embeddings found!");
    process.exit(1);
}

console.log(`🎯 Source: [${sourceNode.id}] ${sourceNode.label}`);

// 3. Run Similarity Query
const query = `
    SELECT id, label, vec_dot(embedding, $vec) as score 
    FROM nodes 
    WHERE id != $id 
    AND embedding IS NOT NULL
    ORDER BY score DESC 
    LIMIT 5
`;

// Note: Bun sqlite might behave differently with BLOB binding than sql.js
// but we just want to verify the MATH and UDF logic works.
try {
    const results = db.query(query).all({ $vec: sourceNode.embedding, $id: sourceNode.id }) as any[];
    
    console.log(`👻 Found ${results.length} neighbors:`);
    results.forEach(r => {
        console.log(`   - [${r.score.toFixed(3)}] ${r.label} (${r.id})`);
    });

    if (results.length > 0 && results[0].score > 0) {
        console.log("✅ Vector search successful.");
    } else {
        console.warn("⚠️ No similar nodes found (or score is 0).");
    }

} catch (e) {
    console.error("❌ Query failed:", e);
}
