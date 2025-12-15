import { Ingestor } from "@src/pipeline/Ingestor";
import { parseArgs } from "util";

/**
 * THE BRIDGE: Ingestion Pipeline CLI
 */
async function main() {
    const { values } = parseArgs({
        args: Bun.argv,
        options: {
            file: { type: "string" },
            dir: { type: "string" },
            db: { type: "string" },
        },
        strict: false,
    });

    const ingestor = new Ingestor(values.db ? String(values.db) : undefined);
    const success = await ingestor.run({
        file: values.file ? String(values.file) : undefined,
        dir: values.dir ? String(values.dir) : undefined,
    });

    if (!success) {
        process.exit(1);
    }
}

if (import.meta.main) {
    main().catch(console.error);
}
