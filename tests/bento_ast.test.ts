import { describe, expect, test } from "bun:test";
import { BentoBoxer } from "../src/core/BentoBoxer";
import { LocusLedger } from "../src/data/LocusLedger";

describe("BentoBoxer (AST)", () => {
	const ledger = new LocusLedger("test-db");
	const boxer = new BentoBoxer(ledger);

	test("Splits content by H2 headers", () => {
		const input = `
# Main Title

Introduction content.

## Section 1
Content for section 1.
- list item
- list item

## Section 2
Content for section 2.
> Blockquote

## Section 3
Final section.
        `.trim();

		const boxes = boxer.process(input);

		// Expect 4 boxes:
		// 1. Introduction (Main Title)
		// 2. Section 1
		// 3. Section 2
		// 4. Section 3

		expect(boxes.length).toBe(4);

		expect(boxes[0]?.content).toContain("# Main Title");
		expect(boxes[0]?.content).toContain("Introduction content");

		expect(boxes[1]?.content).toContain("## Section 1");
		expect(boxes[1]?.content).toContain("Content for section 1");

		expect(boxes[2]?.content).toContain("## Section 2");
		expect(boxes[2]?.content).toContain("> Blockquote");
	});

	test("Splits content by deeper headers (H3/H4)", () => {
		const input = `
## Section 2
### Subsection 2.1
Content 2.1
#### Deep Dive
Content 2.1.1
        `.trim();

		const boxes = boxer.process(input);

		// H2 -> Box
		// H3 -> Box
		// H4 -> Box
		// Total 3 boxes?
		// Logic: Recursively flattens ALL headers <= 4.
		// If H3 follows H2 immediately, H2 box might be empty string?
		// No, current logic: "Start new group with this heading".

		// Expected:
		// 1. ## Section 2
		// 2. ### Subsection 2.1
		// 3. #### Deep Dive

		expect(boxes.length).toBe(3);
		expect(boxes[1]?.content).toContain("### Subsection 2.1");
		expect(boxes[2]?.content).toContain("#### Deep Dive");
	});

	test("Fractures large content by Paragraphs", () => {
		// Generate content > 300 words
		const largeText = "word ".repeat(350);
		const input = `
# Giant Section
${largeText}
        `.trim();

		const boxes = boxer.process(input);

		// Attempts to fracture the single H1 box.
		// Should produce at least 2 boxes via paragraph chunking or fallback.
		expect(boxes.length).toBeGreaterThan(1);
		expect(boxes[0]?.tokenCount).toBeLessThan(350);
	});

	test("Handles empty content gracefully", () => {
		const boxes = boxer.process("");
		expect(boxes.length).toBe(0);
	});

	test("Preserves code blocks", () => {
		const input = `
## Coding

\`\`\`typescript
const x = 1;
\`\`\`
        `;
		const boxes = boxer.process(input);
		expect(boxes.length).toBe(1);
		expect(boxes[0]?.content).toContain("const x = 1;");
		expect(boxes[0]?.content).toContain("```typescript");
	});
});
