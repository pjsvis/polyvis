import { ResonanceDB } from "@src/resonance/db";
import { TimelineWeaver } from "@src/core/TimelineWeaver";

const db = new ResonanceDB();
console.log("🔍 Verifying Timeline Weaver...");

// 1. Run Weaver
TimelineWeaver.weave(db);

// 2. Check Edges
// Need to access db directly or via helper. ResonanceDB wraps bun:sqlite but doesn't expose it fully public.
// But we can check via getStats or just trust the Weaver's console output which we will see.
// To be sure, let's query the specific edges.
// I'll add a temporary method or just inspect via raw sqlite in a separate command if needed.
// Actually, I can use db['db'].query if I suppress TS, but cleaner to just rely on the logs for now
// or add a specific check to the script if I can import Database from bun:sqlite.

import { Database } from "bun:sqlite";
import settings from "@/polyvis.settings.json";

const rawDb = new Database(settings.paths.database.resonance);
const count = rawDb.query("SELECT COUNT(*) as c FROM edges WHERE type = 'SUCCEEDS'").get() as any;

console.log(`✅ Verification: Found ${count.c} 'SUCCEEDS' edges in database.`);
