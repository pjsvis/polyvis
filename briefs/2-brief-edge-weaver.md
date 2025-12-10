# Project Brief: The Edge Weaver Protocol

**Status:** Execution-Ready
**Context:** Resonance Engine / Unification Sprint
**Objective:** To implement a deterministic "Linkage Layer" in `resonance.db`. This transforms the graph from a collection of isolated file nodes into a navigable knowledge network by systematically generating edges based on AST structure and Semantic Anchors.

**Core Philosophy:** "The Warp and The Weft."
* **The Warp (Structure):** Hard, undeniable hierarchical links (Parent/Child).
* **The Weft (Association):** Soft, lateral links based on citations and shared concepts.

---

## 1. The Warp: Structural Edges (Vertical)
These edges define the "Backbone" of the graph. They are derived strictly from the AST and File System.

**Logic:**
1.  **Containment:** `File Node` $\to$ `CONTAINS` $\to$ `Section Node`.
    * *Source:* The File ID (e.g., `css-playbook.md`).
    * *Target:* The Section ID (e.g., `css-playbook#flexbox`).
    * *Trigger:* Successful parsing of an H2 header during Ingestion.
2.  **Origin:** `Debrief Node` $\to$ `GENERATED_BY` $\to$ `Project Node`.
    * *Source:* `debriefs/2025-12-09.md`.
    * *Target:* `000-GENESIS` or specific Project ID (from Frontmatter).

## 2. The Weft: Associative Edges (Lateral)
These edges create the "Web" of meaning. They are derived from content scanning.

**Logic:**
1.  **The WikiLink (Explicit Citation):**
    * *Scan:* Regex `\[\[(.*?)\]\]`.
    * *Action:* Find target node with matching `label` or `id`.
    * *Edge:* `Source` $\to$ `CITES` $\to$ `Target`.
    * *Constraint:* If target doesn't exist, log "Broken Link" warning (Audit).
2.  **The Term Anchor (Implicit Citation):**
    * *Pre-Req:* Load all `type: term` nodes from `resonance.db` into a Trie or Set.
    * *Scan:* Check if `Section Node` content contains the exact string of a Term (e.g., "FAFCAS").
    * *Edge:* `Section` $\to$ `MENTIONS` $\to$ `Term`.
    * *Constraint:* Limit to 1 edge per term per section to avoid noise.

---

## 3. Implementation Plan (`src/commands/sync.ts`)

We extend the `sync` pipeline with a dedicated **Weaving Phase**.

**Phase 1: Node Ingestion (The Warp)**
* (Existing) Read Files $\to$ Create File Nodes.
* (New) Parse AST $\to$ Create Section Nodes.
* (New) Insert `CONTAINS` edges immediately.

**Phase 2: Edge Weaving (The Weft)**
* *After* all nodes are inserted (to ensure targets exist):
    1.  **Load Constraints:** Fetch all `terms` and `file_ids` into memory.
    2.  **Iterate:** Loop through every `Section Node`.
    3.  **Scan:** Run the WikiLink and Term Matchers on the content.
    4.  **Insert:** Bulk insert created edges into `edges` table.

## 4. The "Louvain Test" (Verification)
We verify success not by counting edges, but by inspecting **Clusters**.

* **Success Indicator:** A "CSS Cluster" should form naturally.
    * *Center:* Term `CSS`.
    * *Orbit:* `css-playbook.md`, `debrief-css-refactor.md`, `Section: Flexbox`.
    * *Why:* They all explicitly cite or mention "CSS".
* **Failure Indicator:** A giant "Everything Cluster" (Over-linking) or zero clusters (Under-linking).

---

## 5. Next Steps
* [ ] Implement `src/services/edge-weaver.ts`.
* [ ] Update `sync` command to call Weaver after Ingestion.
* [ ] Run `resonance sync` and check Sigma Explorer.