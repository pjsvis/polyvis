import { ResonanceDB } from "@src/resonance/db";
import { AutoTagger } from "@src/gardeners/AutoTagger";
import { parseArgs } from "util";

// Parse Args
const { values } = parseArgs({
    args: Bun.argv,
    options: {
        agent: { type: "string" },
        limit: { type: "string" }, // parseArgs considers numbers as strings often? Safe to cast.
    },
    strict: true,
    allowPositionals: true,
});

const limit = values.limit ? parseInt(values.limit) : 5;
const agentName = values.agent || "tag";

async function main() {
    console.log("🌿 PolyVis Garden CLI");
    
    // Load Settings (to get DB path)
    let settings: any = {};
    try {
        const text = await Bun.file("polyvis.settings.json").text();
        settings = JSON.parse(text);
    } catch(e) {
        settings = { paths: { database: { resonance: "public/resonance.db" } } };
    }

    const dbPath = settings.paths.database.resonance;
    const db = new ResonanceDB(dbPath);

    if (agentName === "tag") {
        const gardener = new AutoTagger(db);
        await gardener.run(limit);
    } else {
        console.error(`Unknown agent: ${agentName}`);
    }
}

main();
