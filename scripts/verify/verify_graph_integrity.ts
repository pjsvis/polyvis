import { Database } from "bun:sqlite";
import { existsSync } from "fs";
import { join } from "path";
import settings from "@/polyvis.settings.json";

// Resolve DB path relative to root
const DB_PATH = join(process.cwd(), settings.paths.database.legacy);

if (!existsSync(DB_PATH)) {
	console.error(`❌ Database not found at: ${DB_PATH}`);
	process.exit(1);
}

const db = new Database(DB_PATH);

console.log(`🔍 Verifying Integrity of '${DB_PATH}'...\n`);

// 1. Snapshot Counts
console.log(`📊 Stats:`);
const nodesSchema = db.query("PRAGMA table_info(nodes)").all();
console.log("Schema for 'nodes':", nodesSchema);
const edgesSchema = db.query("PRAGMA table_info(edges)").all();
console.log("Schema for 'edges':", edgesSchema);

const nodeCount = db.query("SELECT COUNT(*) as count FROM nodes").get() as {
	count: number;
};
const edgeCount = db.query("SELECT COUNT(*) as count FROM edges").get() as {
	count: number;
};

console.log(`   - Nodes: ${nodeCount.count}`);
console.log(`   - Edges: ${edgeCount.count}`);

// 2. Critical Lexicon Nodes (Must Exist)
const criticalNodes = ["OH-001", "term-001", "COG-1"];
let missingCritical = false;

for (const id of criticalNodes) {
	const exists = db.query("SELECT 1 FROM nodes WHERE id = ?").get(id);
	if (!exists) {
		console.error(`❌ CRITICAL ERROR: Base node '${id}' is missing!`);
		missingCritical = true;
	}
}

if (!missingCritical) {
	console.log(`✅ Base Lexicon Nodes Verified.`);
}

// 3. Experience Layer Check
const expNodes = db
	.query(
		"SELECT COUNT(*) as count FROM nodes WHERE type IN ('playbook', 'debrief')",
	)
	.get() as { count: number };
const expEdges = db
	.query(
		"SELECT COUNT(*) as count FROM edges WHERE type IN ('CITES', 'REFERENCES')",
	)
	.get() as { count: number };

console.log(`\n📘 Experience Layer:`);
console.log(`   - Experience Nodes: ${expNodes.count}`);
console.log(`   - Semantic Edges (CITES/REF): ${expEdges.count}`);

if (expNodes.count > 0 && expEdges.count === 0) {
	console.warn(
		`⚠️  WARNING: Experience nodes exist but have NO connections to the graph.`,
	);
}

db.close();
console.log("\n------------------------------------------------");
