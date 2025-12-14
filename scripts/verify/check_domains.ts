import { Database } from "bun:sqlite";
import settings from "@/polyvis.settings.json";
import { join } from "path";

const dbPath = join(process.cwd(), settings.paths.database.resonance);
console.log(`🔍 Checking Domains in: ${dbPath}`);

const db = new Database(dbPath);

try {
    const query = db.query("SELECT domain, COUNT(*) as count FROM nodes GROUP BY domain");
    const results = query.all() as { domain: string; count: number }[];
    console.table(results);
    
    // Check for distinctness
    const domains = results.map((r) => r.domain);
    console.log(`found ${domains.length} distinct domains: ${domains.join(", ")}`);

} catch (e) {
    console.error("Error querying database:", e);
} finally {
    db.close();
}
