import { Database } from "bun:sqlite";
import { join } from "path";

// --- Type Definitions for our JSON data ---
// This provides type safety to prevent errors like accessing a non-existent key.

interface LexiconEntry {
  id: string;
  title: string;
  description: string | object; // Description can be a string or a structured object
  type: string;
  tags?: string[];
  external_refs?: { label: string; url: string; type: string }[];
}

interface Directive {
  id?: string;
  term?: string;
  title?: string;
  definition?: string | object;
  tags?: string[];
}

interface DirectiveSection {
  section: string;
  entries: Directive[];
}

interface CdaData {
  directives: DirectiveSection[];
}

// --- Path Resolution ---
// import.meta.dir provides the absolute path to the directory containing the current script.
// This makes the script runnable from any location.
const scriptDir = import.meta.dir;
const dbPath = join(scriptDir, "ctx.db");
const clPath = join(scriptDir, "conceptual-lexicon-ref-v1.79.json");
const cdaPath = join(scriptDir, "cda-ref-v63.json");

console.log(`Database will be created at: ${dbPath}`);

// --- Database Initialization ---
// Bun's built-in SQLite driver is fast and easy to use.
const db = new Database(dbPath);

// Create schema if it doesn't exist.
db.exec(`
  CREATE TABLE IF NOT EXISTS nodes (
    id TEXT PRIMARY KEY,
    label TEXT,
    type TEXT,
    definition TEXT,
    external_refs TEXT
  );
  CREATE TABLE IF NOT EXISTS edges (
    source TEXT,
    target TEXT,
    relation TEXT,
    FOREIGN KEY (source) REFERENCES nodes(id),
    FOREIGN KEY (target) REFERENCES nodes(id)
  );
`);

// --- Data Processing ---

// Use prepared statements for performance and security.
const insertNode = db.prepare(
  "INSERT OR REPLACE INTO nodes (id, label, type, definition, external_refs) VALUES (?, ?, ?, ?, ?)"
);
const insertEdge = db.prepare(
  "INSERT OR IGNORE INTO edges (source, target, relation) VALUES (?, ?, ?)"
);

// Helper to parse tags like "[Implements:COG-5]"
function parseAndInsertEdges(nodeId: string, tags: string[] = []): void {
  for (const tag of tags) {
    const match = tag.match(/\[(.*?):(.*?)\]/);
    if (match && match[1] && match[2]) {
      const relation = match[1].trim();
      const target = match[2].trim();
      insertEdge.run(nodeId, target, relation);
    }
  }
}

// 1. Ingest Lexicon (CL)
try {
  const clFile = Bun.file(clPath);
  const clData: LexiconEntry[] = await clFile.json();
  console.log(`Loading ${clData.length} Lexicon entries...`);

  for (const entry of clData) {
    // Ensure description is a string
    let definition =
      typeof entry.description === "object"
        ? JSON.stringify(entry.description)
        : entry.description;

    const externalRefs = entry.external_refs
      ? JSON.stringify(entry.external_refs)
      : "[]";

    // Inject extra internal references for testing (User Request)
    if (entry.id === "OH-036") {
      definition += " See also OH-037 for value integration.";
    } else if (entry.id === "OH-037") {
      definition += " This builds upon OH-036.";
    } else if (entry.id === "term-015") {
      definition += " Closely related to the 50-First-Dates Scenario (term-015) and OPM-1.";
    }

    // Exclude disconnected/distorting nodes (User Request)
    const excludedIds = new Set(["term-035", "CIP-3", "term-040", "term-027", "term-025", "term-026", "term-024"]);
    if (excludedIds.has(entry.id)) continue;

    insertNode.run(entry.id, entry.title, entry.type, definition, externalRefs);
    parseAndInsertEdges(entry.id, entry.tags);
  }
} catch (error) {
  console.error(`Error processing Conceptual Lexicon: ${error}`);
}

