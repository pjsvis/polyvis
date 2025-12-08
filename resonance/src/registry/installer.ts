import fs from "fs";
import path from "path";
import chalk from "chalk";
import ora from "ora";
import crypto from "crypto";
import { MOCK_REGISTRY } from "./detector.js";
import type { Lockfile } from "./types.js";

const UPSTREAM_BASE =
	"https://raw.githubusercontent.com/pjsvis/polyvis/main/";

export async function installPackage(
	pkgName: string,
	root: string,
): Promise<void> {
	const spinner = ora(`Installing ${pkgName}...`).start();

	// 1. Lookup
	const pkgData = MOCK_REGISTRY.packages[pkgName];
	if (!pkgData) {
		spinner.fail(
			chalk.red(`Package '${pkgName}' not found in registry.`),
		);
		return;
	}

	// 2. Fetch
	const remoteUrl = `${UPSTREAM_BASE}${pkgData.path}`;
	// spinner.text = `Fetching from ${remoteUrl}...`;

	try {
		const response = await fetch(remoteUrl);
		if (!response.ok) {
			throw new Error(`HTTP ${response.status}: ${response.statusText}`);
		}
		const content = await response.text();

		// 3. Write
		const destDir = path.join(root, "playbooks");
		if (!fs.existsSync(destDir)) fs.mkdirSync(destDir, { recursive: true });

		// Use the filename from the path
		const filename = path.basename(pkgData.path);
		const destFile = path.join(destDir, filename);

		fs.writeFileSync(destFile, content);

		// 4. Update Lockfile
		const hash = crypto.createHash("sha256").update(content).digest("hex");
		updateLockfile(root, pkgName, "1.0.0", hash); // Version mocking for now

		spinner.succeed(chalk.green(`Installed ${pkgName} to playbooks/${filename}`));
	} catch (error) {
		spinner.fail(chalk.red(`Failed to install ${pkgName}: ${(error as Error).message}`));
	}
}

function updateLockfile(
	root: string,
	pkgName: string,
	version: string,
	hash: string,
) {
	const lockPath = path.join(root, ".resonance", "resonance.lock.json");
	let lock: Lockfile = { packages: {} };

	if (fs.existsSync(lockPath)) {
		try {
			lock = JSON.parse(fs.readFileSync(lockPath, "utf-8"));
		} catch (e) {
			// ignore corruption
		}
	}

	lock.packages[pkgName] = {
		version,
		hash,
		installed_at: new Date().toISOString(),
	};

	fs.writeFileSync(lockPath, JSON.stringify(lock, null, 2));
}
