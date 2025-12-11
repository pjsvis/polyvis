import { Database } from "bun:sqlite";
import type { IngestionArtifact } from "@src/types/artifact.js";
import { join } from "path";
import settings from "@/polyvis.settings.json";

// 1. Setup DB
const dbPath = join(process.cwd(), settings.paths.database.resonance);
console.log(`Loading into Database: ${dbPath}`);

// Ensure dir exists
const dir = join(dbPath, "..");
if (!require("fs").existsSync(dir))
	require("fs").mkdirSync(dir, { recursive: true });

const sqlite = new Database(dbPath);

// 2. Initialize Schema
// Since we don't have migration artifacts for this new DB, we can use Drizzle Kit 'push'
// OR simpler: just replicate the raw CREATE TABLE SQL matching ctx.db?
// For robust "Round Trip", having the Tables is enough.
// I will iterate Schema.ts? No, Drizzle doesn't auto-create tables at runtime without 'migrate'.
// I will use raw SQL to Bootstrap matching the Schema.
sqlite.exec(`
    CREATE TABLE IF NOT EXISTS nodes (
        id TEXT PRIMARY KEY,
        type TEXT NOT NULL,
        title TEXT,
        content TEXT,
        domain TEXT DEFAULT 'knowledge',
        layer TEXT DEFAULT 'experience',
        order_index INTEGER DEFAULT 0,
        metadata TEXT,
        external_refs TEXT
    );
    CREATE TABLE IF NOT EXISTS edges (
        source TEXT NOT NULL,
        target TEXT NOT NULL,
        type TEXT NOT NULL,
        metadata TEXT
    );
`);
// Ideally, use Drizzle Kit via CLI, but inline for script is fine for v1.

// 3. Load Artifacts
const artifactPath = join(
	process.cwd(),
	".resonance",
	"artifacts",
	"docs.json",
);
const artifacts: IngestionArtifact[] = await Bun.file(artifactPath).json();

console.log(`Inserting ${artifacts.length} artifacts...`);

const insertStmt = sqlite.prepare(`
    INSERT OR REPLACE INTO nodes (id, type, title, content, domain, layer, order_index, metadata)
    VALUES ($id, $type, $title, $content, $domain, $layer, $order, $meta)
`);

const transaction = sqlite.transaction((items: IngestionArtifact[]) => {
	for (const item of items) {
		insertStmt.run({
			$id: item.id,
			$type: item.type,
			$title: item.payload.title,
			$content: item.payload.content,
			$domain: item.payload.domain,
			$layer: item.payload.layer,
			$order: item.order_index,
			$meta: JSON.stringify(item.payload.metadata || {}),
		});
	}
});

transaction(artifacts);

console.log("✅ Load Complete.");
sqlite.close();
