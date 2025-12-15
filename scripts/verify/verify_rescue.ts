import { ResonanceDB } from "@src/resonance/db";
import { SemanticWeaver } from "@src/core/SemanticWeaver";
import { Database } from "bun:sqlite";
import settings from "@/polyvis.settings.json";

const db = new ResonanceDB();
// const rawDb = new Database(settings.paths.database.resonance); // CAUSED LOCK

console.log("🔍 Verifying Semantic Rescue...");

// 1. Snapshot Edge Count (RELATED_TO)
// Access underlying bun:sqlite instance (hack for verify script)
const initial = (db as any).db.query("SELECT COUNT(*) as c FROM edges WHERE type = 'RELATED_TO'").get() as any;
console.log(`initial RELATED_TO count: ${initial.c}`);

// 2. Run Weaver
SemanticWeaver.weave(db);

// 3. Check Diff
const final = (db as any).db.query("SELECT COUNT(*) as c FROM edges WHERE type = 'RELATED_TO'").get() as any;
const delta = final.c - initial.c;

console.log(`✅ Verification: Created ${delta} new 'RELATED_TO' edges.`);
