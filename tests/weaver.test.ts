import { describe, expect, test, mock } from "bun:test";
import { EdgeWeaver } from "../scripts/EdgeWeaver";
import { ResonanceDB } from "../resonance/src/db";

// Mock ResonanceDB
class MockDB {
    public edges: any[] = [];
    insertEdge(sourceId: string, targetId: string, type: string) {
        this.edges.push({ sourceId, targetId, type });
    }
}

describe("EdgeWeaver", () => {
    // Mock Lexicon: "Circular Logic" -> "term-circular-logic"
    const lexiconItems = [
        { id: "term-circular-logic", title: "Circular Logic", aliases: ["Loops"] },
        { id: "term-michelle", title: "Michelle Robertson", aliases: [] }
    ];

    test("Weave 'tag-circular-logic' (Match by Slug)", () => {
        const db = new MockDB() as unknown as ResonanceDB;
        const weaver = new EdgeWeaver(db, lexiconItems);
        
        const content = "This is a letter about tag-circular-logic and its effects.";
        const sourceId = "file-1#section-1";
        
        weaver.weave(sourceId, content);
        
        expect(db.edges).toHaveLength(1);
        expect(db.edges[0]).toEqual({
            sourceId: "file-1#section-1",
            targetId: "term-circular-logic",
            type: "EXEMPLIFIES"
        });
    });
    
    test("Weave 'tag-loops' (Match by Alias)", () => {
        const db = new MockDB() as unknown as ResonanceDB;
        const weaver = new EdgeWeaver(db, lexiconItems);
        
        const content = "Avoid tag-loops in your thinking.";
        const sourceId = "file-1#section-2";
        
        weaver.weave(sourceId, content);
        
        expect(db.edges).toHaveLength(1);
        expect(db.edges[0]).toEqual({
            sourceId: "file-1#section-2",
            targetId: "term-circular-logic", // Mapped to canonical ID
            type: "EXEMPLIFIES"
        });
    });

    test("Weave '[[Circular Logic]]' (WikiLink to Concept)", () => {
        const db = new MockDB() as unknown as ResonanceDB;
        const weaver = new EdgeWeaver(db, lexiconItems);
        
        const content = "See also [[Circular Logic]].";
        const sourceId = "file-1#section-3";
        
        weaver.weave(sourceId, content);
        
        expect(db.edges).toHaveLength(1);
        expect(db.edges[0]).toEqual({
            sourceId: "file-1#section-3",
            targetId: "term-circular-logic",
            type: "CITES" // WikiLinks are Citations
        });
    });
    
     test("Mixed Tags and Links", () => {
        const db = new MockDB() as unknown as ResonanceDB;
        const weaver = new EdgeWeaver(db, lexiconItems);
        
        // "Michelle Robertson" -> slug "michelle-robertson"
        const content = "A tag-michelle-robertson post regarding [[Circular Logic]].";
        const sourceId = "file-1#section-4";
        
        weaver.weave(sourceId, content);
        
        expect(db.edges).toHaveLength(2);
        // Order isn't guaranteed by matchAll but usually sequential
        expect(db.edges).toContainEqual({
            sourceId: "file-1#section-4",
            targetId: "term-michelle",
            type: "EXEMPLIFIES"
        });
        expect(db.edges).toContainEqual({
            sourceId: "file-1#section-4",
            targetId: "term-circular-logic",
            type: "CITES"
        });
    });
});
