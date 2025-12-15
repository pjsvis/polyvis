import { ResonanceDB } from "@src/resonance/db";
import { nodes as schemaNodes } from "@src/db/schema.js";

const db = new ResonanceDB();
console.log("🔍 Verifying Ingestion...");

// 1. Check GENESIS
const genesis = db["db"]
	.query("SELECT * FROM nodes WHERE id = '000-GENESIS'")
	.get();
console.log("   GENESIS:", genesis ? "✅ Found" : "❌ Missing");

// 2. Check EXPERIENCE
const experience = db["db"]
	.query("SELECT * FROM nodes WHERE id = 'EXPERIENCE'")
	.get();
console.log("   EXPERIENCE:", experience ? "✅ Found" : "❌ Missing");

// 3. Check Edge
const edge = db["db"]
	.query(
		"SELECT * FROM edges WHERE source = '000-GENESIS' AND target = 'EXPERIENCE'",
	)
	.get();
console.log("   GENESIS->EXPERIENCE:", edge ? "✅ Found" : "❌ Missing");

// 4. Check Content Nodes
const nodes = db["db"]
	.query(
		"SELECT id, type, title FROM nodes WHERE type IN ('debrief', 'playbook')",
	)
	.all() as any[];
console.log(`   Content Nodes Found: ${nodes.length}`);
nodes.forEach((n) => console.log(`      - [${n.type}] ${n.title} (${n.id})`));

// 5. Check Content Edges
const contentEdges = db["db"]
	.query("SELECT * FROM edges WHERE source = 'EXPERIENCE'")
	.all() as any[];
console.log(`   Content Edges Found: ${contentEdges.length}`);
contentEdges.forEach((e) => console.log(`      - -> ${e.target} (${e.type})`));

db.close();
