
import { Database } from "bun:sqlite";
import { Glob } from "bun";
import { join } from "path";
import { parseArgs } from "util";
import { ResonanceDB } from "@resonance/src/db";
import { Embedder } from "@resonance/src/services/embedder";
import { EdgeWeaver } from "@src/core/EdgeWeaver";
import { LocusLedger } from "@src/data/LocusLedger";
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
        },
        strict: false
    });

    const dbPath = join(process.cwd(), settings.paths.database.resonance);
    const db = new ResonanceDB(dbPath);
    const embedder = Embedder.getInstance();
    
    // 0. Bootstrap Lexicon (for Weaver)
    let lexicon: LexiconItem[] = [];
    try {
        const legacyPath = settings.paths.sources.legacy[0]; 
        if (legacyPath) {
             const file = Bun.file(legacyPath);
             if (await file.exists()) {
                 const data = await file.json();
                 lexicon = (data.concepts as any[]).map((c: any) => ({
                     id: c.id,
                     title: c.title,
                     aliases: c.aliases || []
                 }));
                 console.log(`📚 Bootstrapped Lexicon: ${lexicon.length} concepts.`);
             }
        }
    } catch (e) {
        console.warn("⚠️  Lexicon bootstrap failed (skipping):", e);
    }
    
    const weaver = new EdgeWeaver(db, lexicon);

    // 1. Determine Sources
    let filesToProcess: string[] = [];
    
    if (values.file) {
        filesToProcess.push(String(values.file));
    } else {
        const sourceDirs = values.dir ? [String(values.dir)] : settings.paths.sources.docs;
        for (const dir of sourceDirs) {
            const glob = new Glob("**/*.md");
            for await (const file of glob.scan(dir)) {
                filesToProcess.push(join(process.cwd(), dir, file));
            }
        }
    }
    
    // Process
    let processedCount = 0;
    for (const filePath of filesToProcess) {
        await processFile(filePath, db, embedder, weaver);
        processedCount++;
    }

    // Cleanup
    db.close();
    console.log(`🏁 Ingestion Complete.`);
    console.log(`   Processed: ${processedCount} files.`);
}

async function processFile(filePath: string, db: ResonanceDB, embedder: Embedder, weaver: EdgeWeaver) {
    const content = await Bun.file(filePath).text();
    
    // 1. Parse File Level Metadata (Frontmatter)
    // Simple regex for frontmatter
    const fmMatch = content.match(/^---\n([\s\S]*?)\n---/);
    const frontmatter = (fmMatch && fmMatch[1]) ? parseFrontmatter(fmMatch[1]) : {};
    
    // Default Type based on folder/path?
    // e.g. "playbooks/..." -> "playbook"
    let type = "document";
    if (filePath.includes("playbook")) type = "playbook";
    if (filePath.includes("debrief")) type = "debrief";

    // 2. Parse Boxes (by Locus Tag)
    // Regex to split by `<!-- locus:UUID -->`
    // Captures the ID and the following content until next tag or EOF
    const boxRegex = /<!-- locus:([a-zA-Z0-9-]+) -->\n([\s\S]*?)(?=<!-- locus:|$)/g;
    
    // If the file is NOT boxed (no locus tags), treat whole file as one node?
    // Or skip? The brief says "Input: Bento-Boxed Files".
    // If we run on unboxed files, we might treat them as legacy or single nodes.
    // Let's support Locus Tags primarily.
    
    let match;
    let foundBoxes = false;
    
    while ((match = boxRegex.exec(content)) !== null) {
        // Strict null check: Ensure match groups exist
        if (!match[1] || !match[2]) continue;

        foundBoxes = true;
        const locusId = match[1];
        const boxContent = match[2].trim();
        
        await processBox(locusId, boxContent, type, frontmatter, filePath, db, embedder, weaver);
    }
    
    if (!foundBoxes) {
        // Fallback: Treat entire file as one node (Legacy/Unboxed)
        // Mint a deterministic ID based on filename if needed? 
        // Or just skip. Let's warn.
        // console.warn(`⚠️  No Boxes found in ${filePath} (Skipping). Run 'box' command first?`);
    }
}

async function processBox(
    id: string, 
    content: string, 
    type: string, 
    meta: any, 
    sourcePath: string,
    db: ResonanceDB, 
    embedder: Embedder, 
    weaver: EdgeWeaver
) {
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
        meta: { ...meta, source: sourcePath }
    };
    
    db.insertNode(node);

    // 4. Weave Edges
    weaver.weave(id, content);
}

function parseFrontmatter(text: string): Record<string, any> {
    const meta: Record<string, any> = {};
    text.split("\n").forEach(line => {
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
