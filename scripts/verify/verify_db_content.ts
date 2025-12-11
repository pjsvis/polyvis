import { Database } from "bun:sqlite";

const dbPath = process.argv[2];
if (!dbPath) {
	console.error("Please provide a database path");
	process.exit(1);
}

console.log(`Checking DB at: ${dbPath}`);
const db = new Database(dbPath);

const nodeCount = db.query("SELECT count(*) as count FROM nodes").get() as {
	count: number;
};
const edgeCount = db.query("SELECT count(*) as count FROM edges").get() as {
	count: number;
};

console.log(`Nodes: ${nodeCount.count}`);
console.log(`Edges: ${edgeCount.count}`);

// Specific Check for Experience Domain items?
// Assuming 'Experience' maps to specific node types or paths?
// Let's list some node types
const types = db
	.query("SELECT type, count(*) as count FROM nodes GROUP BY type")
	.all();
console.log("Node Types:", types);

db.close();
