import { ResonanceDB } from "@resonance/src/db";
import { Embedder } from "@resonance/src/services/embedder";
import { BentoNormalizer } from "@src/core/BentoNormalizer";
import { EdgeWeaver } from "@src/core/EdgeWeaver";
import { Glob } from "bun";
import { join, normalize } from "path";
import { BentoBoxer } from "@src/core/BentoBoxer";
import { LocusLedger } from "@src/data/LocusLedger";

export class ResonanceSync {
    private ledger: LocusLedger;
    private boxer: BentoBoxer;

    constructor() {
        this.ledger = new LocusLedger("bento_ledger.sqlite");
        this.boxer = new BentoBoxer(this.ledger);
    }

    async run(limit: number = Infinity) {
        console.log(`🚀 Starting Resonance Sync (Limit: ${limit === Infinity ? "ALL" : limit})`);

        // --- 1. Load Settings ---
        const settingsRaw = await Bun.file("polyvis.settings.json").text();
        const settings = JSON.parse(settingsRaw);

        // --- 2. Initialize Engine ---
        const db = new ResonanceDB(settings.paths.database.resonance);
        const embedder = Embedder.getInstance();
        console.log("🧠 Loading Embedding Model (FastEmbed)...");
        await embedder.embed("init");

        console.log(`📦 Resonance Engine Initialized: ${settings.paths.database.resonance}`);

        const allLexiconItems: unknown[] = [];

        // --- 3a. Pipeline: CDA ---
        if (settings.paths?.sources?.persona?.cda) {
             await this.ingestCDA(db, embedder, settings.paths.sources.persona.cda, allLexiconItems);
        }

        // --- 3b. Pipeline: Conceptual Lexicon ---
        if (settings.paths?.sources?.persona?.lexicon) {
            await this.ingestLexicon(db, embedder, settings.paths.sources.persona.lexicon, allLexiconItems);
        }

        // --- INITIALIZE EDGE WEAVER ---
        const weaver = new EdgeWeaver(db, allLexiconItems as { id: string; title?: string; aliases?: string[] }[]);
        console.log(`🕸️  Edge Weaver Initialized (${allLexiconItems?.length || 0} concepts)`);

        // --- 4. Pipeline B: Markdown Docs ---
        for (const source of settings.paths.sources.experience) {
            await this.processDirectory(source, db, embedder, weaver, limit);
        }

        // --- 5. TimeWeaver ---
        this.runTimeWeaver(db);

        // Stats
        const stats = db.getStats();
        console.log(`   ----------------------------------------`);
        console.log(`   Database Stats:`);
        console.log(`   - Nodes: ${stats.nodes}`);
        console.log(`   - Vectors: ${stats.vectors}`);
        console.log(`   - Edges: ${stats.edges}`);
        console.log(`   - DB Size: ${(stats.db_size_bytes / 1024 / 1024).toFixed(2)} MB`);
        console.log(`   ----------------------------------------`);

        // Checkpoint
        db.checkpoint();
        db.close();

        // Copy to public
        await this.publishDatabase(settings.paths.database.resonance);

        console.log("🚀 Unification Sync Complete.");
    }

    // ...

    private async processDirectory(source: { path: string; name: string }, db: ResonanceDB, embedder: Embedder, weaver: EdgeWeaver, limit: number) {
        const dir = source.path;
        const pattern = new Glob(`${dir}/**/*.md`);
        let fileCount = 0;
        console.log(`📂 Scanning ${dir} (${source.name})...`);

        for await (const file of pattern.scan(".")) {
            const rawContent = await Bun.file(file).text();
            const filename = file.split("/").pop() || "";
            const content = BentoNormalizer.normalize(rawContent, filename);
            const contentHash = Bun.hash(content).toString();
            const existingHash = db.getNodeHash(file);

            if (existingHash === contentHash) continue;
            console.log(`📝 Updating ${file}...`);

            const leadSummary = content.slice(0, 1000);
            const vec = await embedder.embed(leadSummary);

            const fileNodeId = file;
            const dateMatch = filename.match(/^(\d{4}-\d{2}-\d{2})/);
            const created = dateMatch ? dateMatch[1] : null;

            db.insertNode({
                id: fileNodeId,
                type: source.name.toLowerCase(),
                label: file.split("/").pop(),
                content: content.slice(0, 500) + "\n\n... [Content truncated. See Source File] ...",
                domain: "resonance",
                layer: "experience",
                embedding: vec,
                hash: contentHash,
                meta: { created: created, source: file }
            });

            weaver.weave(fileNodeId, content);

            // Ingest Injected Tags
            const tagMatch = content.match(/<!-- tags: (.*?) -->/);
            if (tagMatch && tagMatch[1]) {
                const tags = tagMatch[1].split(",").map(t => t.trim());
                this.extractEdgesFromTags(db, fileNodeId, tags);
            }

            // Auto-detect Boxed Content (formerly "Playbook" logic)
            if (content.includes("<!-- locus:")) {
                await this.processPlaybookSections(fileNodeId, content, db, embedder, weaver);
            }

            fileCount++;
            if (limit && fileCount >= limit) break;
        }
        console.log(`✅ ${dir}: ${fileCount} files processed.`);
    }



