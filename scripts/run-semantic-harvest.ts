/**
 * Run the Semantic Harvester pipeline end-to-end.
 *
 * Usage:
 *   bun run scripts/run-semantic-harvest.ts [target_dir]
 *   bun run scripts/run-semantic-harvest.ts briefs/local-first-classifier
 */

import { SemanticHarvester } from "@src/pipeline/SemanticHarvester";

async function main() {
	const target = process.argv[2];

	console.log("🌾 Semantic Harvester Pipeline\n");

	const harvester = new SemanticHarvester();

	// Check prerequisites
	const ready = await harvester.isReady();
	if (!ready) {
		console.error("❌ Pipeline not ready. See above for setup instructions.");
		process.exit(1);
	}

	console.log("✅ Prerequisites verified\n");

	// Run harvest
	console.log(`📄 Harvesting from: ${target || "(demo mode)"}`);
	const graph = await harvester.harvest(target);

	// Show stats
	const stats = harvester.getStats(graph);
	console.log("\n📊 Harvest Statistics:");
	console.log(
		`   Nodes: ${stats.nodes} (${stats.concepts} concepts, ${stats.documents} documents)`,
	);
	console.log(`   Edges: ${stats.edges}`);

	// Load into ResonanceDB
	if (stats.edges > 0) {
		console.log("\n💾 Loading into ResonanceDB...");
		const loaded = await harvester.loadIntoResonance(graph);
		console.log(
			`   ✅ Loaded ${loaded.nodesLoaded} nodes, ${loaded.edgesLoaded} edges`,
		);
	} else {
		console.log("\n⚠️  No edges extracted - skipping database load");
		console.log("   Tip: Run with Llama server for better extraction quality");
	}

	// Verify
	console.log("\n🔍 Verifying database...");
	const { ResonanceDB } = await import("@src/resonance/db");
	const db = ResonanceDB.init();

	const dbStats = db.getStats();
	console.log(`   Total Nodes: ${dbStats.nodes}`);
	console.log(`   Total Edges: ${dbStats.edges}`);

	// Check for semantic edges with confidence < 1.0
	const semanticEdges = db
		.getRawDb()
		.query(`
		SELECT COUNT(*) as count FROM edges 
		WHERE confidence < 1.0 OR context_source IS NOT NULL
	`)
		.get() as { count: number };

	console.log(`   Semantic Edges (with metadata): ${semanticEdges.count}`);

	db.close();
	console.log("\n✅ Pipeline complete!");
}

main().catch(console.error);
