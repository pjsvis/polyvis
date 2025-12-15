# Project Brief: Polyvis Ingestion & Refinement ("The Cycle")

**Context:** Polyvis (Sovereign Knowledge Artifact)
**Objective:** Create a "Living Documentation" system where source text is ingested into a queryable graph, and the system actively contributes back to the source text via transparent annotations.
**Status:** Ready for Implementation

## 1. The Core Philosophy
**"Docs are Code."**
We treat the knowledge base as a software project.
* **Storage:** The filesystem (Markdown) is the Source of Truth.
* **Database:** SQLite is the Compiled Artifact (Query Engine).
* **Gardening:** Automated refinement is handled via **Git Branches & Pull Requests**, ensuring human auditability of every machine-generated link.

## 2. The "Monolith" Storage Architecture
We use a single portable file (`polyvis.sqlite`) that provides four distinct views of the same data.



### The Schema
* **`chunks` (The Semantic Core):** Stores UUIDs, Vectors (Blob), and Metadata. Optimized for "Concept Retrieval."
* **`chunks_fts` (The Search Engine):** A Virtual Table using FTS5 for full-text search, BM25 ranking, and snippets.
* **`edges` (The Graph Topology):** Stores explicit (`MENTIONS`) and inferred (`RELATED_TO`) connections.

## 3. The Ingestion Pipeline ("The Sieve")
*Run Command:* `bun run ingest`

The ingestion script performs a **Three-Pass Parse** on every Markdown file:

1.  **Pass A: Frontmatter (Identity):**
    * Extracts `type`, `project`, `status`.
    * Creates explicit Categorical Edges (e.g., `IS_A` -> `Debrief`).
2.  **Pass B: Inline Syntax (Structure):**
    * Parses **WikiLinks** (`[[Target]]`) using a custom `marked` tokenizer.
    * Creates `MENTIONS` edges (Weight: 1.0) in the DB.
3.  **Pass C: Vector & Index (Content):**
    * Generates Embedding (via Daemon).
    * Inserts into `chunks` (Vector) and `chunks_fts` (Text).

## 4. The Refinement Protocol ("The Gardener")
*Run Command:* `bun run refine`

This is the **Write-Back Loop**. It converts "Hidden Insights" into "Explicit Annotations" using a standard code review workflow.



### Step A: The Analysis (Multi-Angle Inspection)
The script queries the populated database to find missing links using **Triangulation**:
* **Angle 1 (Vector):** High cosine similarity (> 0.90) between unconnected nodes.
* **Angle 2 (Community):** Nodes belong to the same Louvain Community (Structural Neighborhood).
* **Angle 3 (FTS):** Node A contains the specific title of Node B but doesn't link to it.

### Step B: The Write-Back (Annotation)
If a high-confidence link is found, the script **modifies the source Markdown file**. It appends a structured HTML comment block (invisible to the reader, visible to the editor/parser).

**The Format:**
```markdown
```

### Step C: The Audit (Git Workflow)
1.  **Branch:** User creates `git checkout -b garden/auto-link`.
2.  **Run:** User runs `bun run refine`.
3.  **Diff:** User runs `git diff` to see the machine's suggestions.
4.  **Merge:**
    * *Accept:* User commits the changes. The annotations become part of the file's metadata.
    * *Reject:* User reverts the specific file changes.
    * *Promote:* User manually moves the link from the "Comment" into the main text body (turning it into a Hard Link).

## 5. Implementation Checklist

### Phase 1: Foundation
- [ ] **Schema:** Create `chunks`, `chunks_fts`, and `edges` tables.
- [ ] **Daemon:** Ensure Vector Service is responsive.

### Phase 2: The Sieve (Ingest)
- [ ] **Parser:** Implement `marked` extension for `[[WikiLinks]]`.
- [ ] **Writer:** Implement Dual-Write logic (SQL + FTS).

### Phase 3: The Gardener (Refine)
- [ ] **Analyzer:** Write logic to find "Shadow Links" (Vector+Community).
- [ ] **Annotator:** Write logic to append `` blocks to files.
- [ ] **CLI:** Wrap it in a clean `bun run refine` command.

***

