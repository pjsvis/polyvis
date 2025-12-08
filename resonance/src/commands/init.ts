import fs from "fs";
import path from "path";
import chalk from "chalk";
import ora from "ora";
import { detectPackages } from "../registry/detector.js";
import { installPackage } from "../registry/installer.js"; // We need to write this

export async function initCommand(options: { magic?: boolean }) {
	const spinner = ora("Initializing Resonance...").start();
	const root = process.cwd();
	const resonanceDir = path.join(root, ".resonance");
	const lockfile = path.join(resonanceDir, "resonance.lock.json");

	// 1. Scaffold Directory
	if (!fs.existsSync(resonanceDir)) {
		fs.mkdirSync(resonanceDir);
		spinner.succeed(chalk.green("Created .resonance/ directory."));
	} else {
		spinner.info(".resonance/ directory already exists.");
	}

	// 2. Scaffold Lockfile
	if (!fs.existsSync(lockfile)) {
		fs.writeFileSync(lockfile, JSON.stringify({ packages: {} }, null, 2));
		spinner.succeed(chalk.green("Created resonance.lock.json"));
	}

	// 3. Magic Discovery
	if (options.magic) {
		console.log("");
		console.log(chalk.blue.bold("✨ Magic Mode Enabled: Scanning project..."));
		const detected = await detectPackages(root);

		if (detected.length === 0) {
			console.log(chalk.yellow("No standard signatures found."));
			return;
		}

		console.log(
			chalk.green(`\nFound ${detected.length} packages to install.\n`),
		);

		for (const pkg of detected) {
			await installPackage(pkg, root);
		}
	} else {
		console.log(
			chalk.dim(
				"\nTip: Run with --magic to auto-discover and install playbooks based on your stack.",
			),
		);
	}
}
