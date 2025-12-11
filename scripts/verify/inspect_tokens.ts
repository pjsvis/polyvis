import { Database } from "bun:sqlite";

const db = new Database(".resonance/resonance.db");
const rows = db
	.query(`
    SELECT id, meta 
    FROM nodes 
    LIMIT 20
`)
	.all();

console.log("=== SEMANTIC TOKEN SAMPLE ===");
for (const row of rows as any[]) {
	try {
		const meta = JSON.parse(row.meta);
		if (meta.semantic_tokens) {
			const tokens = meta.semantic_tokens;
			const hasData = Object.values(tokens).some((arr: any) => arr.length > 0);

			if (hasData) {
				console.log(`\n[${row.id}]`);
				console.log(JSON.stringify(tokens, null, 2));
			}
		}
	} catch (e) {
		// ignore
	}
}
