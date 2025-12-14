import { Database } from "bun:sqlite";
import settings from "@/polyvis.settings.json";
import { join } from "path";

const dbPath = join(process.cwd(), settings.paths.database.resonance);
console.log(`🧹 Cleaning Legacy Domains in: ${dbPath}`);

const db = new Database(dbPath);

try {
    const result = db.run("DELETE FROM nodes WHERE domain = 'knowledge'");
    console.log(`Deleted ${result.changes} nodes from domain 'knowledge'.`);
    
    const result2 = db.run("DELETE FROM edges WHERE source IN (SELECT id FROM nodes WHERE domain = 'knowledge')");
    console.log(`Deleted orphan edges.`);

} catch (e) {
    console.error("Error cleaning database:", e);
} finally {
    db.close();
}
