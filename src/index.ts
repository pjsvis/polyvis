import { parseArgs } from "util";
import { type BentoBox, BentoBoxer } from "./core/BentoBoxer";
import { TagEngine } from "./core/TagEngine";
import { LocusLedger } from "./data/LocusLedger";

// -- Configuration --
const { values, positionals } = parseArgs({
	args: Bun.argv,
	options: {
		file: { type: "string", short: "f" },
		output: { type: "string", short: "o" },
		tag: { type: "boolean", short: "t" },
	},
	allowPositionals: true,
	strict: false,
});

const CMD = (positionals[2] || "help") as string;
const FILE_PATH = values.file as string | undefined;
const OUT_PATH = values.output as string | undefined;
const USE_TAGS = values.tag as boolean | undefined;

// -- Main Execution --
(async () => {
	try {
		const ledger = new LocusLedger();
		const boxer = new BentoBoxer(ledger);

		switch (CMD) {
			case "box":
				await runBoxCommand(boxer);
				break;
			case "audit":
				await runAuditCommand();
				break;
			default:
				printHelp();
				break;
		}
	} catch (error) {
		console.error("\n❌ Fatal Error:", error);
		process.exit(1);
	}
})();

// -- Command Logic --

async function runBoxCommand(boxer: BentoBoxer) {
	if (!FILE_PATH) throw new Error("Missing --file argument");

	console.log(`📦 Bento-Boxing file: ${FILE_PATH}...`);
	if (USE_TAGS) console.log("   (Tagging Enabled - invoking local LLM)");

	const inputFile = Bun.file(FILE_PATH);
	if (!(await inputFile.exists()))
		throw new Error(`File not found: ${FILE_PATH}`);

	const rawText = await inputFile.text();

	// 1. Process
	const boxes = boxer.process(rawText);

	// 2. Tagging (Optional)
	if (USE_TAGS) {
		const tagEngine = await TagEngine.getInstance();
		for (const box of boxes) {
			// Tagging can be slow, log progress
			process.stdout.write(".");
			const result = await tagEngine.generateTags(box.content);
			box.tags = [...result.hardTags, ...result.softTokens];
		}
		console.log("\n"); // Clear progress line
	}

	// 3. Re-assemble with Locus Tags
	const outputText = boxes.map(assembleBox).join("\n\n");

	// 4. Output
	if (OUT_PATH) {
		await Bun.write(OUT_PATH, outputText);
		console.log(`✅ Written ${boxes.length} boxes to ${OUT_PATH}`);
	} else {
		console.log(outputText);
	}
}

async function runAuditCommand() {
	if (!FILE_PATH || !OUT_PATH)
		throw new Error(
			"Audit requires --file (Source) and --output (Boxed) to compare.",
		);

	console.log(`🔍 Auditing integrity...`);

	const sourceFile = Bun.file(FILE_PATH);
	const boxedFile = Bun.file(OUT_PATH);

	if (!(await sourceFile.exists()))
		throw new Error(`Source file not found: ${FILE_PATH}`);
	if (!(await boxedFile.exists()))
		throw new Error(`Boxed file not found: ${OUT_PATH}`);

	const sourceText = (await sourceFile.text()).trim();
	const boxedText = (await boxedFile.text()).trim();

	// Strip formatted comments
	const strippedBoxed = boxedText
		.replace(/<!-- locus:.*? -->/g, "")
		.replace(/<!-- tags:.*? -->/g, "")
		.trim();

	// Simple normalization
	const normalize = (str: string) => str.replace(/\s+/g, " ");

	if (normalize(sourceText) === normalize(strippedBoxed)) {
		console.log("✅ AUDIT PASSED: Content is semantically identical.");
	} else {
		// console.log("Source:", normalize(sourceText).slice(0, 100));
		// console.log("Stripd:", normalize(strippedBoxed).slice(0, 100));
		console.error("⚠️ AUDIT FAILED: Content divergence detected.");
		process.exit(1);
	}
}

// -- Helpers --

function assembleBox(box: BentoBox): string {
	let header = `<!-- locus:${box.locusId} -->`;

	if (box.tags && box.tags.length > 0) {
		// Inject tags as a hidden comment so EdgeWeaver can find them
		// but they don't clutter the rendered view.
		header += `\n<!-- tags: ${box.tags.join(", ")} -->`;
	}

	return `${header}\n${box.content}`;
}

function printHelp() {
	console.log(`
Polyvis Bento-Boxer (CLI)
-------------------------
Usage:
  bun run src/index.ts box --file <path> [--output <path>] [--tag]
  bun run src/index.ts audit --file <source> --output <boxed>

Commands:
  box    Apply Seaman-sizing. Use --tag to auto-generate tags (requires Ollama).
  audit  Verify that the boxed content matches the source content.
  `);
}
