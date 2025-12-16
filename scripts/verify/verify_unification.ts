import { ResonanceDB } from "@src/resonance/db";
import { Database } from "bun:sqlite";
import { Embedder } from "@src/resonance/services/embedder";
import { VectorEngine } from "@src/core/VectorEngine";
import settings from "@/polyvis.settings.json";

async function main() {
	console.log("🔍 Verifying Unification...");
	const db = new ResonanceDB(settings.paths.database.resonance);

	// 1. Check Counts
	const counts = db["db"]
		.query(`
        SELECT type, COUNT(*) as count, domain 
        FROM nodes 
        GROUP BY type, domain
    `)
		.all();

	console.table(counts);

	// 4. Check Aliases (using 'alias' rel)
	const aliases = db["db"]
		.query("SELECT * FROM edges WHERE type = 'alias'")
		.all() as any[];
	console.log(`   Aliases Found: ${aliases.length}`);

	// 5. Check 'cites' edges (WikiLinks)
	const cites = db["db"]
		.query("SELECT * FROM edges WHERE type = 'CITES'")
		.all() as any[];
	console.log(`   Citations Found: ${cites.length}`);
	if (cites.length > 0) {
		console.log(`      Example: ${cites[0].source} -> ${cites[0].target}`);
	}

	// 2. Check AST Sections
	const sectionStat = counts.find((c: any) => c.type === "section") as any;
	const sectionCount = sectionStat ? sectionStat.count : 0;
	if (sectionCount > 0) {
		console.log(`✅ AST Chunking Active: ${sectionCount} sections found.`);
	} else {
		console.error("❌ AST Chunking Failed: No sections found.");
	}

	// 3. Test Mixed Search
	console.log("\n🧪 Running Mixed Vector Search ('simplicity')...");
	const embedder = Embedder.getInstance();
	const vec = await embedder.embed("simplicity and complexity"); // Search for known concept

	const ve = new VectorEngine(db.getRawDb());
	const results = await ve.searchByVector(vec, 10);

	console.log("   Top 10 Matches:");
	results.forEach((r: any) => {
		// Fetch type for display
		const node = db["db"]
			.query("SELECT type, domain FROM nodes WHERE id = ?")
			.get(r.id) as any;
		console.log(
			`   - [${node.domain}/${node.type}] ${r.label} (${r.score.toFixed(3)})`,
		);
	});

	// Check if we have mixed domains
	const domains = new Set(
		results.map((r: any) => {
			const node = db["db"]
				.query("SELECT domain FROM nodes WHERE id = ?")
				.get(r.id) as any;
			return node.domain;
		}),
	);

	if (domains.has("persona") && domains.has("resonance")) {
		console.log(
			"\n✅ SUCCESS: Search returns both Lexicon (Persona) and Experience (Resonance).",
		);
	} else {
		console.warn(
			"\n⚠️ WARNING: Search did not return mixed domains. (Might be expected if query is too specific to one)",
		);
	}

	db.close();
}

main().catch(console.error);
