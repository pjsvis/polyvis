
# Scripts Documentation

This directory contains the operational scripts for the Polyvis Resonance Engine and Bento Box Protocol.

## Ingestion Pipeline

### `sync_resonance.ts`
**The Master Ingestion Script.**
- **Purpose:** Synchronizes the file system (Markdown Docs, JSON Lexicons) with the `resonance.db` Knowledge Graph.
- **Workflow:**
    1.  **Load Settings:** Reads `resonance.settings.json`.
    2.  **Initialize Engine:** Connects to SQLite and FastEmbed.
    3.  **Pipeline A (Persona):** Ingests CDA (Core Directives) and Conceptual Lexicon (JSON) into the `Lexicon` layer.
    4.  **Pipeline B (Experience):** Ingests Briefs, Debriefs, and Playbooks.
        - **Normalization:** Runs `BentoNormalizer` to enforce hierarchy.
        - **Chunking:** Splits documents into AST Sections (H2/H3).
        - **Weaving:** Runs `EdgeWeaver` to create semantic edges from tags.

### `EdgeWeaver.ts`
**The Linkage Engine.**
- **Purpose:** Scans content for semantic signals and creates graph edges.
- **Logic:**
    - `tag-[concept-slug]` -> Creates `EXEMPLIFIES` edge to the Concept Node.
    - `[[WikiLink]]` -> Creates `CITES` edge (Experimental).

### `BentoNormalizer.ts`
**The Document Standardizer.**
- **Purpose:** Enforces the "Bento Standard" (Single H1, H2/H3 hierarchy).
- **Functions:**
    - `fixHeadless`: Adds H1 from filename if missing.
    - `fixShouting`: Demotes multiple H1s.
    - `flattenDeepNesting`: Converts H4+ to bold text.

### `normalize_docs.ts`
**The Fixer Utility.**
- **Purpose:** A CLI tool to run the `BentoNormalizer` on disk files, permanently applying fixes.
- **Usage:** `bun scripts/normalize_docs.ts --limit 100 --target briefs/`

## Utilities

### `extract_terms.ts`
Extracts term definitions from markdown files (Legacy/Helper).

### `verify_graph_integrity.ts`
Checks the database for orphans, disconnected loops, or schema violations.

