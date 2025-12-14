import { SEAMAN_CONSTANTS } from "../config/constants";
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
	 * AST-based processing (Fracture Logic v2).
	 * Groups by H1-H4, then applies size fracturing.
	 */
	public process(text: string): BentoBox[] {
		if (!text.trim()) return [];

		const tree = this.processor.parse(text);
		const boxes: BentoBox[] = [];

		let currentNodes: Node[] = [];

		// 2. Iterate through top-level children
		for (const node of (tree.children as Node[])) {
			// SPLIT ON: Heading 1, 2, 3, 4
			if (node.type === "heading" && node.depth && node.depth <= 4) {
				// If we have accumulated content, flush it.
				if (currentNodes.length > 0) {
					boxes.push(...this.packageContent(currentNodes));
					currentNodes = [];
				}
				// Start new group with this heading
				currentNodes.push(node);
			} else {
				// Accumulate (Paragraphs, Lists, etc.)
				currentNodes.push(node);
			}
		}

		// Flush remainder
		if (currentNodes.length > 0) {
			boxes.push(...this.packageContent(currentNodes));
		}

		return boxes;
	}

	/**
	 * Packages a group of AST nodes into BentoBoxes.
	 * Applies "Fracture Check" to split large nodes.
	 */
	private packageContent(nodes: Node[]): BentoBox[] {
		// Serialize AST back to Markdown string
		const root = { type: "root", children: nodes };
		const content = this.processor.stringify(root).trim();
		const tokenCount = this.countTokens(content);

		// BASE CASE: Fits in Seaman Constant
		if (tokenCount <= SEAMAN_CONSTANTS.MAX_SIZE) {
			return [this.createBox(content, tokenCount)];
		}

		// FRACTURE CASE: Too big.
		// Strategy: Split by Thematic Break (HR) or Paragraph chunks.
		
		// 1. Try splitting by Thematic Break
		const hrIndex = nodes.findIndex((n) => n.type === "thematicBreak");
		if (hrIndex !== -1) {
			const left = nodes.slice(0, hrIndex);
			const right = nodes.slice(hrIndex + 1); // Skip HR itself
			return [...this.packageContent(left), ...this.packageContent(right)];
		}

		// 2. Fallback: Paragraph Chunking
		// This is a naive split to safety.
		// We split the nodes array in half.
		if (nodes.length > 1) {
			const mid = Math.floor(nodes.length / 2);
			const left = nodes.slice(0, mid);
			const right = nodes.slice(mid);
			return [...this.packageContent(left), ...this.packageContent(right)];
		}

		// 3. Last Resort: Single Huge Node (e.g. Code Block)
		// We just ship it.
		return [this.createBox(content, tokenCount)];
	}

	private createBox(content: string, tokenCount: number): BentoBox {
		// Deterministic ID based on content
		const hash = LocusLedger.hashContent(content);
		const id = this.ledger.getOrMintId(hash);

		return {
			locusId: id,
			content: content,
			tokenCount: tokenCount,
			isLeaf: true,
		};
	}

	private countTokens(text: string): number {
		return text.split(/\s+/).length;
	}
}
