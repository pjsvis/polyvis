
import { ResonanceDB } from "../../resonance/src/db";
import { resolve } from "path";

const dbPath = resolve(process.cwd(), "public/resonance.db");
const db = new ResonanceDB(dbPath);

console.log("🔍 Verifying Graph Integrity...");
console.log(`📂 Database: ${dbPath}`);

// 1. Check for Super Nodes (Hairballs)
console.log("\n--- Super Node Check (Hairball Prevention) ---");
const superNodes = db['db'].query(`
    SELECT target, COUNT(*) as degree 
    FROM edges 
    GROUP BY target 
    HAVING degree > 50
    ORDER BY degree DESC
`).all() as { target: string; degree: number }[];

if (superNodes.length === 0) {
    console.log("✅ No super nodes found (>50 degree). LouvainGate is working.");
} else {
    console.warn(`⚠️ Found ${superNodes.length} potential super nodes:`);
    superNodes.forEach(n => console.log(`   - ${n.target}: ${n.degree} edges`));
}

// 2. Modularity / Density (Basic Proxy)
console.log("\n--- Graph Density Proxy ---");
const stats = db.getStats();
const density = stats.edges / (stats.nodes * (stats.nodes - 1));
console.log(`Nodes: ${stats.nodes}`);
console.log(`Edges: ${stats.edges}`);
console.log(`Density (Proxy): ${density.toFixed(6)}`);

if (density < 0.1) {
    console.log("✅ Graph is sparse (Good for structure).");
} else {
    console.warn("⚠️ Graph might be too dense.");
}

// 3. Orphan Check
console.log("\n--- Orphan Check ---");
const orphans = db['db'].query(`
    SELECT id, title FROM nodes 
    WHERE id NOT IN (SELECT source FROM edges) 
    AND id NOT IN (SELECT target FROM edges)
    AND domain != 'system'
`).all() as { id: string; title: string }[];

console.log(`Found ${orphans.length} orphans.`);
if (orphans.length < 50) {
    console.log("✅ Orphan count is within acceptable limits.");
} else {
    console.warn("⚠️ High orphan count. Semantic Linking might be needed.");
}

db.close();
