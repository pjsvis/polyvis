import { LocusLedger } from "../data/LocusLedger";

import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkStringify from "remark-stringify";
import remarkGfm from "remark-gfm";

// Define AST Types (Basic subset needed)
interface Node {
	type: string;
	children?: Node[];
	depth?: number; // For headings
	value?: string;
}

export interface BentoBox {
	locusId: string;
	content: string;
	tokenCount: number;
	isLeaf: boolean;
	tags?: string[];
}

export class BentoBoxer {
	private ledger: LocusLedger;
	// private masker: MarkdownMasker; // Disabled for AST pass
	private processor: any;

	constructor(ledger: LocusLedger) {
		this.ledger = ledger;
		
		// Initialize Unified Processor once
		this.processor = unified()
			.use(remarkParse)
			.use(remarkGfm)
			.use(remarkStringify, { bullet: "-", listItemIndent: "one" });
	}

	/**
	 * AST-based processing.
	 * 1. Parse Markdown to AST.
	 * 2. Traverse top-level nodes.
	 * 3. Group nodes by Heading (H1/H2).
	 * 4. Serialize groups back to Markdown.
	 */
	public process(text: string): BentoBox[] {
		if (!text.trim()) return [];

		const tree = this.processor.parse(text);
		const boxes: BentoBox[] = [];

		let currentNodes: Node[] = [];
		// let currentHeading: string | null = null; // Unused for now

		// 2. Iterate through top-level children
		for (const node of (tree.children as Node[])) {
			// SPLIT ON: Heading 1 or 2
			if (node.type === "heading" && (node.depth === 1 || node.depth === 2)) {
				// If we have accumulated content, flush it.
				if (currentNodes.length > 0) {
					boxes.push(this.createBox(currentNodes));
					currentNodes = [];
				}
				// Start new group with this heading
				// currentHeading = mdastToString(node);
				currentNodes.push(node);
			} else {
				// Accumulate (Paragraphs, Lists, etc.)
				currentNodes.push(node);
			}
		}

		// Flush remainder
		if (currentNodes.length > 0) {
			boxes.push(this.createBox(currentNodes));
		}

		// 3. Fallback: If only 1 box and it's huge, maybe split by H3?
		// For now, adhere to H1/H2 strictness.
		return boxes;
	}

	private createBox(nodes: Node[]): BentoBox {
		// Serialize AST back to Markdown string
		// Wrap in a root node for stringify
		const root = { type: "root", children: nodes };
		const content = this.processor.stringify(root).trim();
		const tokenCount = this.countTokens(content);
		
		// Deterministic ID based on content
		const hash = LocusLedger.hashContent(content);
		const id = this.ledger.getOrMintId(hash);

		return {
			locusId: id,
			content: content,
			tokenCount: tokenCount,
			isLeaf: true, // AST-boxing implies semantic leafs
		};
	}

	private countTokens(text: string): number {
		return text.split(/\s+/).length;
	}
}
