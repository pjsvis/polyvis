import { ResonanceDB } from "@resonance/src/db";
import { join } from "path";
import settings from "@/polyvis.settings.json";

const dbPath = join(process.cwd(), settings.paths.database.resonance);
const db = new ResonanceDB(dbPath);

const rows = db["db"]
	.query("SELECT id, title FROM nodes ORDER BY rowid DESC LIMIT 5")
	.all();
console.log("Recent Nodes:", rows);

const edges = db["db"].query("SELECT * FROM edges").all();
console.log(`Edges Count: ${edges.length}`);

db.close();
