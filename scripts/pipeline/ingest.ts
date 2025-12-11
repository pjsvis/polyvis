import { ResonanceDB } from "@resonance/src/db";
import { Embedder } from "@resonance/src/services/embedder";
import { TokenizerService } from "@resonance/src/services/tokenizer";
import { EdgeWeaver } from "@src/core/EdgeWeaver";
import { LocusLedger } from "@src/data/LocusLedger";
import { Glob } from "bun";
import { join } from "path";
import { parseArgs } from "util";
import settings from "@/polyvis.settings.json";

// Types
interface LexiconItem {
	id: string;
	title: string;
	aliases: string[];
}

/**
 * THE BRIDGE: Ingestion Pipeline
 * 1. Scans Boxed Files
 * 2. Checks Deltas (Content Hash)
 * 3. Embeds & Inserts Nodes
 * 4. Weaves Edges
 */
async function main() {
	console.log("🌉 <THE BRIDGE> Ingestion Protocol Initiated...");
	const { values } = parseArgs({
		args: Bun.argv,
		options: {
			file: { type: "string" },
			dir: { type: "string" },
			db: { type: "string" },
		},
		strict: false,
	});

	const dbPath = values.db
		? join(process.cwd(), String(values.db))
		: join(process.cwd(), settings.paths.database.resonance);
	const db = new ResonanceDB(dbPath);
	const embedder = Embedder.getInstance();
	const tokenizer = TokenizerService.getInstance();

	// 0. Bootstrap Lexicon (for Weaver)
	let lexicon: LexiconItem[] = [];
	try {
		const legacyPath = join(
			process.cwd(),
			settings.paths.sources.persona.lexicon,
		);
		if (legacyPath) {
			const file = Bun.file(legacyPath);
			if (await file.exists()) {
				if (await file.json()) {
					const data = await file.json();
					const items = Array.isArray(data) ? data : data.concepts;

					lexicon = (items as any[]).map((c: any) => ({
						id: c.id,
						title: c.title,
						aliases: c.aliases || [],
					}));

					// BOOTSTRAP: Insert Lexicon Nodes (Persona Graph)
					// This ensures the concepts exist for edges to connect to!
					for (const item of items) {
						// Check if node exists? No, generic insert handles upsert.
						// But we don't have embeddings for them yet, which is fine for graph structure.
						// Or we could embed the description? (Leaving as future optimization)

						db.insertNode({
							id: item.id,
							type: "concept",
							label: item.title,
							content: item.description || item.title,
							domain: "persona",
							layer: "ontology",
							// embedding: null // Embedder will be needed later for search
							meta: {
								category: item.category,
								tags: item.tags,
							},
						} as any);
					}
					console.log(
						`📚 Bootstrapped Lexicon: ${lexicon.length} concepts and nodes.`,
					);

					// Teach Tokenizer
					tokenizer.loadLexicon(lexicon);
				}
			}
		}
	} catch (e) {
		console.warn("⚠️  Lexicon bootstrap failed (skipping):", e);
	}

	const weaver = new EdgeWeaver(db, lexicon);

	// 1. Determine Sources
	const filesToProcess: string[] = [];

	if (values.file) {
		filesToProcess.push(String(values.file));
	} else {
		const sourceDirs = values.dir
			? [String(values.dir)]
			: settings.paths.sources.experience.directories;
		for (const dir of sourceDirs) {
			const glob = new Glob("**/*.md");
			for await (const file of glob.scan(dir)) {
				filesToProcess.push(join(process.cwd(), dir, file));
			}
		}
	}

	// Process
	// Start Timer
	const startTime = performance.now();
	let totalChars = 0;

	// Process
	let processedCount = 0;
	for (const filePath of filesToProcess) {
		// Collect stats from processFile
		const charsProccessed = await processFile(
			filePath,
			db,
			embedder,
			weaver,
			tokenizer,
		);
		totalChars += charsProccessed;
		processedCount++;
	}

	const endTime = performance.now();
	const durationSec = (endTime - startTime) / 1000;
	const charsPerSec = totalChars / durationSec;
	const dbStats = db.getStats();

	// Cleanup
	db.close();
	console.log(`🏁 Ingestion Complete.`);
	console.log(`   Processed: ${processedCount} files.`);
	console.log(
		`   Total Load: ${(totalChars / 1024).toFixed(2)} KB (${totalChars} chars)`,
	);
	console.log(`   Time Taken: ${durationSec.toFixed(2)}s`);
	console.log(`   Throughput: ${charsPerSec.toFixed(2)} chars/sec`);
	console.log(`   ----------------------------------------`);
	console.log(`   Database Stats:`);
	console.log(`   - Nodes: ${dbStats.nodes}`);
	console.log(`   - Vectors: ${dbStats.vectors}`);
	console.log(`   - Edges: ${dbStats.edges}`);
	console.log(`   - Semantic Tagged: ${dbStats.semantic_tokens}`);
	console.log("   ----------------------------------------");

	db.close();
}

