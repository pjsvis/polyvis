import { ResonanceDB } from "@resonance/src/db";
import { Embedder } from "@resonance/src/services/embedder";
import { BentoNormalizer } from "@src/core/BentoNormalizer"; // Moved to Src
import { EdgeWeaver } from "@src/core/EdgeWeaver"; // Moved to Src
import { Glob } from "bun";
import { join, normalize } from "path";
import { parseArgs } from "util";

// Parse args for fail-fast limit
const { values } = parseArgs({
	args: Bun.argv,
	options: {
		limit: {
			type: "string",
		},
	},
	strict: true,
	allowPositionals: true,
});

import { BentoBoxer } from "@src/core/BentoBoxer"; // Added
import { LocusLedger } from "@src/data/LocusLedger"; // Added

// Constants wrapper to avoid recreating expensive objects
const Constants = {
	ledger: new LocusLedger("bento_ledger.sqlite"),
	get boxer() {
		if (!this._boxer) this._boxer = new BentoBoxer(this.ledger);
		return this._boxer;
	},
	_boxer: null as BentoBoxer | null,
};

const LIMIT = values.limit ? parseInt(values.limit) : Infinity;

console.log(
	`🚀 Starting Resonance Sync (Limit: ${LIMIT === Infinity ? "ALL" : LIMIT})`,
);