    private async ingestCDA(db: ResonanceDB, embedder: Embedder, cdaPath: string, allLexiconItems: unknown[]) {
        console.log(`📜 Ingesting CDA: ${cdaPath}`);
        const cdaRaw = await Bun.file(cdaPath).text();
        const cda = JSON.parse(cdaRaw);
        let cdaCount = 0;

        if (cda.directives && Array.isArray(cda.directives)) {
            for (const section of cda.directives) {
                if (section.entries && Array.isArray(section.entries)) {
                    for (const item of section.entries) {
                        const textToEmbed = String(item.definition || item.title || item.term || item.id || "");
                        if (!textToEmbed || textToEmbed.trim() === "") continue;

                        allLexiconItems.push(item);
                        const vec = await embedder.embed(textToEmbed);

                        db.insertNode({
                            id: item.id,
                            type: "directive",
                            label: item.title || item.term || item.id,
                            content: item.definition || "",
                            domain: "system",
                            layer: "ontology",
                            embedding: vec,
                            meta: {
                                section: section.section,
                                tags: item.tags || [],
                            },
                        });

                        this.extractEdgesFromTags(db, item.id, item.tags || []);
                        cdaCount++;
                    }
                }
            }
        }
        console.log(`✅ CDA Synced: ${cdaCount} items.`);
    }

    private async ingestLexicon(db: ResonanceDB, embedder: Embedder, lexiconPath: string, allLexiconItems: unknown[]) {
        console.log(`📚 Ingesting Lexicon: ${lexiconPath}`);
        const lexiconRaw = await Bun.file(lexiconPath).text();
        const lexicon = JSON.parse(lexiconRaw);
        let termCount = 0;

        for (const term of lexicon) {
            allLexiconItems.push(term);
            const textToEmbed = String(term.definition || term.description || term.id || "");
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

            this.extractEdgesFromTags(db, term.id, term?.tags || []);
            termCount++;
        }
        console.log(`✅ Lexicon Synced: ${termCount} items.`);
    }

    private extractEdgesFromTags(db: ResonanceDB, sourceId: string, tags: string[]) {
        const tagRegex = /\[([\w_]+):\s*([^\]]+)\]/;
        for (const tag of tags) {
            const match = tag.match(tagRegex);
            if (match && match[1] && match[2]) {
                const relType = match[1].toLowerCase();
                const targetId = match[2].trim();
                if (relType === "quality" || relType.startsWith("#")) continue;
                db.insertEdge(sourceId, targetId, relType);
            }
        }
    }



    private async processPlaybookSections(
        fileNodeId: string, 
        content: string, 
        db: ResonanceDB, 
        embedder: Embedder, 
        weaver: EdgeWeaver
    ) {
        const boxes = this.boxer.process(content);
        for (const box of boxes) {
            const lines = box.content.split("\n");
            const title = lines[0]?.replace(/^#+\s+/, "").trim() || "Untitled Section";
            const sectionId = `${fileNodeId}#${this.slugify(title)}-${box.locusId.slice(0, 6)}`;
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

            db.insertEdge(fileNodeId, sectionId, "HAS_CHILD");
            weaver.weave(sectionId, box.content);
        }
    }

    private runTimeWeaver(db: ResonanceDB) {
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
    }

    private async publishDatabase(dbPath: string) {
        const publicPath = join(process.cwd(), "public", "resonance.db");
        const sourcePath = normalize(dbPath);
        
        if (normalize(publicPath) !== sourcePath) {
            console.log(`📋 Publishing to: ${publicPath}`);
            await Bun.write(
                publicPath,
                await Bun.file(sourcePath).arrayBuffer(),
            );
        }
    }

    private slugify(text: string) {
        return text
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/^-|-$/g, "");
    }
}
