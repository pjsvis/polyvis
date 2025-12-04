import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

// --- Configuration ---
const ROOT_DIR = process.cwd();
const PUBLIC_DATA_DIR = join(ROOT_DIR, "public", "data");
const OUTPUT_FILE = join(PUBLIC_DATA_DIR, "references.json");

// Source Files (Adjust paths if they change)
// Note: Using example files if refs are missing/gitignored for safety in this env
const CDA_PATH = existsSync(join(ROOT_DIR, "scripts", "cda-ref-v63.json"))
	? join(ROOT_DIR, "scripts", "cda-ref-v63.json")
	: join(ROOT_DIR, "scripts", "cda.example.json");

const CL_PATH = existsSync(
	join(ROOT_DIR, "scripts", "conceptual-lexicon-ref-v1.79.json"),
)
	? join(ROOT_DIR, "scripts", "conceptual-lexicon-ref-v1.79.json")
	: join(ROOT_DIR, "scripts", "conceptual-lexicon.example.json");

console.log(`Building Reference Data...`);
console.log(`CDA Source: ${CDA_PATH}`);
console.log(`CL Source: ${CL_PATH}`);

// --- Types ---
interface ReferenceItem {
	id: string;
	title: string;
	content: string; // Markdown or Text
	type: "directive" | "term" | "heuristic";
	tags: string[];
}

interface ContentDef {
	Principle?: string;
	Steps?: string[];
}

interface CdaEntry {
	id: string;
	title: string;
	definition: string | ContentDef;
	tags?: string[];
}

interface CdaSection {
	entries: CdaEntry[];
}

interface ClEntry {
	id: string;
	title: string;
	description: string | ContentDef;
	type: string;
	tags?: string[];
}

// --- Helpers ---
function formatContent(def: string | ContentDef | unknown): string {
	if (typeof def === "string") return def;

	// Handle structured objects (e.g. Heuristics with Principle/Steps)
	if (typeof def === "object" && def !== null) {
		const d = def as ContentDef;
		let md = "";
		if (d.Principle) md += `**Principle:** ${d.Principle}\n\n`;
		if (d.Steps && Array.isArray(d.Steps)) {
			md += `**Steps:**\n${d.Steps.join("\n")}\n`;
		}
		return md;
	}
	return JSON.stringify(def);
}

// --- Main ---
function build() {
	const references: Record<string, ReferenceItem> = {};

	// 1. Process CDA
	try {
		const cdaRaw = readFileSync(CDA_PATH, "utf-8");
		const cda = JSON.parse(cdaRaw);

		// Flatten Directives
		if (cda.directives) {
			cda.directives.forEach((section: CdaSection) => {
				if (section.entries) {
					section.entries.forEach((entry: CdaEntry) => {
						references[entry.id] = {
							id: entry.id,
							title: entry.title,
							content: formatContent(entry.definition),
							type: "directive",
							tags: entry.tags || [],
						};
					});
				}
			});
		}
	} catch (e) {
		if (e instanceof Error) {
			console.warn(`Failed to process CDA: ${e.message}`);
		}
	}

	// 2. Process CL
	try {
		const clRaw = readFileSync(CL_PATH, "utf-8");
		const cl = JSON.parse(clRaw);

		if (Array.isArray(cl)) {
			cl.forEach((entry: ClEntry) => {
				references[entry.id] = {
					id: entry.id,
					title: entry.title,
					content: formatContent(entry.description),
					type: entry.type === "operational-heuristic" ? "heuristic" : "term",
					tags: entry.tags || [],
				};
			});
		}
	} catch (e) {
		if (e instanceof Error) {
			console.warn(`Failed to process CL: ${e.message}`);
		}
	}

	// 3. Write Output
	writeFileSync(OUTPUT_FILE, JSON.stringify(references, null, 2));
	console.log(
		`\nSuccess! Wrote ${Object.keys(references).length} references to ${OUTPUT_FILE}`,
	);
}

build();
