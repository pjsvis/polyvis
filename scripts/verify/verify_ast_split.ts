import { BentoBoxer } from "../../src/core/BentoBoxer";
import { LocusLedger } from "../../src/data/LocusLedger";

async function verify() {
	const ledger = new LocusLedger();
	const boxer = new BentoBoxer(ledger);

	const markdown = `
# Real Header 1

Some content here.

\`\`\`markdown
# Fake Header inside code block
Some code content
\`\`\`

# Real Header 2

More content.
`;

	console.log("Input Markdown:");
	console.log(markdown);
	console.log("-".repeat(20));

	const boxes = boxer.process(markdown);

	console.log(`Produced ${boxes.length} boxes.`);

	boxes.forEach((box, i) => {
		console.log(`Box ${i + 1}:`);
		console.log(box.content);
		console.log("-".repeat(10));
	});

	// Verification Logic
	// We expect 2 boxes:
	// 1. "# Real Header 1 ... (code block included) ..."
	// 2. "# Real Header 2 ..."

	// If it splits on "Fake Header", we would get 3 boxes or the code block would be broken.

	const hasFakeHeaderSplit = boxes.some((b) =>
		b.content.trim().startsWith("# Fake Header"),
	);
	if (hasFakeHeaderSplit) {
		console.error(
			"FAIL: BentoBoxer split on a fake header inside a code block.",
		);
		process.exit(1);
	}

	// Check if code block is intact in the first box (or wherever it ends up)
	const codeBlockPart =
		"```markdown\n# Fake Header inside code block\nSome code content\n```";
	const boxWithCode = boxes.find((b) => b.content.includes(codeBlockPart));

	if (!boxWithCode) {
		console.error(
			"FAIL: Code block integrity check failed. The code block seems to have been mangled or split.",
		);
		// Debugging: show what we have
		process.exit(1);
	}

	console.log("PASS: Code block integrity maintained");
}

verify().catch((e) => {
	console.error(e);
	process.exit(1);
});
