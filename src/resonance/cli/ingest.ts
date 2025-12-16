
import { Ingestor } from "@src/pipeline/Ingestor";
import { ZombieDefense } from "@src/utils/ZombieDefense";
import { parseArgs } from "util";

// Parse CLI
const { values } = parseArgs({
  args: Bun.argv,
  options: {
    file: {
      type: 'string',
    },
    dir: {
      type: 'string',
    },
    db: {
      type: 'string',
    },
  },
  strict: true,
  allowPositionals: true,
});

const ingestor = new Ingestor(values.db);

// Zombie Defense: Ensure clean slate before heavy I/O
await ZombieDefense.assertClean("Ingest", true);

console.log("🚀 Starting Ingestion...");
const result = await ingestor.run({
    file: values.file,
    dir: values.dir,
    dbPath: values.db
});

if (!result) {
    console.error("❌ Ingestion Failed");
    process.exit(1);
}

console.log("✅ Ingestion Success");
process.exit(0);
