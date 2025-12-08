import fs from "fs";
import path from "path";
import chalk from "chalk";
import ora from "ora";
import { ResonanceDB } from "../db.js";

// Bun has built-in Glob
const globScan = (pattern: string) => {
	const glob = new Bun.Glob(pattern);
	return Array.from(glob.scanSync(process.cwd()));
};

export async function syncCommand() {
	const spinner = ora("Syncing Knowledge Graph...").start();
	const root = process.cwd();
	const db = new ResonanceDB(root);

	try {
		const playbookFiles = globScan("playbooks/*.md");
		const debriefFiles = globScan("debriefs/*.md");

		let count = 0;

		// 1. Ingest Playbooks
		for (const file of playbookFiles) {
			const content = fs.readFileSync(file, "utf-8");
			const id = path.basename(file, ".md");
			const title = extractTitle(content) || id;

			db.upsertNode({
				id,
				type: "playbook",
				title,
				content,
				path: file,
			});
			count++;
		}

		// 2. Ingest Debriefs
		for (const file of debriefFiles) {
			const content = fs.readFileSync(file, "utf-8");
			const id = path.basename(file, ".md");
			const title = extractTitle(content) || id;

			db.upsertNode({
				id,
				type: "debrief",
				title,
				content,
				path: file,
			});
			count++;
		}

		spinner.succeed(chalk.green(`Synced ${count} artifacts to resonance.db`));
	} catch (error) {
		spinner.fail(chalk.red(`Sync failed: ${(error as Error).message}`));
	} finally {
		db.close();
	}
}

function extractTitle(content: string): string | null {
	const match = content.match(/^#\s+(.+)$/m);
	return match && match[1] ? match[1].trim() : null;
}
