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

// --- Finalization ---
db.close();
console.log(`✅ SUCCESS: '${dbPath}' created.`);
