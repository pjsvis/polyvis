import { unlink } from "fs/promises";
import { watch } from "fs";
import { Embedder } from "./services/embedder";
import { Ingestor } from "../pipeline/Ingestor";
import { join } from "path";
import settings from "@/polyvis.settings.json";

const PID_FILE = ".daemon.pid";
const LOG_FILE = ".daemon.log";

const args = process.argv.slice(2);
const command = args[0] || "serve"; 

// --- Helper: Notifications ---

async function notify(title: string, message: string) {
    // Native macOS notifications via AppleScript
    // Zero dependencies
    try {
        const script = `display notification "${message}" with title "${title}"`;
        await Bun.spawn(["osascript", "-e", script]);
    } catch (e) {
        console.error("Failed to send notification:", e);
    }
}

// --- Lifecycle Management Logic ---

async function isRunning(pid: number): Promise<boolean> {
    try {
        process.kill(pid, 0);
        return true;
    } catch (_e) {
        return false;
    }
}

async function start() {
    if (await Bun.file(PID_FILE).exists()) {
        const pid = parseInt(await Bun.file(PID_FILE).text());
        if (await isRunning(pid)) {
            console.log(`⚠️  Daemon is already running (PID: ${pid})`);
            return;
        }
        console.log("⚠️  Found stale PID file. Clearing...");
        await unlink(PID_FILE);
    }

    const logFile = Bun.file(LOG_FILE);
    // Truncate log on new start
    await Bun.write(logFile, "");

    const selfPath = process.argv[1] || "src/resonance/daemon.ts";
    const subprocess = Bun.spawn(["bun", "run", selfPath, "serve"], {
        cwd: process.cwd(),
        detached: true,
        stdout: logFile,
        stderr: logFile,
    });

    await Bun.write(PID_FILE, subprocess.pid.toString());
    
    subprocess.unref();

    console.log(`✅ Daemon started (PID: ${subprocess.pid})`);
    console.log(`📝 Logs: ${LOG_FILE}`);
}

async function stop() {
    if (!await Bun.file(PID_FILE).exists()) {
        console.log("ℹ️  Daemon is not running.");
        return;
    }

    const pid = parseInt(await Bun.file(PID_FILE).text());
    
    if (await isRunning(pid)) {
        console.log(`🛑 Stopping Daemon (PID: ${pid})...`);
        process.kill(pid, "SIGTERM");
        
        let attempts = 0;
        while (await isRunning(pid) && attempts < 10) {
            await new Promise(r => setTimeout(r, 100));
            attempts++;
        }
        
        if (await isRunning(pid)) {
             console.log("⚠️  Process did not exit gracefully. Force killing...");
             process.kill(pid, "SIGKILL");
        }
        console.log("✅ Daemon stopped.");
    } else {
        console.log("⚠️  Stale PID file found. Cleaning up.");
    }

    await unlink(PID_FILE);
}

async function status() {
     if (await Bun.file(PID_FILE).exists()) {
        const pid = parseInt(await Bun.file(PID_FILE).text());
        if (await isRunning(pid)) {
            console.log(`🟢 Daemon is RUNNING (PID: ${pid})`);
            console.log(`   Port: 3010 (default)`);
            return;
        }
        console.log(`🔴 Daemon is NOT RUNNING (Stale PID: ${pid})`);
    } else {
        console.log("⚪️ Daemon is STOPPED");
    }
}

// --- Server Logic (The actual Daemon) ---

