
import { DatabaseFactory } from "../../src/resonance/DatabaseFactory";
import { ResonanceDB } from "../../src/resonance/db";

const dbPath = "public/resonance.db";

try {
    console.log("🏭 Testing DatabaseFactory...");
    const dbRaw = DatabaseFactory.connect(dbPath);
    console.log("✅ Factory Connected.");
    dbRaw.close();

    console.log("🧠 Testing ResonanceDB...");
    const rdb = new ResonanceDB(dbPath);
    console.log("✅ ResonanceDB Initialized (and Migrated).");
    
    // Test VectorEngine
    const { VectorEngine } = await import("../../src/core/VectorEngine");
    const ve = new VectorEngine(rdb.getRawDb());
    console.log("✅ VectorEngine Initialized.");
    
    await ve.search("Excalibur", 1);
    console.log("✅ Vector Search Complete.");

    const count = rdb.getRawDb().query("SELECT COUNT(*) as c FROM nodes").get();
    console.log("Node Count:", count);
    
    rdb.close();
    console.log("✅ Success");
} catch (e) {
    console.error("❌ Failed:", e);
}