main().catch(console.error);

async function processFile(
	filePath: string,
	db: ResonanceDB,
	embedder: Embedder,
	weaver: EdgeWeaver,
	tokenizer: TokenizerService,
): Promise<number> {
	const content = await Bun.file(filePath).text();

	// 1. Parse File Level Metadata (Frontmatter)
	// Simple regex for frontmatter
	const fmMatch = content.match(/^---\n([\s\S]*?)\n---/);
	const frontmatter = fmMatch && fmMatch[1] ? parseFrontmatter(fmMatch[1]) : {};
	let totalBoxChars = 0;

	// Default Type based on folder/path?
	// e.g. "playbooks/..." -> "playbook"
	let type = "document";
	if (filePath.includes("playbook")) type = "playbook";
	if (filePath.includes("debrief")) type = "debrief";

	// 2. Parse Boxes (by Locus Tag)
	// Regex to split by `<!-- locus:UUID -->`
	// Captures the ID and the following content until next tag or EOF
	const boxRegex =
		/<!-- locus:([a-zA-Z0-9-]+) -->\n([\s\S]*?)(?=<!-- locus:|$)/g;

	// If the file is NOT boxed (no locus tags), treat whole file as one node?
	// Or skip? The brief says "Input: Bento-Boxed Files".
	// If we run on unboxed files, we might treat them as legacy or single nodes.
	// Let's support Locus Tags primarily.

	let match: RegExpExecArray | null;
	let foundBoxes = false;

	while (true) {
		match = boxRegex.exec(content);
		if (!match) break;

		// Strict null check: Ensure match groups exist
		if (!match[1] || !match[2]) continue;

		foundBoxes = true;
		const locusId = match[1];
		const boxContent = match[2].trim();

		await processBox(
			locusId,
			boxContent,
			type,
			frontmatter,
			filePath,
			db,
			embedder,
			weaver,
			tokenizer,
		);
		totalBoxChars += boxContent.length;
	}

	if (!foundBoxes) {
		// Fallback: Treat entire file as one node (Auto-Box)
		const filename = filePath.split("/").pop() || "unknown";
		const id = filename
			.replace(".md", "")
			.toLowerCase()
			.replace(/[^a-z0-9-]/g, "-");

		// Only ingest if content is meaningful
		if (content.length > 10) {
			// console.log(`📦 [${id}] Auto-Boxing (Whole File)`);
			await processBox(
				id,
				content,
				type,
				frontmatter,
				filePath,
				db,
				embedder,
				weaver,
				tokenizer,
			);
			return content.length;
		}
		return 0;
	}
	return totalBoxChars;
}

async function processBox(
	id: string,
	content: string,
	type: string,
	meta: any,
	sourcePath: string,
	db: ResonanceDB,
	embedder: Embedder,
	weaver: EdgeWeaver,
	tokenizer: TokenizerService,
) {
	// 0. Semantic Token Extraction
	const tokens = tokenizer.extract(content);
	// 1. Hash Check (Delta)
	const currentHash = LocusLedger.hashContent(content);
	const storedHash = db.getNodeHash(id);

	if (storedHash === currentHash) {
		// Idempotent Skip
		// console.log(`⏩ [${id}] Unchanged.`);
		return;
	}

	console.log(`⚡️ [${id}] Ingesting (${content.length} chars)...`);

	// 2. Embedding
	// Only embed if content is sufficient?
	const embedding = await embedder.embed(content);

	// 3. Insert Node
	const node = {
		id: id,
		type: type,
		label: meta.title || sourcePath.split("/").pop(), // Fallback title
		content: content,
		domain: "knowledge", // Default
		layer: "experience", // Default
		embedding: embedding, // Float32Array
		hash: currentHash,
		meta: { ...meta, source: sourcePath, semantic_tokens: tokens },
	};

	db.insertNode(node);

	// 4. Weave Edges
	weaver.weave(id, content, tokens);
}

function parseFrontmatter(text: string): Record<string, any> {
	const meta: Record<string, any> = {};
	text.split("\n").forEach((line) => {
		const [key, ...vals] = line.split(":");
		if (key && vals.length) {
			meta[key.trim()] = vals.join(":").trim();
		}
	});
	return meta;
}

// Run (if main)
if (import.meta.main) {
	main();
}
