import { ResonanceDB } from "@src/resonance/db";
import { Embedder } from "@src/resonance/services/embedder";
import { TokenizerService } from "@src/resonance/services/tokenizer";
import { EdgeWeaver } from "@src/core/EdgeWeaver";
import { LocusLedger } from "@src/data/LocusLedger";
import { Glob } from "bun";
import { join } from "path";
import settings from "@/polyvis.settings.json";
import { PipelineValidator } from "@src/utils/validator";
import { Database } from "bun:sqlite";
import { LouvainGate } from "@src/core/LouvainGate";

// Types
export interface IngestorOptions {
    file?: string;
    dir?: string;
    dbPath?: string;
}

interface LexiconItem {
	id: string;
	title: string;
	aliases: string[];
}

export class Ingestor {
    private db: ResonanceDB;
    private embedder: Embedder;
    private tokenizer: TokenizerService;
    private dbPath: string;

    constructor(dbPath?: string) {
        this.dbPath = dbPath 
            ? join(process.cwd(), dbPath)
            : join(process.cwd(), settings.paths.database.resonance);
        
        this.db = new ResonanceDB(this.dbPath);
        this.embedder = Embedder.getInstance();
        this.tokenizer = TokenizerService.getInstance();
    }

    /**
     * UNIFIED PIPELINE RUNNER
     * Runs both Persona and Experience pipelines.
     */
    async run(options: IngestorOptions = {}) {
        const sqliteDb = await this.init(options);
        
        // Phase 1: Persona
        const lexiconItems = await this.runPersona();
        
        // Phase 2: Experience
        await this.runExperience(options, lexiconItems, sqliteDb);
        
        this.cleanup(sqliteDb);
        return true; // Simplified success check
    }

    /**
     * PHASE 1: PERSONA
     * Ingests Core Ontology (Lexicon) and Directives (CDA).
     */
    async runPersona(): Promise<LexiconItem[]> {
        console.log("🧩 [Phase 1] Starting Persona Ingestion...");
        
        // 1. Lexicon
        const lexicon = await this.bootstrapLexicon();
        
        // 2. CDA
        await this.ingestCDA();
        
        console.log("✅ [Phase 1] Persona Ingestion Complete.");
        return lexicon;
    }

    /**
     * PHASE 2: EXPERIENCE
     * Ingests Documents, Playbooks, and Debriefs.
     */
    async runExperience(options: IngestorOptions, lexicon: LexiconItem[] = [], sqliteDb: Database) {
        console.log("📚 [Phase 2] Starting Experience Ingestion...");

        // If lexicon is empty (e.g. running independently), try loading from DB
        if (lexicon.length === 0) {
            lexicon = await this.loadLexiconFromDB();
        }

        const weaver = new EdgeWeaver(this.db, lexicon);
        const filesToProcess = this.getFilesToProcess(options);

        // Process
        const startTime = performance.now();
        let totalChars = 0;
        let processedCount = 0;

        for (const filePath of filesToProcess) {
            const charsProccessed = await this.processFile(
                filePath,
                this.db,
                this.embedder,
                weaver,
                this.tokenizer,
            );
            totalChars += charsProccessed;
            processedCount++;
        }

        const endTime = performance.now();
        const durationSec = (endTime - startTime) / 1000;
        const charsPerSec = totalChars / durationSec;
        const dbStats = this.db.getStats();

        this.logStats(processedCount, totalChars, durationSec, charsPerSec, dbStats);

        // Weaving
        await this.runWeavers();
        
        // Validation (On native SQLite connection for speed/independence)
        const validator = new PipelineValidator();
        validator.captureBaseline(sqliteDb); 
        
        // Only run validation if we processed files
        if (processedCount > 0) {
             const report = validator.validate(sqliteDb);
             validator.printReport(report);
        }
        console.log("✅ [Phase 2] Experience Ingestion Complete.");
    }
    
    // --- Lifecycle Helpers ---
    
    private async init(options: IngestorOptions) {
        console.log("🌉 <THE BRIDGE> Ingestion Protocol Initiated...");
        // Ensure Embedder Init
        await this.embedder.embed("init");
        return new Database(this.dbPath);
    }
    
