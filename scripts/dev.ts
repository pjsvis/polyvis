import { join, extname } from "path";

// Configuration
const PORT = 3000;
const PUBLIC_DIR = "public";

console.log("🚀 Starting Polyvis Development Environment...");

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

        const filePath = join(PUBLIC_DIR, path);
        const file = Bun.file(filePath);

        return file.exists().then(exists => {
            if (exists) {
                return new Response(file);
            } else {
                // Try adding .html if missing (clean URLs)
                const htmlFile = Bun.file(filePath + ".html");
                return htmlFile.exists().then(htmlExists => {
                    if (htmlExists) return new Response(htmlFile);
                    return new Response("404 Not Found", { status: 404 });
                });
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
