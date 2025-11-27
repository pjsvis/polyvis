import { join, extname } from "path";

// Configuration
const PORT = 3000;
const PUBLIC_DIR = "public";

console.log("🚀 Starting Polyvis Development Environment...");

// 0. Free up port
try {
    const portProc = Bun.spawn(["lsof", "-t", "-i:" + PORT], { stderr: "ignore" });
    const text = await new Response(portProc.stdout).text();
    const pids = text.trim().split("\n").filter(p => p);

    if (pids.length > 0) {
        console.log(`🧹 Freeing port ${PORT} (killing PIDs: ${pids.join(", ")})...`);
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

// 2. Start Web Server
console.log(`🌍 Starting Web Server at http://localhost:${PORT}...`);

const server = Bun.serve({
    port: PORT,
    fetch(req) {
        const url = new URL(req.url);
        let path = url.pathname;

        // Default to index.html for root
        if (path === "/") {
            path = "/index.html";
        }

        let filePath = join(PUBLIC_DIR, path);
        let file = Bun.file(filePath);

        return file.exists().then(async exists => {
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
    server.stop();
    process.exit(0);
});
