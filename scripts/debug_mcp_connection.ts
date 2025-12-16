import { ResonanceDB } from "@src/resonance/db";
import { VectorEngine } from "@src/core/VectorEngine";


console.log("🕵️‍♀️ Debugging MCP Readonly Connection...");

try {
    const db = ResonanceDB.init({ readonly: true });
    console.log(`📂 Opening DB (Readonly)`);
    
    // Check Pragmas
    const journal = db.getRawDb().query("PRAGMA journal_mode;").get();
    console.log(`⚙️  Journal Mode: ${JSON.stringify(journal)}`);

    console.log("🔍 Attempting Vector Search Query (The Failing Step)...");
    const vectorEngine = new VectorEngine(db.getRawDb());
    
    // Simulate search
    const results = await vectorEngine.search("Excalibur", 1);
    console.log("✅ Query Success!", results);

} catch (e) {
    console.error("❌ CRITICAL FAILURE:", e);
}
