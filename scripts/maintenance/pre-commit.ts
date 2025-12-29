#!/usr/bin/env bun
/**
 * Pre-commit Verification Hook
 *
 * Purpose: Prevent TypeScript and Biome violations from being committed.
 * This is the first line of defense against the "Strict Compiler" points
 * that have dominated the SCOREBOARD.
 *
 * Usage: bun run precommit
 *
 * Exit codes:
 *   0 - All checks passed
 *   1 - TypeScript errors found
 *   2 - Biome lint/check errors found
 *   3 - Both TypeScript and Biome errors found
 */

import { $ } from "bun";

const CHECKS = {
	ts: "TypeScript",
	biome: "Biome (lint & format)",
};

interface CheckResult {
	passed: boolean;
	output: string;
	exitCode: number;
}

/**
 * Runs TypeScript compiler in --noEmit mode to check for type errors
 */
async function checkTypeScript(): Promise<CheckResult> {
	const proc = Bun.spawn(["bun", "tsc", "--noEmit"], {
		stderr: "pipe",
		stdout: "pipe",
	});

	const stderr = await new Response(proc.stderr).text();
	const stdout = await new Response(proc.stdout).text();
	const exitCode = await proc.exited;

	return {
		passed: exitCode === 0,
		output: stdout || stderr,
		exitCode,
	};
}

/**
 * Runs Biome check (lint + format validation)
 */
async function checkBiome(): Promise<CheckResult> {
	const proc = Bun.spawn(["bun", "run", "check"], {
		stderr: "pipe",
		stdout: "pipe",
	});

	const stderr = await new Response(proc.stderr).text();
	const stdout = await new Response(proc.stdout).text();
	const exitCode = await proc.exited;

	return {
		passed: exitCode === 0,
		output: stdout || stderr,
		exitCode,
	};
}

/**
 * Formats error output for clarity
 */
function formatError(name: string, result: CheckResult): string {
	const emoji = result.passed ? "✅" : "❌";
	const lines = ["", `${emoji} ${name}`, "─".repeat(40)];

	if (!result.passed) {
		lines.push(result.output);
	}

	return lines.join("\n");
}

/**
 * Main execution
 */
async function main() {
	console.log("🔍 Pre-commit Verification Hook");
	console.log("═".repeat(40));

	const results = {
		ts: await checkTypeScript(),
		biome: await checkBiome(),
	};

	// Output results
	console.log(formatError(CHECKS.ts, results.ts));
	console.log(formatError(CHECKS.biome, results.biome));

	// Determine overall exit code
	let exitCode = 0;

	if (!results.ts.passed) {
		exitCode += 1;
		console.log("\n❌ TypeScript errors detected. Commit blocked.");
		console.log("   Fix: Run 'bun tsc --noEmit' to see full errors.");
	}

	if (!results.biome.passed) {
		exitCode += 2;
		console.log("\n❌ Biome errors detected. Commit blocked.");
		console.log("   Fix: Run 'bun run format' and 'bun run lint'.");
	}

	if (exitCode === 0) {
		console.log("\n✅ All checks passed. Proceeding with commit.");
	}

	process.exit(exitCode);
}

main().catch((err) => {
	console.error("💥 Hook error:", err);
	process.exit(1);
});