async function runServer() {
    const PORT = parseInt(process.env.VECTOR_PORT || "3010");

    console.log(`🔌 Vector Daemon starting on port ${PORT}...`);
    console.log(`   Initializing Embedder...`);

    // 1. Initialize Embedder (Compute Node)
    try {
        const embedder = Embedder.getInstance();
        await embedder.embed("warmup", true); 
        console.log(`   ✅ Embedder Ready.`);
    } catch (e) {
        console.error("   ❌ Failed to initialize embedder:", e);
        process.exit(1);
    }

    // 2. Start HTTP Server
    Bun.serve({
        port: PORT,
        async fetch(req) {
            const url = new URL(req.url);
            
            if (req.method === "GET" && url.pathname === "/health") {
                return new Response(JSON.stringify({ status: "ok" }), {
                    headers: { "Content-Type": "application/json" },
                });
            }

            if (req.method === "POST" && url.pathname === "/embed") {
                try {
                    const body = await req.json() as { text: string };
                    if (!body.text || typeof body.text !== "string") {
                         return new Response("Bad Request: 'text' field required", { status: 400 });
                    }
                    
                    const vector = await Embedder.getInstance().embed(body.text, true); 
                    
                    return new Response(JSON.stringify({ vector: Array.from(vector) }), {
                         headers: { "Content-Type": "application/json" },
                    });
                } catch (e) {
                    console.error(e);
                    return new Response("Internal Server Error", { status: 500 });
                }
            }

            return new Response("Not Found", { status: 404 });
        },
    });

    console.log(`🚀 Vector Daemon listening on http://localhost:${PORT}`);

    // 3. Start The Watcher (Active Custodian)
    startWatcher();
    
    // Handle cleanup
    process.on("SIGTERM", () => {
        console.log("🛑 Received SIGTERM, shutting down...");
        process.exit(0);
    });
}

// --- Watcher Logic ---

let debounceTimer: ReturnType<typeof setTimeout> | null = null;
const DEBOUNCE_MS = 2000;

function startWatcher() {
    // Dynamically load watch targets from settings
    const rawSources = settings.paths.sources.experience;
    const dirsToWatch = rawSources.map(s => s.path);

    console.log(`👀 Watching directories: ${dirsToWatch.join(", ")}`);

    dirsToWatch.forEach(dir => {
        const path = join(process.cwd(), dir);
        try {
            watch(path, { recursive: true }, (event, filename) => {
                // Ignore dotfiles and ensure markdown
                if (filename && !filename.startsWith(".") && filename.endsWith(".md")) {
                    console.log(`📝 Change detected: ${dir}/${filename} (${event})`);
                    triggerIngestion();
                }
            });
        } catch (e) {
             console.warn(`⚠️ Could not watch ${dir}:`, e);
        }
    });
}

function triggerIngestion() {
    if (debounceTimer) {
        clearTimeout(debounceTimer);
    }

    debounceTimer = setTimeout(async () => {
        console.log("🔄 Debounce settle. Starting Ingestion...");
        try {
            // Re-instantiate DB/Ingestor for fresh context
            // Note: In a long running process, we might want to keep singletons, 
            // but Ingestor is designed to be ephemeral. 
            // Reuse DB connection if possible? ResonanceDB handles it.
            
            // Ingestor manages its own DB lifecycle (init -> run -> cleanup)
            const ingestor = new Ingestor();
            await ingestor.run();

            console.log("✅ Ingestion Complete.");
            await notify("PolyVis Resonance", "Knowledge Graph Updated.");
        } catch (e) {
            console.error("❌ Ingestion Failed:", e);
            await notify("PolyVis Resonance", "Ingestion Failed (Check Logs)");
        }
    }, DEBOUNCE_MS);
}


// --- Dispatch ---

switch (command) {
    case "start":
        await start();
        process.exit(0);
        break;
    case "stop":
        await stop();
        process.exit(0);
        break;
    case "status":
        await status();
        process.exit(0);
        break;
    case "restart":
        await stop();
        await new Promise(r => setTimeout(r, 500));
        await start();
        process.exit(0);
        break;
    case "serve":
        await runServer();
        // Do NOT exit, server needs to keep running
        break;
    default:
        console.log(`Unknown command '${command}'. Use: start, stop, status, restart, or serve`);
        process.exit(1);
}

