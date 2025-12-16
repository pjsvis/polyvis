import { DatabaseFactory } from "@src/resonance/DatabaseFactory";


console.log("🧹 Checkpointing Database...");
const db = DatabaseFactory.connectToResonance();
db.run("PRAGMA wal_checkpoint(TRUNCATE);"); // Force move from WAL to DB
db.close();
console.log("✅ Database Checkpointed.");
