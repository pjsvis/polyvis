
import { Database } from "bun:sqlite";
import { join } from "path";

const db = new Database("public/data/ctx.db");
const query = db.query("SELECT * FROM edges WHERE source = 'bun-playbook' OR target = 'bun-playbook'");
const edges = query.all();
console.log(JSON.stringify(edges, null, 2));
db.close();
