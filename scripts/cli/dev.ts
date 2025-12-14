import { extname, join } from "path";

// Configuration
const PORT = 3000;
const PUBLIC_DIR = "public";

console.log("🚀 Starting Polyvis Development Environment...");

// 0. Free up port
try {
	const portProc = Bun.spawn(["lsof", "-t", "-i:" + PORT], {
		stderr: "ignore",
	});
	const text = await new Response(portProc.stdout).text();
	const pids = text
		.trim()
		.split("\n")
		.filter((p) => p);

	if (pids.length > 0) {
		console.log(
			`🧹 Freeing port ${PORT} (killing PIDs: ${pids.join(", ")})...`,
		);
		const killProc = Bun.spawn(["kill", "-9", ...pids]);
		await killProc.exited;
	}
} catch (e) {
	// Ignore errors if lsof fails or no process found
}

// 1. Start CSS Watcher
console.log("🎨 Starting CSS Watcher...");
const cssWatcher = Bun.spawn(["bun", "run", "watch:css"], {
	stdout: "inherit",
	stderr: "inherit",
});

// 1.5 Start JS Watcher
console.log("📜 Starting JS Watcher...");
const jsWatcher = Bun.spawn(["bun", "run", "watch:js"], {
	stdout: "inherit",
	stderr: "inherit",
});

// 2. Start Web Server
console.log(`🌍 Starting Web Server at http://localhost:${PORT}...`);

const server = Bun.serve({
	port: PORT,
	async fetch(req) {
		const url = new URL(req.url);
		let path = url.pathname;

		// Default to index.html for root
		if (path === "/") {
			path = "/index.html";
		}

		const filePath = join(PUBLIC_DIR, path);
		const file = Bun.file(filePath);


		// API: Graph Health Metrics
		if (path === "/api/health") {
            try {
                // Import dependencies dynamically to avoid heavy startup
                const { Database } = await import("bun:sqlite");
                const settings = await import("../../polyvis.settings.json");

                const db = new Database(settings.default.paths.database.resonance, { readonly: true });
                
                // 1. Basic Stats
                const N = (db.query("SELECT COUNT(*) as c FROM nodes WHERE type != 'root' AND type != 'domain'").get() as any).c;
                const E = (db.query("SELECT COUNT(*) as c FROM edges").get() as any).c;
                const nodes = db.query("SELECT id FROM nodes WHERE type != 'root' AND type != 'domain'").all() as any[];
                const edges = db.query("SELECT source, target FROM edges").all() as any[];
                
                db.close();

                // 2. Metrics Calculation
                const avgDegree = (2 * E) / N;
                const maxEdges = (N * (N - 1)) / 2;
                const density = maxEdges > 0 ? E / maxEdges : 0;

                // 3. Components (BFS)
                const adj = new Map<string, string[]>();
                nodes.forEach(n => adj.set(n.id, []));
                edges.forEach(e => {
                    if (adj.has(e.source)) adj.get(e.source)?.push(e.target);
                    if (adj.has(e.target)) adj.get(e.target)?.push(e.source);
                });

                const visited = new Set<string>();
                let components = 0;
                let giantCompSize = 0;

                for (const node of nodes) {
                    if (visited.has(node.id)) continue;
                    let size = 0;
                    const stack = [node.id];
                    visited.add(node.id);
                    while (stack.length > 0) {
                        const curr = stack.pop()!;
                        size++;
                        const neighbors = adj.get(curr) || [];
                        for (const neighbor of neighbors) {
                            if (!visited.has(neighbor)) {
                                visited.add(neighbor);
                                stack.push(neighbor);
                            }
                        }
                    }
                    components++;
                    if (size > giantCompSize) giantCompSize = size;
                }

                return new Response(JSON.stringify({
                    nodes: N,
                    edges: E,
                    density: Number(density.toFixed(4)),
                    avgDegree: Number(avgDegree.toFixed(2)),
                    components: components,
                    giantCompPercent: Number(((giantCompSize / N) * 100).toFixed(1))
                }), { headers: { "Content-Type": "application/json" } });

            } catch (e) {
                console.error("API Health Error:", e);
                return new Response(JSON.stringify({ error: "Failed to analyze graph" }), { status: 500 });
            }
        }

		return file.exists().then(async (exists) => {
			if (exists) {
				return new Response(file);
			} else {
				// 1. Try adding .html (clean URLs)
				const htmlPath = filePath + ".html";
				const htmlFile = Bun.file(htmlPath);
				if (await htmlFile.exists()) {
					return new Response(htmlFile);
				}

				// 2. Try serving index.html for directories (e.g. /graph/ -> /graph/index.html)
				if (!extname(path)) {
					const indexPath = join(filePath, "index.html");
					const indexFile = Bun.file(indexPath);
					if (await indexFile.exists()) {
						return new Response(indexFile);
					}
				}

				return new Response("404 Not Found", { status: 404 });
			}
		});
	},
});

// Handle cleanup on exit
process.on("SIGINT", () => {
	console.log("\n🛑 Shutting down...");
	cssWatcher.kill();
	jsWatcher.kill();
	server.stop();
	process.exit(0);
});
