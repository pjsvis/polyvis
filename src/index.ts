import { parseArgs } from "util";
import { LocusLedger } from "./data/LocusLedger";
import { BentoBoxer, type BentoBox } from "./core/BentoBoxer";

// -- Configuration --
const { values, positionals } = parseArgs({
  args: Bun.argv,
  options: {
    file: { type: "string", short: "f" },
    output: { type: "string", short: "o" },
  },
  allowPositionals: true,
  strict: false
});

const CMD = (positionals[2] || "help") as string; // bun run src/index.ts [cmd]
const FILE_PATH = values.file as string | undefined;
const OUT_PATH = values.output as string | undefined;

// -- Main Execution --
(async () => {
  try {
    const ledger = new LocusLedger(); // Auto-initialises SQLite
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

/**
 * COMMAND: box
 * Reads raw markdown, applies Seaman-Sizing, injects Locus Tags, writes output.
 */
async function runBoxCommand(boxer: BentoBoxer) {
  if (!FILE_PATH) throw new Error("Missing --file argument");

  console.log(`📦 Bento-Boxing file: ${FILE_PATH}...`);
  
  const inputFile = Bun.file(FILE_PATH);
  if (!await inputFile.exists()) throw new Error(`File not found: ${FILE_PATH}`);

  const rawText = await inputFile.text();

  // 1. Process
  const boxes = boxer.process(rawText);

  // 2. Re-assemble with Locus Tags
  const outputText = boxes.map(assembleBox).join("\n\n");

  // 3. Output
  if (OUT_PATH) {
    await Bun.write(OUT_PATH, outputText);
    console.log(`✅ Written ${boxes.length} boxes to ${OUT_PATH}`);
  } else {
    console.log(outputText); // Stdout pipeline support
  }
}

/**
 * COMMAND: audit
 * Verifies that the 'boxed' file is semantically identical to the 'source' file
 * by stripping Locus tags and structural artifacts.
 */
async function runAuditCommand() {
  if (!FILE_PATH || !OUT_PATH) throw new Error("Audit requires --file (Source) and --output (Boxed) to compare.");

  console.log(`🔍 Auditing integrity...`);

  const sourceFile = Bun.file(FILE_PATH);
  const boxedFile = Bun.file(OUT_PATH);

  if (!await sourceFile.exists()) throw new Error(`Source file not found: ${FILE_PATH}`);
  if (!await boxedFile.exists()) throw new Error(`Boxed file not found: ${OUT_PATH}`);

  const sourceText = (await sourceFile.text()).trim();
  const boxedText = (await boxedFile.text()).trim();

  // Strip Locus Tags: <!-- locus: ... -->
  const strippedBoxed = boxedText
    .replace(/<!-- locus:.*? -->/g, "")
    .trim();
  
  // Simple normalization for comparison (collapse whitespace)
  const normalize = (str: string) => str.replace(/\s+/g, " ");

  if (normalize(sourceText) === normalize(strippedBoxed)) {
    console.log("✅ AUDIT PASSED: Content is semantically identical.");
  } else {
    console.error("⚠️ AUDIT FAILED: Content divergence detected.");
    // In a real tool, we would diff the normalized strings here
    process.exit(1);
  }
}

// -- Helpers --

function assembleBox(box: BentoBox): string {
  // Inject Locus Tag as HTML Comment
  return `<!-- locus:${box.locusId} -->\n${box.content}`;
}

function printHelp() {
  console.log(`
Polyvis Bento-Boxer (CLI)
-------------------------
Usage:
  bun run src/index.ts box --file <path> [--output <path>]
  bun run src/index.ts audit --file <source> --output <boxed>

Commands:
  box    Apply Seaman-sizing and tag generation.
  audit  Verify that the boxed content matches the source content.
  `);
}
