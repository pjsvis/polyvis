import { ResonanceDB } from "@resonance/src/db";
import { Embedder } from "@resonance/src/services/embedder";
import { join } from "path";
import settings from "@/polyvis.settings.json";

async function main() {
    const query = Bun.argv[2];
    if (!query) {
        console.error("Please provide a query: bun run scripts/verify/ask_context.ts 'How do I X?'");
        process.exit(1);
    }

    console.log(`🔍 Asking Context: "${query}"`);

	const dbPath = join(process.cwd(), settings.paths.database.resonance);
    const db = new ResonanceDB(dbPath);
    const embedder = Embedder.getInstance();

    const vector = await embedder.embed(query);
    if (!vector) {
        console.error("❌ Failed to embed query.");
        process.exit(1);
    }

    // Use findSimilar API
    const results = db.findSimilar(vector, 5, 'experience');

    console.log(`\n📋 Top 5 Matches (Domain: experience):`);
    results.forEach((r, i) => {
        console.log(`   ${i+1}. [${r.id}] (${r.score.toFixed(4)}) - ${r.label}`);
    });

    if (results.length === 0) {
        console.log("   (No matches found in 'experience' domain)");
    }
}

main();
