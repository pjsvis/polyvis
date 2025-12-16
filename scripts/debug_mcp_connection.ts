import { ResonanceDB } from "@src/resonance/db";
import { VectorEngine } from "@src/core/VectorEngine";
import settings from "@/polyvis.settings.json";

console.log("🕵️‍♀️ Debugging MCP Readonly Connection...");

const dbPath = settings.paths.database.resonance;

try {
    console.log(`📂 Opening DB: ${dbPath} (Readonly)`);
    // Replicate MCP logic EXACTLY
    const db = new ResonanceDB(dbPath, { readonly: true });
    
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
