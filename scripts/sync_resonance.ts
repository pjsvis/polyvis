import { ResonanceDB } from "../resonance/src/db";
import { Embedder } from "../resonance/src/services/embedder";
import { BentoNormalizer } from "./BentoNormalizer"; // Integrated Normalizer
import { EdgeWeaver } from "./EdgeWeaver";
import { Glob } from "bun";
import { join } from "path";
import { parseArgs } from "util";

// Parse args for fail-fast limit
const { values } = parseArgs({
    args: Bun.argv,
    options: {
        limit: {
            type: 'string',
        },
    },
    strict: true,
    allowPositionals: true,
});

const LIMIT = values.limit ? parseInt(values.limit) : Infinity;

console.log(`🚀 Starting Resonance Sync (Limit: ${LIMIT === Infinity ? "ALL" : LIMIT})`);

async function main() {
// --- 1. Load Settings ---
const settingsRaw = await Bun.file("resonance.settings.json").text();
const settings = JSON.parse(settingsRaw);

// --- 2. Initialize Engine ---
const db = new ResonanceDB(settings.dbPath);
const embedder = Embedder.getInstance();
console.log("🧠 Loading Embedding Model (FastEmbed)...");
// Trigger cache load
await embedder.embed("init"); 

console.log(`📦 Resonance Engine Initialized: ${settings.dbPath}`);

// --- 3a. Pipeline: CDA (Core Directive Array) ---
// Note: We need to capture ALL lexicon items (Lexicon + CDA) into a single array for the Weaver.
const allLexiconItems: any[] = [];

if (settings.ingestion.cda) {
    const cdaPath = settings.ingestion.cda;
    console.log(`📜 Ingesting CDA: ${cdaPath}`);
    const cdaRaw = await Bun.file(cdaPath).text();
    const cda = JSON.parse(cdaRaw);
    
    let cdaCount = 0;
    
    // Flatten nested structure: cda.directives[].entries[]
    if (cda.directives && Array.isArray(cda.directives)) {
        for (const section of cda.directives) {
            if (section.entries && Array.isArray(section.entries)) {
                for (const item of section.entries) {
                     const textToEmbed = String(item.definition || item.title || item.term || item.id || "");
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
                             tags: item.tags || []
                         }
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
if (settings.ingestion.lexicon) {
    const lexiconPath = settings.ingestion.lexicon;
    console.log(`📚 Ingesting Lexicon: ${lexiconPath}`);
    
    const lexiconRaw = await Bun.file(lexiconPath).text();
    const lexicon = JSON.parse(lexiconRaw); // Array of terms
    
    let termCount = 0;
    for (const term of lexicon) {
        
        // Add to Weaver Context
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
                aliases: term.aliases || [],
                tags: term.tags || []
            }
        });

        // Parse Edges from Tags
        extractEdgesFromTags(db, term.id, term.tags || []);
        
        termCount++;
        if (termCount % 100 === 0) process.stdout.write(".");
    }
    console.log(`\n✅ Lexicon Synced: ${termCount} items.`);
}

function extractEdgesFromTags(db: ResonanceDB, sourceId: string, tags: string[]) {
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
const weaver = new EdgeWeaver(db, allLexiconItems);
console.log(`🕸️  Edge Weaver Initialized (${allLexiconItems.length} concepts)`);


// --- 4. Pipeline B: Markdown Docs (Debriefs / Playbooks) ---
for (const dir of settings.ingestion.directories) {
    const pattern = new Glob(`${dir}/**/*.md`);
    let fileCount = 0;
    
    console.log(`📂 Scanning ${dir}...`);
    
    for await (const file of pattern.scan(".")) {
        // ... (Existing Dirty Check Logic) ...
        const rawContent = await Bun.file(file).text();
        const filename = file.split('/').pop() || "";
        
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
        
        // Embed File Level
        const vec = await embedder.embed(content);
        
        const fileNodeId = file; // Path as ID
        
        db.insertNode({
            id: fileNodeId,
            type: dir.includes("playbooks") ? "playbook" : "debrief",
            label: file.split("/").pop(),
            content: content,
            domain: "resonance",
            layer: "experience",
            embedding: vec,
            hash: contentHash
        });

        // --- WEAVE FILE LEVEL ---
        // Some docs might have tags at top level? Unlikely with Bento, but harmless to check.
        weaver.weave(fileNodeId, content);

        // AST Section Chunking (For Playbooks only)
        if (dir.includes("playbooks")) {
             // Simple Regex Splitting for H2 (## )
             const sections = content.split(/^## /gm).slice(1); // Skip preamble
             
             for (const section of sections) {
                 const lines = section.split("\n");
                 const firstLine = lines[0];
                 if (!firstLine) continue;
                 const title = firstLine.trim();
                 const body = lines.slice(1).join("\n").trim();
                 
                 if (body.length < 10) continue; // Skip empty sections
                 
                 const sectionId = `${fileNodeId}#${slugify(title)}`;
                 const sectionVec = await embedder.embed(title + "\n" + body);
                 
                 db.insertNode({
                     id: sectionId,
                     type: "section",
                     label: title,
                     content: body,
                     domain: "resonance",
                     layer: "rule",
                     embedding: sectionVec,
                     meta: { parent: fileNodeId }
                 });
                 
                 // Link File -> Section
                 db.insertEdge(fileNodeId, sectionId, "HAS_CHILD");

                 // --- WEAVE SECTION LEVEL ---
                 weaver.weave(sectionId, body);
             }
        }
        
        fileCount++;
        if (LIMIT && fileCount >= LIMIT) break;
    }
    console.log(`✅ ${dir}: ${fileCount} files processed.`);
}

function slugify(text: string) {
    return text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

db.close();

// Copy to public for frontend
const publicPath = join(process.cwd(), "public", "resonance.db");
console.log(`📋 Publishing to: ${publicPath}`);
await Bun.write(publicPath, await Bun.file(settings.dbPath).arrayBuffer());

console.log("🚀 Unification Sync Complete.");
}

main().catch(console.error);
