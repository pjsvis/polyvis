import { TimelineWeaver } from "@src/core/TimelineWeaver";
import { ResonanceDB } from "@src/resonance/db";
import { DatabaseFactory } from "@/src/resonance/DatabaseFactory";

console.log("🔍 Verifying Timeline Weaver...");

const db = ResonanceDB.init();

// 1. Run Weaver
TimelineWeaver.weave(db);

// 2. Check Edges (via raw check for speed/independence)
const rawDb = DatabaseFactory.connectToResonance({ readonly: true });
try {
	const result = rawDb
		.query("SELECT COUNT(*) as c FROM edges WHERE type = 'SUCCEEDS'")
		.get() as any;
	console.log(
		`✅ Verification: Found ${result.c} 'SUCCEEDS' edges in database.`,
	);
} catch (e) {
	console.error("❌ Verification Failed:", e);
} finally {
	rawDb.close();
	// ResonanceDB closes itself on process exit usually, or we can leave it open as script ends.
}
