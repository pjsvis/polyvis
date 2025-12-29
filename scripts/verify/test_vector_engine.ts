import { VectorEngine } from "@src/core/VectorEngine";
import { ResonanceDB } from "@src/resonance/db";
import settings from "@/polyvis.settings.json";

async function test() {
	console.log("🧪 Testing Pure Bun Vector Engine...");

	const db = ResonanceDB.init();
	const engine = new VectorEngine(db.getRawDb());

	// 1. Generate & Save
	console.log("Generating embedding for Genesis Node...");
	const text = "The singular origin point of the PolyVis context.";
	const vector = await engine.embed(text);

	if (vector) {
		console.log(`✅ Generated vector: ${vector.length} dimensions`);
		engine.saveEmbedding("000-GENESIS", vector);
		console.log("✅ Saved to DB");
	} else {
		console.error("❌ Failed to generate vector. Is Ollama running?");
		process.exit(1);
	}

	// 2. Search
	const query = "origin point";
	console.log(`🔍 Searching for: "${query}"...`);
	const results = await engine.search(query);

	console.log("Results:");
	results.forEach((r) => {
		console.log(`  - [${r.score.toFixed(4)}] ${r.id}: ${r.content}`);
	});
}

test();
