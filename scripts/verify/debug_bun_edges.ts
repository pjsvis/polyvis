import { Database } from "bun:sqlite";

const db = new Database("public/data/ctx.db"); // TODO: DEPRECATED ctx.db - Replace with resonance.db
const query = db.query("SELECT * FROM edges WHERE source = 'bun-playbook' OR target = 'bun-playbook'");
const edges = query.all();
console.log(JSON.stringify(edges, null, 2));
db.close();
