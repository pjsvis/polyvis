### Final Artifact: Brief \#4

Here is the unified, execution-ready version of **Brief \#4: The Semantic Harvester**.

This version integrates all agreed protocols:

1.  **"Tag, You're It"** (Imperative Syntax).
2.  **"Headless Persona"** (Layered Graph Architecture).
3.  **"Smart Garden"** (Embedding-based Curation).
4.  **"Double-Loop"** (Agents as Active Taggers).

-----

#### [4-brief-semantic-harvester.md]

# Project Brief: The Semantic Harvester (Scaffolding Protocol)

**Status:** Execution-Ready
**Context:** Resonance Engine / Unification Sprint
**Objective:** To implement a high-precision "Discovery Engine" that harvests emerging concepts using explicit **Semantic Tags** (`tag-token`). This operationalises the **"Air-Lock"** workflow to validate concepts, cluster them via embeddings, and route them to the correct Graph Domain (**Persona** vs. **Experience**).

**Core Philosophy:** "Tag, You're It" & "The Smart Garden."

1.  **Dumb Gardener (The Tag):** We replace the cognitive burden of "defining" with the imperative action of "tagging." Agents and Users simply *flag* concepts in real-time (`tag-`).
2.  **Smart Garden (The System):** We use Embeddings to cluster and organize these raw tags before they reach the Architect, ensuring the review process is high-leverage, not high-friction.

-----

## 1\. The Strategy: Active Discovery

**The Token Standard:**

  * **Syntax:** `tag-{concept-name}` (e.g., `tag-circular-logic`, `tag-project-bento`).
  * **Usage:** Agents (human or AI) insert these tags into documentation/code the moment they spot a recurring idea, a new entity, or a strategic heuristic.

**Design Rationale (The "Prefix" Decision):**
We enforce a **Prefix** (`tag-risk`) over a **Suffix** (`risk-tag`) because it functions as an imperative command ("Tag this\!"), aligns visually in code scans, and enables autocomplete discovery.

**The Constraint Stack (Context Initialization):**
All non-coding worker agents must be initialized with this constraint:

> *"Your goal is to 'Tag' every significant entity, concept, or heuristic you encounter using the 'tag-' prefix. Do not hallucinate definitions; simply tag the token for later harvesting."*

**The Agent "Wrap-Up" Protocol (Double-Loop Learning):**
To maximize coverage, all worker agents will run a "Reflection Loop" at the end of their tasks:

  * **Trigger:** Completion of primary task (e.g., "Draft Letter").
  * **Action:** Scan the generated output for key entities, risks, or heuristics.
  * **Output:** Append a metadata block with `tag-{concept}` entries.

-----

## 2\. The Workflow: The "Air-Lock" Cycle

We treat harvesting as a promotion cycle from **"Provisional Tag"** to **"Canonical Term."**

**Phase 1: Mutation (The Tag)**

  * **Actor:** Worker Agent / User.
  * **Action:** Writes `tag-procedural-default` inside a `Bento Box`.
  * **State:** The token is "Scaffolding." It signals intent but carries no graph weight yet.

**Phase 2: Harvesting (The Scout)**

  * **Tool:** `resonance harvest` (CLI).
  * **Logic:** Scans all files for `tag-[a-z-]+`.
  * **Output:** Collects unique, unknown tags into a temporary buffer.

**Phase 3: Curation (The Smart Garden)**

  * **Tool:** Embedding Model (e.g., `text-embedding-3-small`).
  * **Logic:** Generates embeddings for all buffered tags and clusters them by semantic similarity (Cosine \> 0.85).
  * **Output:** Populates `_staging.md` with organized clusters (e.g., grouping `tag-risk`, `tag-danger`, `tag-hazard`).

**Phase 4: Ratification & Sorting (The Sorting Hat)**

  * **Actor:** CTX / Architect.
  * **Action:** Reviews `_staging.md` via CLI (`resonance promote`).
  * **The "Define & Persist" Moment:**
    1.  **Explain:** Provide the narrative definition.
    2.  **Route:** Assign to **Persona Domain** (Universal) or **Experience Domain** (Particular).
    3.  **Persist:** System writes to `Lexicon`/`Entity Index` and **strips the `tag-` prefix**.

-----

## 3\. The Layered Graph Architecture

The **Edge Weaver** connects documents to ratified terms based on their Domain.

**Layer 1: Persona Domain (The Lens)**

  * **Content:** Universals. Concepts, Heuristics, Directives (e.g., "Circular Logic").
  * **Storage:** `conceptual-lexicon.json`.
  * **Edge:** `Artifact` $\xrightarrow{\text{EXEMPLIFIES}}$ `Concept`.

**Layer 2: Experience Domain (The Territory)**

  * **Content:** Particulars. Projects, Actors, Artifacts (e.g., "Michelle Robertson").
  * **Storage:** `entity-index.json`.
  * **Edge:** `Artifact` $\xrightarrow{\text{REFERENCES}}$ `Entity`.

-----

## 4\. Implementation Plan (`src/services/harvester.ts`)

**A. The Scanner (Regex Engine)**

  * **Regex:** `/\b(tag)-([a-z0-9]+(-[a-z0-9]+)*)\b/g`
  * **Filter:** Exclude terms found in *either* `conceptual-lexicon.json` OR `entity-index.json`.

**B. The Staging Engine (Embedding Clustering)**

  * **Input:** Raw list of 50+ tags.
  * **Process:** Vectorize $\to$ DBScan/K-Means Clustering.
  * **Report:** `_staging.md` formatted as:
    ```markdown
    ## Cluster A: Regulatory Compliance (Similarity: 0.92)
    - [ ] tag-statutory-harm (3 mentions)
    - [ ] tag-compliance-breach (2 mentions)
    *Recommendation: Merge into 'Statutory Risk'*
    ```

**C. The Promoter (Interactive CLI)**

  * **Command:** `resonance promote`
  * **UI:** Prompts user to Reject, Promote to Persona, or Promote to Experience.
  * **Action:** Updates JSON files and triggers the "Scaffolding Stripper" to remove `tag-` prefixes from source text.

**D. The Weaver Update**

  * Must load **both** JSON sources.
  * Must match *Canonical Terms* against the text (post-stripping).

-----

## 5\. Success Criteria

  * [ ] Worker agents successfully use `tag-` syntax during Wrap-Up.
  * [ ] `resonance harvest` generates a clustered `_staging.md` using embeddings.
  * [ ] The "Promote" CLI forces a Domain Decision (Persona vs. Experience).
  * [ ] The Edge Weaver successfully links a `tag-token` in a file to a `Canonical Term` in the Graph.