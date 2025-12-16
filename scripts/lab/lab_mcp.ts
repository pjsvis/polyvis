import { DatabaseFactory } from "@src/resonance/DatabaseFactory";
import { VectorEngine } from "@src/core/VectorEngine";
import settings from "@/polyvis.settings.json";

console.log("🧊 LAB: MCP (Reader) Starting...");
const dbPath = settings.paths.database.resonance;
// STRICTLY TEST READWRITE + WAL
const db = DatabaseFactory.connect(dbPath);
const vectorEngine = new VectorEngine(db); // Use Engine

let count = 0;
const interval = setInterval(async () => {
    try {
        count++;
        // Heavy Vector Search
        // We search for "Excalibur" each time.
        const results = await vectorEngine.search("Excalibur", 1);
        
        if (count % 10 === 0) process.stdout.write(`V(${results.length}) `); // Visual heartbeat
    } catch (e: any) {
        console.error("\n❌ READER ERROR:", e.message);
        // If it's the I/O error, we found our reproduction!
        if (e.message.includes("disk I/O error")) {
            console.error("🚨 REPRODUCTION CONFIRMED: Disk I/O Error during Vector Search.");
            process.exit(1);
        }
    }
}, 200); // Slightly slower to allow for embedding time

process.on("SIGINT", () => {
    console.log("\n🛑 Reader Stopping...");
    process.exit(0);
});