// 2. Ingest Core Directives (CDA)
try {
  const cdaFile = Bun.file(cdaPath);
  const cdaData: CdaData = await cdaFile.json();
  let directiveCount = 0;

  for (const section of cdaData.directives) {
    for (const entry of section.entries) {
      if (entry.id) {
        const term = entry.title || entry.term || entry.id;
        // Ensure definition is a string
        const defn =
          typeof entry.definition === "object"
            ? JSON.stringify(entry.definition)
            : entry.definition || "";

        // Exclude disconnected/distorting nodes (User Request)
        const excludedIds = new Set(["term-035", "CIP-3", "term-040", "term-027", "term-025", "term-026", "term-024"]);
        if (excludedIds.has(entry.id)) continue;

        insertNode.run(entry.id, term, "Directive", defn, "[]");
        parseAndInsertEdges(entry.id, entry.tags);
        directiveCount++;
      }
    }
  }
  console.log(`Loading ${directiveCount} Directives...`);
} catch (error) {
  console.error(`Error processing Core Directives: ${error}`);
}

// 3. Generate Semantic Edges (Keyword Matching)
console.log("Generating Semantic Edges...");
try {
  // Fetch all nodes to use as both sources and targets
  const nodes = db.query("SELECT id, label, definition FROM nodes").all() as {
    id: string;
    label: string;
    definition: string;
  }[];

  let semanticEdgeCount = 0;

  const insertSemanticEdge = db.prepare(
    "INSERT OR IGNORE INTO edges (source, target, relation) VALUES (?, ?, 'semantic')"
  );

  // Stop words to ignore (common English words + generic project terms)
  const stopWords = new Set([
    "the", "and", "that", "this", "with", "from", "into", "for", "are", "not",
    "which", "what", "how", "why", "who", "when", "where", "can", "may", "will",
    "has", "have", "had", "but", "all", "any", "one", "two", "use", "used",
    "using", "user", "system", "data", "code", "node", "edge", "graph", "polyvis",
    "context", "concept", "term", "define", "definition", "example", "principle",
    "heuristic", "directive", "type", "value", "layer", "level", "core", "base"
  ]);

  for (const source of nodes) {
    if (!source.definition) continue;

    for (const target of nodes) {
      if (source.id === target.id) continue;
      if (!target.label) continue;

      // 1. Try Exact Match first (High Confidence)
      const escapedLabel = target.label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const exactRegex = new RegExp(`\\b${escapedLabel}\\b`, 'i');

      if (exactRegex.test(source.definition)) {
        insertSemanticEdge.run(source.id, target.id);
        semanticEdgeCount++;
        continue; // Found a match, move to next target
      }

      // 2. Try Keyword Match (Lower Confidence, High Density)
      // Split label into words, filter stop words and short words
      const keywords = target.label.split(/[\s-]+/)
        .map(w => w.toLowerCase().replace(/[^a-z0-9]/g, '')) // Clean punctuation
        .filter(w => w.length > 3 && !stopWords.has(w));

      if (keywords.length === 0) continue;

      // Check if ANY significant keyword is present
      let matchFound = false;
      for (const keyword of keywords) {
        const keywordRegex = new RegExp(`\\b${keyword}\\b`, 'i');
        if (keywordRegex.test(source.definition)) {
          matchFound = true;
          break;
        }
      }

      if (matchFound) {
        insertSemanticEdge.run(source.id, target.id);
        semanticEdgeCount++;
      }
    }
  }
  console.log(`Generated ${semanticEdgeCount} Semantic Edges.`);

} catch (error) {
  console.error(`Error generating semantic edges: ${error}`);
}

// --- Finalization ---
db.close();
console.log(`✅ SUCCESS: '${dbPath}' created.`);

// Copy to public/data for frontend access
const publicDataDir = join(scriptDir, "..", "public", "data");
const publicDbPath = join(publicDataDir, "ctx.db");

try {
  if (!require("fs").existsSync(publicDataDir)) {
    require("fs").mkdirSync(publicDataDir, { recursive: true });
  }
  Bun.write(publicDbPath, Bun.file(dbPath));
  console.log(`✅ COPIED: '${dbPath}' -> '${publicDbPath}'`);
} catch (e) {
  console.error(`❌ Failed to copy DB to public/data: ${e}`);
}
