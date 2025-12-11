import { Database } from "bun:sqlite";
import { join } from "path";
import settings from "@/polyvis.settings.json";

console.log("🧹 Checkpointing Database...");
const dbPath = join(process.cwd(), settings.paths.database.resonance);
const db = new Database(dbPath);
db.run("PRAGMA wal_checkpoint(TRUNCATE);"); // Force move from WAL to DB
db.close();
console.log("✅ Database Checkpointed.");
