# Playbook: Polyvis Standards & Conventions `[PB-001]`

**Version:** 1.0
**Status:** Active
**Context:** This document defines the laws of physics for the Polyvis Knowledge Graph. All ingestion scripts, agents, and human authors must adhere to these standards.

-----

## 1\. The Storage Schema (The Monolith)

The system relies on a single SQLite file (`polyvis.sqlite`) containing a specific table structure.

### 1.1 Core Tables

| Table | Purpose | Key Columns |
| :--- | :--- | :--- |
| **`chunks`** | The Source of Truth (Vector + Metadata). | `id` (PK), `content`, `embedding` (BLOB), `metadata` (JSON) |
| **`chunks_fts`** | The Search Engine (Text Index). | `id` (UNINDEXED), `title`, `content` |
| **`edges`** | The Graph Topology. | `source`, `target`, `type` (`MENTIONS`|`RELATED`), `weight` (REAL) |

### 1.2 Edge Types

  * **`MENTIONS` (Weight 1.0):** Explicit Hard Link. Created via Markdown `[[WikiLink]]`.
  * **`IS_A` (Weight 1.0):** Categorical Link. Created via Frontmatter `type:`.
  * **`RELATED_TO` (Weight 0.5 - 0.9):** Inferred Soft Link. Created via Vector/Community analysis.

-----

## 2\. Polyvis Flavored Markdown (PFM)

Source documents must be standard Markdown with specific extensions for Graph Injection.

### 2.1 Frontmatter (The Header)

Every file **must** start with a YAML block.

```yaml
---
id: "pb-standards-001"        # Optional. If missing, System generates Hash(content).
type: "Playbook"              # REQUIRED. Defines Node Color/Shape.
project: "Polyvis"            # Defines the macro-cluster.
status: "Active"              # Draft | Active | Deprecated
tags: ["Architecture", "DB"]  # Generic grouping.
---
```

**Standard Types:**

  * `Playbook` (Methodology/Rules)
  * `Debrief` (Retrospective/Learning)
  * `Concept` (Definition/Entity)
  * `Brief` (Architecture/Plan)

### 2.2 Inline Syntax (The Wires)

  * **WikiLinks:** Use double brackets to forge a Hard Link to another node.
      * *Syntax:* `[[Target Node Name]]`
      * *Example:* "This adheres to the [[SieveNet Protocol]]."

-----

## 3\. The Refinement Protocol (The Loop)

We use a **Write-Back** strategy where the machine annotates the source text.

### 3.1 The "Garden Branch" Workflow

1.  **Branch:** Create `garden/refine-01`.
2.  **Execute:** Run `bun run refine`.
3.  **Review:** Run `git diff`.
4.  **Merge:** Commit to `main`.

### 3.2 Annotation Standard

The system will append suggestions using this specific HTML Comment format. **Do not remove this block** unless you are promoting the links to the main text.

```html
```

-----

## 4\. Ingestion Constraints

  * **File Format:** `.md` only.
  * **Encoding:** UTF-8.
  * **Vector Model:** `BAAI/bge-small-en-v1.5` (384 dimensions). *Changing this requires a full database wipe and re-ingest.*
  * **Chunking Strategy:** 1 File = 1 Chunk. (Atomic Knowledge).


## 5. CSS & Theming (Atomic Design)

We follow a "Zero Magic" Pure Bun + Tailwind CLI approach.

### 5.1 The "No Shadow" Rule
**NEVER** commit static CSS files to `public/css/` that shadow source files.
*   **Source:** `src/css/main.css`
*   **Build Target:** `public/css/app.css` (Gitignored)
*   **Reason:** Static files override the local dev server, leading to "Zombie Code" where source changes are ignored.

### 5.2 Theme Protocol
We support `light` and `dark` modes, defaulting to the OS preference.

1.  **Strict Color Scheme:** All HTML files MUST include this meta tag to prevent FOUC (Flash of Unstyled Content):
    ```html
    <meta name="color-scheme" content="light dark">
    ```
2.  **No Opacity Magic:** Do not use `body { opacity: 0 }`. It creates JS dependency for basic visibility.
3.  **Variable Scope:**
    *   `src/css/layers/theme.css`: Defines tokens (`--primary`, `--surface-1`).
    *   `src/css/layers/components.css`: Consumes tokens.
    *   **Semantic Tokens:** Use abstract names (`--surface-hover`) over raw colors (`--gray-200`) for interaction states.

