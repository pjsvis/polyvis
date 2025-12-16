import { ResonanceDB } from "@src/resonance/db";

const db = ResonanceDB.init();

const rows = db["db"]
	.query("SELECT id, title FROM nodes ORDER BY rowid DESC LIMIT 5")
	.all();
console.log("Recent Nodes:", rows);

const edges = db["db"].query("SELECT * FROM edges").all();
console.log(`Edges Count: ${edges.length}`);

db.close();
