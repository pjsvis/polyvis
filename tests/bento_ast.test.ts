
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
        
        expect(boxes[0]!.content).toContain("# Main Title");
        expect(boxes[0]!.content).toContain("Introduction content");
        
        expect(boxes[1]!.content).toContain("## Section 1");
        expect(boxes[1]!.content).toContain("Content for section 1");

        expect(boxes[2]!.content).toContain("## Section 2");
        expect(boxes[2]!.content).toContain("> Blockquote");
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
        expect(boxes[0]!.content).toContain("const x = 1;");
        expect(boxes[0]!.content).toContain("```typescript");
    });
});
