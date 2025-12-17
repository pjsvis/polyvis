import { watch } from "node:fs";
import { join } from "node:path";
import settings from "@/polyvis.settings.json";
import { Ingestor } from "../pipeline/Ingestor";
import { ServiceLifecycle } from "../utils/ServiceLifecycle";
import { Embedder } from "./services/embedder";

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

import { EnvironmentVerifier } from "../utils/EnvironmentVerifier";

// --- Service Lifecycle ---

const lifecycle = new ServiceLifecycle({
	name: "Daemon",
	pidFile: ".daemon.pid",
	logFile: ".daemon.log",
	entryPoint: "src/resonance/daemon.ts",
});

// --- Server Logic (The actual Daemon) ---

async function main() {
	// 0. Verify Environment
	await EnvironmentVerifier.verifyOrExit();

	// 1. Initialize Ingestion (Daemon Mode: Watch Enabled)
	const PORT = parseInt(process.env.VECTOR_PORT || "3010", 10);

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
					const body = (await req.json()) as { text: string };
					if (!body.text || typeof body.text !== "string") {
						return new Response("Bad Request: 'text' field required", {
							status: 400,
						});
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
const pendingFiles = new Set<string>();

// Retry queue: Track failed ingestions with attempt counts
const retryQueue = new Map<
	string,
	{ attempts: number; lastError: string; lastAttempt: number }
>();
const MAX_RETRIES = 3;
const RETRY_BACKOFF_MS = 5000; // Wait 5 seconds before retry

function startWatcher() {
	// Dynamically load watch targets from settings
	const rawSources = settings.paths.sources.experience;
	const dirsToWatch = rawSources.map((s) => s.path);

	console.log(`👀 Watching directories: ${dirsToWatch.join(", ")}`);

	dirsToWatch.forEach((dir) => {
		const path = join(process.cwd(), dir);
		try {
			watch(path, { recursive: true }, (event, filename) => {
				// Ignore dotfiles and ensure markdown
				if (filename && !filename.startsWith(".") && filename.endsWith(".md")) {
					console.log(`📝 Change detected: ${dir}/${filename} (${event})`);

					// Add full path to pending set
					const fullPath = join(process.cwd(), dir, filename);
					pendingFiles.add(fullPath);

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
		const batchSize = pendingFiles.size;
		if (batchSize === 0) return;

		console.log(
			`🔄 Debounce settle. Starting Batch Ingestion (${batchSize} files)...`,
		);

		// Drain the set
		const batch = Array.from(pendingFiles);
		pendingFiles.clear();

		try {
			// Re-instantiate DB/Ingestor for fresh context
			const ingestor = new Ingestor();

			// OPTIMIZATION: Pass only the changed files
			await ingestor.run({ files: batch });

			console.log("✅ Batch Ingestion Complete.");
			// Clear retry counts for successful files
			for (const file of batch) {
				retryQueue.delete(file);
			}
			await notify("PolyVis Resonance", `Graph Updated (${batchSize} files).`);
		} catch (e) {
			const errorMsg = e instanceof Error ? e.message : String(e);
			console.error("❌ Ingestion Failed:", errorMsg);

			// Re-queue failed files with retry logic
			const now = Date.now();
			for (const file of batch) {
				const retryInfo = retryQueue.get(file) || {
					attempts: 0,
					lastError: "",
					lastAttempt: 0,
				};

				if (retryInfo.attempts < MAX_RETRIES) {
					// Re-queue with exponential backoff
					const nextAttempt = retryInfo.attempts + 1;
					retryQueue.set(file, {
						attempts: nextAttempt,
						lastError: errorMsg,
						lastAttempt: now,
					});

					// Re-add to pending files after backoff delay
					setTimeout(() => {
						pendingFiles.add(file);
						triggerIngestion();
					}, RETRY_BACKOFF_MS * nextAttempt);

					console.warn(
						`🔄 RETRY: ${file} will retry (attempt ${nextAttempt}/${MAX_RETRIES}) in ${RETRY_BACKOFF_MS * nextAttempt}ms`,
					);
				} else {
					// Abandon after max retries
					console.error(
						`⛔ ABANDONED: ${file} failed ${MAX_RETRIES} times. Last error: ${retryInfo.lastError}`,
					);
					retryQueue.delete(file); // Remove from tracking
				}
			}

			await notify(
				"PolyVis Resonance",
				`Ingestion Failed (${batch.length} files will retry)`,
			);
		}
	}, DEBOUNCE_MS);
}

// --- Dispatch ---

await lifecycle.run(command, main);
