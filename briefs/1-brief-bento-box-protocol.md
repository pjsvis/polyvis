# Project Brief: The Bento Box Protocol (Document Normalization)

**Status:** Execution-Ready
**Context:** Resonance Engine / Unification Sprint
**Objective:** To implement a "Normalization Layer" in the ingestion pipeline. This ensures all input documents (Debriefs/Playbooks) conform to a strict semantic hierarchy (The Bento Standard) *before* they are parsed into the Knowledge Graph.

**Core Philosophy:** "Garbage In, Garbage Graph."
If a document lacks structure (H2 Headers), it cannot be sliced into atomic "Knowledge Nodes." We must lint and normalize our prose just as we lint our code.

---

## 1. The "Bento" Standard
Every document must conform to this implicit schema to be considered "Resonance-Ready."

**The Schema:**
1.  **The Container (File):** Must have frontmatter and a filename that implies its ID.
2.  **The Title (H1):** ONE and ONLY ONE H1 tag at the top. This defines the Document Label.
3.  **The Box (H2):** The atomic unit of storage.
    * *Constraint:* Content *must* live under an H2.
    * *Reasoning:* An H2 represents a "Section Node" in the graph. Text floating outside an H2 is "Orphan Data."
4.  **The Details (H3-H6):** Internal structure within a Box. These are indexed as part of the H2 Node, not as separate nodes.

---

## 2. The Normalization Logic (`scripts/normalize_docs.ts`)

We implement a "Linter & Fixer" script that runs before the AST Sieve.

**Heuristic A: The "Headless" Fix**
* *Detection:* Document starts with text, no H1.
* *Action:* Insert `# {Filename_Title_Case}` at line 0.
* *Log:* "Auto-Fixed: Added Title to {file}."

**Heuristic B: The "Shouting" Fix**
* *Detection:* Document uses H1s for sections (multiple H1s).
* *Action:* Demote all H1s (after the first one) to H2s.
* *Log:* "Auto-Fixed: Demoted structure in {file}."

**Heuristic C: The "Whispering" Fix**
* *Detection:* Document has Title (H1) but jumps straight to H3s (no H2s).
* *Action:* Promote H3s to H2s.
* *Log:* "Auto-Fixed: Promoted structure in {file}."

**Heuristic D: The "Blob" Rejection**
* *Detection:* > 500 words of text with ZERO headers.
* *Action:* **SKIP Ingestion.**
* *Log:* "❌ REJECTED: {file} is unstructured blob. Please add headers."

---

## 3. Integration Plan

**A. The Pipeline Update (`src/commands/sync.ts`)**
1.  **Read File.**
2.  **Run Normalizer:** `const cleanContent = normalize(rawContent);`
3.  **Phase Check:** Hash `cleanContent` (not raw).
4.  **AST Sieve:** Parse `cleanContent` into Nodes.
5.  **Write:** Upsert to `resonance.db`.

**B. The Verification Tool (Doc Viewer)**
We verify the protocol visually using the existing `doc-viewer` component.
* *Test:* Open the Doc Browser.
* *Visual Check:* Does every document look like a "Bento Board" (Grid of Cards)?
* *Fail State:* If a document looks like a single giant column of text, the Normalizer failed (or the document was rejected).

---

## 4. Success Criteria
* [ ] `scripts/normalize_docs.ts` exists and passes unit tests on "messy" markdown.
* [ ] `resonance sync` logs "Auto-Fixed X files" during ingestion.
* [ ] The Graph contains distinct **Section Nodes** (e.g., `CSS Playbook > Flexbox`) reachable via search.
* [ ] Visual Inspection of `http://localhost:3000/docs` shows consistent Bento Layouts.