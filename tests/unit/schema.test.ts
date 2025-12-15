import { describe, expect, test, beforeEach, afterEach } from "bun:test";
import { ResonanceDB } from "@src/resonance/db";
import { CURRENT_SCHEMA_VERSION } from "@src/resonance/schema";
import { Database } from "bun:sqlite";

describe("ResonanceDB Schema & Migration", () => {
    let db: ResonanceDB;

    // Use a temp file instead of :memory: because ResonanceDB might need a real path for some utils 
    // or if we want to persist between closures? No, cleanup is fine.
    // Actually :memory: is fastest for unit tests.
    const DB_PATH = ":memory:"; 

    beforeEach(() => {
        db = new ResonanceDB(DB_PATH);
    });

    afterEach(() => {
        db.close();
    });

    test("Initializes with correct schema version", () => {
        const raw = db.getRawDb();
        const ver = raw.query("PRAGMA user_version").get() as any;
        expect(ver.user_version).toBe(CURRENT_SCHEMA_VERSION);
    });

    test("Tables exist", () => {
        const raw = db.getRawDb();
        const tables = raw.query("SELECT name FROM sqlite_master WHERE type='table'").all() as any[];
        const names = tables.map(t => t.name);
        expect(names).toContain("nodes");
        expect(names).toContain("edges");
        expect(names).toContain("nodes_fts"); // FTS virtual table might show up differently? usually yes.
    });

    test("Can insert and retrieve nodes via typed accessor", () => {
        db.insertNode({
            id: "test-node",
            type: "note",
            label: "Test Label",
            content: "Test Content",
            domain: "test",
            layer: "note",
            meta: { key: "value" }
        });

        const nodes = db.getNodes("test");
        expect(nodes.length).toBe(1);
        expect(nodes[0]!.id).toBe("test-node");
        expect(nodes[0]!.label).toBe("Test Label");
        expect(nodes[0]!.meta.key).toBe("value");
    });

    test("Lexicon accessor works", () => {
        db.insertNode({
            id: "term-1",
            type: "concept",
            label: "Term One",
            content: "Definition",
            domain: "lexicon", 
            meta: { aliases: ["t1"] }
        });

        const lexicon = db.getLexicon();
        expect(lexicon.length).toBe(1);
        expect(lexicon[0]!.id).toBe("term-1");
        expect(lexicon[0]!.aliases).toContain("t1");
    });
    
    test("Full Text Search works", () => {
         db.insertNode({
            id: "doc-1",
            type: "document",
            content: "The quick brown fox jumps over the lazy dog",
            domain: "search-test"
        });
        
        // FTS updates via trigger, might happen immediately in WAL mode?
        // Usually yes.
        const results = db.searchText("fox");
        expect(results.length).toBeGreaterThan(0);
        expect(results[0]!.id).toBe("doc-1");
    });
});
