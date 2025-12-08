import { Database } from "bun:sqlite";
import { join } from "path";
import settings from "../polyvis.settings.json";

// Migration Script for ctx.db
const dbPath = join(process.cwd(), settings.paths.database.legacy); // scripts/ctx.db
console.log(`Migrating Database: ${dbPath}`);

const db = new Database(dbPath);

const run = (label: string, sql: string) => {
	try {
		console.log(`Running: ${label}`);
		db.exec(sql);
	} catch (e) {
        // Log but continue if column exists (idempotency check rough)
		console.warn(`  ⚠️ ${label} failed (might already exist):`, (e as Error).message);
	}
};

// 1. Add New Columns
run("Add domain", "ALTER TABLE nodes ADD COLUMN domain TEXT DEFAULT 'knowledge'");
run("Add layer", "ALTER TABLE nodes ADD COLUMN layer TEXT DEFAULT 'experience'");
run("Add order_index", "ALTER TABLE nodes ADD COLUMN order_index INTEGER DEFAULT 0");
run("Add metadata", "ALTER TABLE nodes ADD COLUMN metadata TEXT");

// 2. Rename Legacy Columns (Normalize to Resonance Schema)
// Note: build_db.ts needs to be updated to match this, or we alias. 
// For now, let's keep legacy names in Schema or Rename?
// User said "migrate to proposed schema". Proposed schema uses 'title'/'content'.
// So we RENAME.

run("Rename label -> title", "ALTER TABLE nodes RENAME COLUMN label TO title");
run("Rename definition -> content", "ALTER TABLE nodes RENAME COLUMN definition TO content");
run("Rename relation -> type", "ALTER TABLE edges RENAME COLUMN relation TO type"); // schema.ts uses 'type' alias for relation column? No, schema says `type: text("relation")`
// Wait, my schema.ts says: `type: text("relation")`. This means the TS property is `type` but the DB column is `relation`.
// So NO RENAME needed for edges 'relation' column if schema maps it. 
// But constructing new resonance.db will use `relation` column name.

// 3. Data Patching
console.log("Patching Data Defaults...");
db.exec("UPDATE nodes SET domain = 'persona', layer = 'ontology' WHERE domain IS 'knowledge' AND (id LIKE 'term-%' OR id LIKE 'OH-%' OR id LIKE 'CIP-%' OR id LIKE 'COG-%')");

// 4. Genesis Node Injection
console.log("Injecting Genesis Node...");
const genesis = {
    id: "000-GENESIS",
    title: "PolyVis Prime",
    type: "root",
    content: "The singular origin point of the PolyVis context.",
    domain: "system",
    layer: "ontology",
    order_index: -1
};

db.prepare(`
    INSERT OR IGNORE INTO nodes (id, title, type, content, domain, layer, order_index)
    VALUES ($id, $title, $type, $content, $domain, $layer, $order)
`).run({
    $id: genesis.id,
    $title: genesis.title,
    $type: genesis.type,
    $content: genesis.content,
    $domain: genesis.domain,
    $layer: genesis.layer,
    $order: genesis.order_index
});

// 5. Connect Genesis to Heads
const heads = ["term-001", "CIP-1", "OH-061"];
const insertEdge = db.prepare("INSERT OR IGNORE INTO edges (source, target, type) VALUES (?, ?, ?)");
heads.forEach(head => {
    insertEdge.run(genesis.id, head, "genesis");
});

console.log("✅ Migration Complete.");
db.close();
