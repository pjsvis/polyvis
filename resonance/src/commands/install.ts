import { installPackage } from "../registry/installer.js";
import { detectPackages } from "../registry/detector.js";
import chalk from "chalk";

export async function installCommand(
	pkgInfo: string | undefined, // [package] argument
	options: { magic?: boolean },
) {
	const root = process.cwd();

	// Case 1: Magic Mode
	if (options.magic) {
		console.log(chalk.blue("✨ Auto-detecting packages..."));
		const detected = await detectPackages(root);
		if (detected.length === 0) {
			console.log(chalk.yellow("No packages detected based on file signatures."));
			return;
		}
		for (const pkg of detected) {
			await installPackage(pkg, root);
		}
		return;
	}

	// Case 2: Specific Package
	if (pkgInfo) {
		await installPackage(pkgInfo, root);
		return;
	}

	// Case 3: No args
	console.log(chalk.red("Error: Please specify a package name or use --magic."));
}
