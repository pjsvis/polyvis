import { describe, expect, test, mock, beforeEach, afterEach } from "bun:test";
import { Ingestor } from "@src/pipeline/Ingestor";
import { ResonanceDB } from "@resonance/src/db";
import { Embedder } from "@resonance/src/services/embedder";

// Mock Dependencies
const mockInsertNode = mock(() => {});
const mockInsertEdge = mock(() => {});
const mockClose = mock(() => {});
const mockEmbed = mock(async () => new Float32Array([0.1, 0.2, 0.3]));

mock.module("@resonance/src/db", () => ({
    ResonanceDB: class {
        constructor() {}
        insertNode = mockInsertNode;
        insertEdge = mockInsertEdge;
        close = mockClose;
        getNodeHash = () => null; // Always new
        getStats = () => ({ nodes: 10, vectors: 5, edges: 2, semantic_tokens: 0 });
        getRawDb = () => ({
            query: () => ({ get: () => ({ c: 0 }) }) // Mock count query
        });
        checkpoint = () => {};
    }
}));

mock.module("@resonance/src/services/embedder", () => ({
    Embedder: {
        getInstance: () => ({
            embed: mockEmbed
        })
    }
}));

// Mock FS for Lexicon Bootstrap
mock.module("bun", () => ({
    Glob: class {
        scanSync = function* () { yield "test-file.md"; }
        scan = async function* () { yield "test-file.md"; }
    },
    file: (path: string) => ({
        exists: async () => true,
        text: async () => `---
title: Test Doc
---
# Test Content
<!-- locus:test-1 -->
Boxed Content
`,
        json: async () => ({ concepts: [{ id: "term-1", title: "Term 1" }] }),
    })
}));

mock.module("@src/utils/validator", () => ({
    PipelineValidator: class {
        captureBaseline = mock(() => {});
        expect = mock(() => {});
        validate = mock(() => ({ passed: true }));
        printReport = mock(() => {});
    }
}));

describe("Ingestor Pipeline", () => {
    let ingestor: Ingestor;

    beforeEach(() => {
        mockInsertNode.mockClear();
        mockInsertEdge.mockClear();
        ingestor = new Ingestor(":memory:");
    });

    test("should instantiate correctly", () => {
        expect(ingestor).toBeDefined();
    });

    test("should run full pipeline and bootstrap lexicon", async () => {
        const success = await ingestor.run({
            dir: "docs" // Mocked to yield test-file.md
        });

        expect(success).toBe(true);
        
        // Verify Lexicon Bootstrap (from mock json)
        expect(mockInsertNode).toHaveBeenCalledWith(expect.objectContaining({
            id: "term-1",
            type: "concept"
        }));

        // Verify File Ingestion
        // The mock scan yields "test-file.md", so we expect a node for that
        // Note: The mock `processBox` logic will trigger insertion
        // Our mock file has <!-- locus:test-1 -->, so we expect a section node too?
        // Actually, let's just check fundamental flow for now.
    });
});