async function main() {
	// --- 1. Load Settings ---
	const settingsRaw = await Bun.file("polyvis.settings.json").text();
	const settings = JSON.parse(settingsRaw);

	// --- 2. Initialize Engine ---
	const db = new ResonanceDB(settings.paths.database.resonance);
	const embedder = Embedder.getInstance();
	console.log("🧠 Loading Embedding Model (FastEmbed)...");
	// Trigger cache load
	await embedder.embed("init");

	console.log(`📦 Resonance Engine Initialized: ${settings.dbPath}`);

	// --- 3a. Pipeline: CDA (Core Directive Array) ---
	// Note: We need to capture ALL lexicon items (Lexicon + CDA) into a single array for the Weaver.
	const allLexiconItems: unknown[] = [];

	if (settings.paths?.sources?.persona?.cda) {
		const cdaPath = settings.paths.sources.persona.cda;
		console.log(`📜 Ingesting CDA: ${cdaPath}`);
		const cdaRaw = await Bun.file(cdaPath).text();
		const cda = JSON.parse(cdaRaw);

		let cdaCount = 0;

		// Flatten nested structure: cda.directives[].entries[]
		if (cda.directives && Array.isArray(cda.directives)) {
			for (const section of cda.directives) {
				if (section.entries && Array.isArray(section.entries)) {
					for (const item of section.entries) {
						const textToEmbed = String(
							item.definition || item.title || item.term || item.id || "",
						);
						if (!textToEmbed || textToEmbed.trim() === "") continue;

						// Add to Weaver Context
						allLexiconItems.push(item);

						const vec = await embedder.embed(textToEmbed);

						db.insertNode({
							id: item.id,
							type: "directive", // or 'term' - keep distinct?
							label: item.title || item.term || item.id,
							content: item.definition || "",
							domain: "system", // CDA is system prompts/rules
							layer: "ontology",
							embedding: vec,
							meta: {
								section: section.section,
								tags: item.tags || [],
							},
						});

						// Parse Edges from Tags (Self-reference tags inside definitions)
						// Note: We create a temporary weaver just for this?
						// Or just rely on the existing extractEdgesFromTags legacy for now?
						// Let's keep legacy for explicit [Rel:Target] tags inside this structured JSON.
						extractEdgesFromTags(db, item.id, item.tags || []);
						cdaCount++;
					}
				}
			}
		}
		console.log(`✅ CDA Synced: ${cdaCount} items.`);
	}

	// --- 3b. Pipeline: Conceptual Lexicon (JSON) ---
	if (settings.paths?.sources?.persona?.lexicon) {
		const lexiconPath = settings.paths.sources.persona.lexicon;
		console.log(`📚 Ingesting Lexicon: ${lexiconPath}`);

		const lexiconRaw = await Bun.file(lexiconPath).text();
		const lexicon = JSON.parse(lexiconRaw); // Array of terms

		let termCount = 0;
		for (const term of lexicon) {
			// Add to Weaver Context
			allLexiconItems.push(term);

			const textToEmbed = String(
				term.definition || term.description || term.id || "",
			);
			if (!textToEmbed || textToEmbed.trim() === "") continue;
			const vec = await embedder.embed(textToEmbed);

			db.insertNode({
				id: term.id,
				type: "term",
				label: term.title || term.id,
				content: term.definition || term.description || "",
				domain: "persona",
				layer: "lexicon",
				embedding: vec,
				meta: {
					aliases: term?.aliases || [],
					tags: term?.tags || [],
				},
			});

			// Parse Edges from Tags
			extractEdgesFromTags(db, term.id, term?.tags || []);

			termCount++;
			if (termCount % 100 === 0) process.stdout.write(".");
		}
		console.log(`\n✅ Lexicon Synced: ${termCount} items.`);
	}

	function extractEdgesFromTags(
		db: ResonanceDB,
		sourceId: string,
		tags: string[],
	) {
		// Regex to match [RelType: TargetID] e.g. [Implements: PHI-2]
		// Also handling [TargetID] e.g. [PHI-2] (implicit) ?? Not common in this schema.
		const tagRegex = /\[([\w_]+):\s*([^\]]+)\]/;

		for (const tag of tags) {
			const match = tag.match(tagRegex);
			if (match && match[1] && match[2]) {
				const relType = match[1].toLowerCase(); // implements, guided_by
				const targetId = match[2].trim();

				// Ignore some non-relational tags like [Quality: silver] or [#foundation]
				if (relType === "quality" || relType.startsWith("#")) continue;

				db.insertEdge(sourceId, targetId, relType);
			}
		}
	}

	// --- INITIALIZE EDGE WEAVER ---
	const weaver = new EdgeWeaver(db, allLexiconItems as { id: string; title?: string; aliases?: string[] }[]);
	console.log(
		`🕸️  Edge Weaver Initialized (${allLexiconItems?.length || 0} concepts)`,
	);

	// --- 4. Pipeline B: Markdown Docs (Debriefs / Playbooks) ---
	for (const dir of settings.paths.sources.experience.directories) {
		const pattern = new Glob(`${dir}/**/*.md`);
		let fileCount = 0;

		console.log(`📂 Scanning ${dir}...`);

		for await (const file of pattern.scan(".")) {
			// ... (Existing Dirty Check Logic) ...
			const rawContent = await Bun.file(file).text();
			const filename = file.split("/").pop() || "";

			// --- BENTO BOX NORMALIZATION ---
			// Ensure content conforms to standard (Single H1, no H4+)
			// We use the normalizer even if the file on disk isn't perfectly clean yet,
			// ensuring the Graph is always pristine.
			const content = BentoNormalizer.normalize(rawContent, filename);

			const contentHash = Bun.hash(content).toString();
			const existingHash = db.getNodeHash(file);

			if (existingHash === contentHash) {
				// console.log(`⏩ Skipping ${file} (Unchanged)`);
				continue;
			} else {
				console.log(`📝 Updating ${file}...`);
			}

			// Embed File Level (LEAD SUMMARY ONLY)
			// Strategy: The Vector represents the "Head" (Topic), not the "Body".
			const leadSummary = content.slice(0, 1000); 
			const vec = await embedder.embed(leadSummary);

			const fileNodeId = file;

			// Extract Date from Filename
			const dateMatch = filename.match(/^(\d{4}-\d{2}-\d{2})/);
			const created = dateMatch ? dateMatch[1] : null;

			db.insertNode({
				id: fileNodeId,
				type: dir.includes("playbooks") ? "playbook" : "debrief",
				label: file.split("/").pop(),
				// THIN NODE PROTOCOL:
				// We store a minimal preview here. The full content lives on the filesystem.
				// Future: UI should fetch raw markdown from `meta.source` on demand.
				content: content.slice(0, 500) + "\n\n... [Content truncated. See Source File] ...", 
				domain: "resonance",
				layer: "experience",
				embedding: vec,
				hash: contentHash,
				meta: { created: created, source: file }
			});

			// --- WEAVE FILE LEVEL ---
			// Some docs might have tags at top level? Unlikely with Bento, but harmless to check.
			weaver.weave(fileNodeId, content);

			// AST Section Chunking (For Playbooks only)
			if (dir.includes("playbooks")) {
				const boxes = Constants.boxer.process(content);

				for (const box of boxes) {
					// Extract Title from content (first line usually)
					const lines = box.content.split("\n");
					const title = lines[0]?.replace(/^#+\s+/, "").trim() || "Untitled Section";
					
					// Skip empty or tiny sections handled by Fracture Logic, 
					// but actually BentoBoxer guarantees semantic chunks.
					
					const sectionId = `${fileNodeId}#${slugify(title)}-${box.locusId.slice(0, 6)}`;
					const sectionVec = await embedder.embed(box.content);

					db.insertNode({
						id: sectionId,
						type: "section",
						label: title,
						content: box.content,
						domain: "resonance",
						layer: "rule",
						embedding: sectionVec,
						meta: { 
							parent: fileNodeId,
							box_id: box.locusId,
							token_count: box.tokenCount
						},
					});

					// Link File -> Section
					db.insertEdge(fileNodeId, sectionId, "HAS_CHILD");

					// --- WEAVE SECTION LEVEL ---
					weaver.weave(sectionId, box.content);
				}
			}

			fileCount++;
			if (LIMIT && fileCount >= LIMIT) break;
		}
		console.log(`✅ ${dir}: ${fileCount} files processed.`);
	}

	// --- 5. OPTIONAL: TimeWeaver (Restore Narrative) ---
	// Linking sorted debriefs to establish the "Red Thread" of history.
	console.log("🕰️  Running TimeWeaver...");
	const debriefs = db.getNodesByType("debrief")
		.filter(n => n.meta?.created)
		.sort((a, b) => (a.meta.created || "").localeCompare(b.meta.created || ""));

	let prevDebriefId = null;
	let timeEdges = 0;
	
	for (const node of debriefs) {
		if (prevDebriefId) {
			db.insertEdge(prevDebriefId, node.id, "SUCCEEDS");
			timeEdges++;
		}
		prevDebriefId = node.id;
	}
	console.log(`✅ TimeWeaver connected ${timeEdges} chronological steps.`);

	function slugify(text: string) {
		return text
			.toLowerCase()
			.replace(/[^a-z0-9]+/g, "-")
			.replace(/^-|-$/g, "");
	}

	// Checkpoint WAL to ensure data is flushed to main file
	db.checkpoint();
	db.close();

	// Copy to public for frontend (Only if different)
	const publicPath = join(process.cwd(), "public", "resonance.db");
	const sourcePath = normalize(settings.paths.database.resonance);
	
	if (normalize(publicPath) !== sourcePath) {
		console.log(`📋 Publishing to: ${publicPath}`);
		await Bun.write(
			publicPath,
			await Bun.file(sourcePath).arrayBuffer(),
		);
	} else {
		console.log("📋 Database is already in public directory. Skipping copy.");
	}

	console.log("🚀 Unification Sync Complete.");
}

main().catch(console.error);