    private cleanup(sqliteDb: Database) {
        sqliteDb.close();
        this.db.close();
    }
    
    private async loadLexiconFromDB(): Promise<LexiconItem[]> {
        console.log("🧠 Loading Lexicon from Database...");
        const rawLexicon = this.db.getLexicon();
        const lexicon: LexiconItem[] = rawLexicon.map((item: any) => ({
            id: item.id,
            title: item.label,
            aliases: item.aliases || []
        }));
        this.tokenizer.loadLexicon(lexicon);
        return lexicon;
    }

    private async bootstrapLexicon(): Promise<LexiconItem[]> {
        let lexicon: LexiconItem[] = [];
        try {
            const legacyPath = join(process.cwd(), settings.paths.sources.persona.lexicon);
            if (legacyPath) {
                const file = Bun.file(legacyPath);
                if (await file.exists()) {
                    const json = await file.json();
                    if (json) {
                        const items = Array.isArray(json) ? json : json.concepts;
                        lexicon = (items as any[]).map((c: any) => ({
                            id: c.id,
                            title: c.title,
                            aliases: c.aliases || [],
                        }));

                        // Bootstrap Nodes
                        for (const item of items) {
                            this.db.insertNode({
                                id: item.id,
                                type: "concept",
                                label: item.title,
                                content: item.description || item.title,
                                domain: "persona",
                                layer: "ontology",
                                meta: {
                                    category: item.category,
                                    tags: item.tags,
                                },
                            } as any);
                        }
                        console.log(`📚 Bootstrapped Lexicon: ${lexicon.length} concepts.`);
                        this.tokenizer.loadLexicon(lexicon);
                    }
                }
            }
        } catch (e) {
            console.warn("⚠️  Lexicon bootstrap failed:", e);
        }
        return lexicon;
    }

    private async ingestCDA() {
        try {
            const enrichedCdaPath = join(process.cwd(), ".resonance", "artifacts", "cda-enriched.json");
            const cdaFile = Bun.file(enrichedCdaPath);

            if (await cdaFile.exists()) {
                const enrichedCda = await cdaFile.json();
                let directiveCount = 0;

                for (const entry of enrichedCda.entries) {
                    this.db.insertNode({
                        id: entry.id,
                        type: "directive",
                        label: entry.title,
                        content: entry.definition,
                        domain: "persona",
                        layer: "directive",
                        meta: {
                            section: entry.section,
                            tags: entry.explicit_tags,
                        },
                    } as any);
                    directiveCount++;

                    for (const rel of entry.validated_relationships) {
                        const check = LouvainGate.check(this.db.getRawDb(), entry.id, rel.target);
                        if (check.allowed) {
                            this.db.insertEdge(entry.id, rel.target, rel.type);
                        } else {
                            // console.log(`[LouvainGate] ${check.reason}`);
                        }
                    }
                }
                console.log(`📋 Ingested CDA: ${directiveCount} directives.`);
            } else {
                console.warn("⚠️  No enriched CDA found.");
            }
        } catch (e) {
            console.warn("⚠️  CDA ingestion failed:", e);
        }
    }

    private getFilesToProcess(options: IngestorOptions): { path: string, type: string }[] {
        const files: { path: string, type: string }[] = [];
        if (options.file) {
            files.push({ path: String(options.file), type: "document" });
        } else {
            const sources = options.dir
                ? [{ path: String(options.dir), name: "Document" }]
                : settings.paths.sources.experience;
            
            for (const source of sources) {
                const glob = new Glob("**/*.md");
                for (const file of glob.scanSync(source.path)) {
                     files.push({ 
                         path: join(process.cwd(), source.path, file),
                         type: source.name.toLowerCase() // Use name from settings as generic type base
                     });
                }
            }
        }
        return files;
    }

