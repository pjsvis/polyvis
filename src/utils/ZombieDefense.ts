import { exec } from "node:child_process";
import { promisify } from "node:util";

const execAsync = promisify(exec);

export interface ZombieReport {
	ghosts: string[];
	duplicates: string[];
	unknowns: string[];
	clean: boolean;
}

export class ZombieDefense {
	// Services intended to run as singletons
	private static WHITELIST = [
		"src/resonance/daemon.ts",
		"src/mcp/index.ts",
		"scripts/cli/dev.ts",
		"src/resonance/cli/ingest.ts",
		"bun run build:data",
		"bun run mcp",
		"bun run daemon",
		"bun run dev",
		"bun run watch:css",
		"bun run watch:js",
		"scripts/verify/test_mcp_query.ts",
		"src/services/olmo3.ts",
		"src/services/phi.ts",
		"src/services/llama.ts",
		"src/services/llamauv.ts",
		"scripts/cli/servers.ts",
		"bun run olmo3",
		"bun run phi",
		"bun run llama",
		"bun run llamauv",
		"bun run servers",
	];

	/**
	 * Scan the environment for unauthorized or stale processes.
	 */
	static async scan(excludePids: string[] = []): Promise<ZombieReport> {
		const report: ZombieReport = {
			ghosts: [],
			duplicates: [],
			unknowns: [],
			clean: true,
		};

		const protectedPids = new Set([
			process.pid.toString(),
			process.ppid.toString(),
			...excludePids,
		]);

		// 1. Ghost Check (Deleted File Handles)
		try {
			const { stdout } = await execAsync("lsof +L1");
			const lines = stdout.split("\n");
			// Strict Filter: Only worry about resonance.db or files in our project scope
			report.ghosts = lines.filter((l) => {
				if (!l.includes("bun")) return false;
				// Must be relevant file
				return l.includes("resonance.db") || l.includes(process.cwd());
			});
		} catch (_e) {
			// lsof exits 1 if nothing found
		}

		// 2. Process Table Check
		try {
			const { stdout } = await execAsync("ps aux | grep bun | grep -v grep");
			const processes = stdout.split("\n").filter((l) => l.trim().length > 0);
			const activeMap = new Map<string, number>();

			processes.forEach((p) => {
				// Ignore self and parent immediately
				const match = p.match(/\s+(\d+)\s+/);
				if (match?.[1] && protectedPids.has(match[1])) return;

				// Strict Filter: Must be in our CWD or explicit bun run
				if (!p.includes(process.cwd()) && !p.includes("bun run")) return;

				const isWhitelisted = ZombieDefense.WHITELIST.some((w) =>
					p.includes(w),
				);

				if (isWhitelisted) {
					ZombieDefense.WHITELIST.forEach((w) => {
						if (p.includes(w)) {
							// HEURISTIC: Don't count "bun run scripts/foo.ts" and "bun scripts/foo.ts" as duplicates of each other if they are the same PID (obviously),
							// but here we already filtered by PID.
							// We need to be careful about the wrapper vs the actual process.

							const count = (activeMap.get(w) || 0) + 1;
							activeMap.set(w, count);
							if (count > 1) {
								report.duplicates.push(p);
							}
						}
					});
				} else {
					// Ignore self (if running from a script calling this)
					if (
						!p.includes("detect_zombies.ts") &&
						!p.includes("ZombieDefense")
					) {
						report.unknowns.push(p);
					}
				}
			});
		} catch (_e) {
			// No bun processes
		}

		if (
			report.ghosts.length > 0 ||
			report.duplicates.length > 0 ||
			report.unknowns.length > 0
		) {
			report.clean = false;
		}

		return report;
	}

	/**
	 * Helper: Extract PIDs from report lines
	 */
	private static extractPids(lines: string[]): string[] {
		const pids = new Set<string>();
		lines.forEach((line) => {
			const match = line.match(/\s+(\d+)\s+/);
			if (match?.[1]) {
				pids.add(match[1]);
			}
		});
		return Array.from(pids);
	}

	/**
	 * Terminate identified zombie PIDs
	 */
	static async killZombies(report: ZombieReport) {
		let targets = [
			...new Set([
				...ZombieDefense.extractPids(report.ghosts),
				...ZombieDefense.extractPids(report.duplicates),
			]),
		];

		// SAFETY: Exclude self
		const selfPid = process.pid.toString();
		targets = targets.filter((pid) => pid !== selfPid);

		if (targets.length === 0) return;

		console.error(
			`🔪 Killing ${targets.length} zombie processes: ${targets.join(", ")}`,
		);
		try {
			await execAsync(`kill -9 ${targets.join(" ")}`);
			console.error("   ✅ Zombies terminated.");
		} catch (e: any) {
			console.error(`   ❌ Failed to kill zombies: ${e.message}`);
		}
	}

	/**
	 * Enforce a clean state. Exits process if zombies found.
	 * @param serviceName Name of the service calling this guard
	 * @param interactive If true, prompts user to kill zombies.
	 */
	static async assertClean(serviceName: string, interactive = false) {
		if (process.env.SKIP_ZOMBIE_CHECK === "true") {
			return;
		}
		console.error(`🛡️  [${serviceName}] Running Zombie Defense Protocol...`);
		let report = await ZombieDefense.scan();

		if (report.clean) {
			console.error("   ✅ Environment Clean.");
			return;
		}

		console.error("\n🛑 STARTUP ABORTED: ZOMBIE PROCESSES DETECTED");

		if (report.ghosts.length > 0) {
			console.error("\n👻 GHOSTS (Holding deleted files):");
			report.ghosts.forEach((g) => console.error(`   ${g}`));
		}

		if (report.duplicates.length > 0) {
			console.error("\n👯 DUPLICATES (Service already running?):");
			report.duplicates.forEach((d) => console.error(`   ${d}`));
		}

		if (report.unknowns.length > 0) {
			console.error(
				"\n👽 UNKNOWNS (Rogue processes - Manual Check Recommended):",
			);
			report.unknowns.forEach((u) => console.error(`   ${u}`));
		}

		if (interactive) {
			const targets = ZombieDefense.extractPids([
				...report.ghosts,
				...report.duplicates,
			]);
			if (targets.length > 0) {
				process.stderr.write(
					`\n👇 Found ${targets.length} confirmable zombies. Kill and Proceed? [y/N] `,
				);
				const answer = await new Promise<string>((resolve) => {
					// Simple one-off prompt since Bun used here might not have 'prompt' in all envs
					// Using Bun.stdin reader
					process.stdin.once("data", (d) => resolve(d.toString().trim()));
				});

				if (answer.toLowerCase() === "y" || answer.toLowerCase() === "yes") {
					await ZombieDefense.killZombies(report);
					// Re-scan to verify
					report = await ZombieDefense.scan();
					if (report.clean) {
						console.error("   ✅ Environment Cleared. Proceeding...");
						return;
					}
					console.error("   ❌ Environment still dirty after kill attempt.");
				}
			}
		} else {
			console.error(
				"\n👉 ACTION REQUIRED: Run 'pkill -f bun' to clear the environment.",
			);
		}

		process.exit(1);
	}
}
