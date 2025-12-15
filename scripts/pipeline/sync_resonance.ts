import { ResonanceSync } from "@src/pipeline/ResonanceSync";
import { parseArgs } from "util";

/**
 * RESONANCE SYNC CLI
 */
async function main() {
    const { values } = parseArgs({
        args: Bun.argv,
        options: {
            limit: { type: "string" },
        },
        strict: true,
        allowPositionals: true,
    });

    const limit = values.limit ? parseInt(values.limit) : Infinity;
    const sync = new ResonanceSync();
    await sync.run(limit);
}

if (import.meta.main) {
    main().catch(console.error);
}