    private async runWeavers() {
        try {
            const { TimelineWeaver } = await import("@src/core/TimelineWeaver");
            TimelineWeaver.weave(this.db);
        } catch (e) {
            console.warn("⚠️ Timeline Weaver failed:", e);
        }

        try {
            const { SemanticWeaver } = await import("@src/core/SemanticWeaver");
            SemanticWeaver.weave(this.db);
        } catch (e) {
            console.warn("⚠️ Semantic Weaver failed:", e);
        }
    }

    private logStats(count: number, chars: number, duration: number, throughput: number, stats: any) {
        console.log(`🏁 Ingestion Complete.`);
        console.log(`   Processed: ${count} files.`);
        console.log(`   Total Load: ${(chars / 1024).toFixed(2)} KB (${chars} chars)`);
        console.log(`   Time Taken: ${duration.toFixed(2)}s`);
        console.log(`   Throughput: ${throughput.toFixed(2)} chars/sec`);
        console.log(`   ----------------------------------------`);
        console.log(`   Database Stats:`);
        console.log(`   - Nodes: ${stats.nodes}`);
        console.log(`   - Vectors: ${stats.vectors}`);
        console.log(`   - Edges: ${stats.edges}`);
        console.log(`   - Semantic Tagged: ${stats.semantic_tokens}`);
        console.log(`   - DB Size: ${(stats.db_size_bytes / 1024 / 1024).toFixed(2)} MB`);
        console.log("   ----------------------------------------");
    }

    // --- Processing Logic ---

    private async processFile(
        fileEntry: { path: string, type: string },
        db: ResonanceDB,
        embedder: Embedder,
        weaver: EdgeWeaver,
        tokenizer: TokenizerService,
    ): Promise<number> {
        const filePath = fileEntry.path;
        const type = fileEntry.type;
        const content = await Bun.file(filePath).text();
        const fmMatch = content.match(/^---\n([\s\S]*?)\n---/);
        const frontmatter = fmMatch && fmMatch[1] ? this.parseFrontmatter(fmMatch[1]) : {};
        let totalBoxChars = 0;

        const boxRegex = /<!-- locus:([a-zA-Z0-9-]+) -->\n([\s\S]*?)(?=<!-- locus:|$)/g;
        let match: RegExpExecArray | null;
        let foundBoxes = false;

        while (true) {
            match = boxRegex.exec(content);
            if (!match) break;
            if (!match[1] || !match[2]) continue;

            foundBoxes = true;
            const locusId = match[1];
            const boxContent = match[2].trim();

            await this.processBox(locusId, boxContent, type, frontmatter, filePath, db, embedder, weaver, tokenizer);
            totalBoxChars += boxContent.length;
        }

        if (!foundBoxes) {
            const filename = filePath.split("/").pop() || "unknown";
            const id = filename.replace(".md", "").toLowerCase().replace(/[^a-z0-9-]/g, "-");

            if (content.length > 10) {
                await this.processBox(id, content, type, frontmatter, filePath, db, embedder, weaver, tokenizer);
                return content.length;
            }
            return 0;
        }
        return totalBoxChars;
    }

    private async processBox(
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
        const tokens = tokenizer.extract(content);
        const currentHash = LocusLedger.hashContent(content);
        const storedHash = db.getNodeHash(id);

        if (storedHash === currentHash) return;

        console.log(`⚡️ [${id}] Ingesting (${content.length} chars)...`);

        // Removed hardcoded narrative allowlist. 
        // Logic: If it's mounted, we process & embed it.
        let embedding: Float32Array | undefined = undefined;
        if (content.length > 50) {
            embedding = await embedder.embed(content) || undefined;
        }

        const node = {
            id: id,
            type: type,
            label: meta.title || sourcePath.split("/").pop(),
            content: content,
            domain: "experience",
            layer: "note",
            embedding: embedding,
            hash: currentHash,
            meta: { ...meta, source: sourcePath, semantic_tokens: tokens },
        };

        db.insertNode(node);
        weaver.weave(id, content);
    }

    private parseFrontmatter(text: string): Record<string, any> {
        const meta: Record<string, any> = {};
        text.split("\n").forEach((line) => {
            const [key, ...vals] = line.split(":");
            if (key && vals.length) {
                meta[key.trim()] = vals.join(":").trim();
            }
        });
        return meta;
    }
}
