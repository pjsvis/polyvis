# Project Brief: The Resonance Engine (v1.0)

**Objective:**
To build a standalone CLI tool (`resonance`) that acts as an "Operational Memory" manager. It ingests markdown artifacts (Debriefs/Playbooks) into a local SQLite Knowledge Graph (`resonance.db`) to enable context-aware coding assistance.

**Constraints:**
* **Single Binary:** Must compile to a standalone executable via `bun build --compile`.
* **Zero Dependency:** The end-user requires no `node_modules` or external runtimes.
* **Local-First:** All data lives in the user's file system (`.resonance/`).
* **Non-Destructive:** Must never overwrite existing user config without confirmation.
* **Batteries Included:** The `init` process should offer to scaffold the standard PolyVis playbooks.

---

## 1. Configuration Architecture (`resonance.settings.json`)

**File Location:** Project Root (`./resonance.settings.json`)

**Schema:**
```json
{
  "project_name": "string",
  "version": "1.0",
  "sources": {
    "playbooks": "./playbooks", // Default path
    "debriefs": "./debriefs",   // Default path
    "protocols": "./AGENTS.md"  // Default path
  },
  "database": {
    "path": "./.resonance/resonance.db"
  },
  "graph": {
    "heuristics": ["OH-", "PHI-", "COG-"],
    "link_pattern": "\\[\\[([^\\]]+)\\]\\]"
  }
}
````

## 2\. The `resonance` CLI Commands

#### **A. `init` (Bootstrap)**

  * **Action:** Scaffolds the environment.
  * **Logic:**
    1.  Check/Create `resonance.settings.json`.
    2.  Check/Create `.resonance/` directory.
    3.  **Content Injection:** Prompt user to inject standard PolyVis Playbooks.
    4.  **Protocol Patch:** Output the `RCP` text for `AGENTS.md`.

#### **B. `sync` (Ingestion)**

  * **Action:** The core ETL pipeline.
  * **Logic:**
    1.  Read config.
    2.  Parse Markdown (Frontmatter + Regex Edges).
    3.  Upsert to `resonance.db`.

#### **C. `audit` (Reporting)**

  * **Action:** Checks graph health.
  * **Logic:** Identify "Open Loops" (Debriefs with no Playbook updates).

#### **D. `serve` (Visualization)**

  * **Action:** Visualization.
  * **Logic:** Start `Bun.serve` with embedded assets.

-----

## 3\. Implementation Plan

  - [ ] **Config Engine:** Create `src/config.ts` (Zod validation).
  - [ ] **Scaffolding:** Create `src/commands/init.ts` (Asset writing).
  - [ ] **Ingestion:** Port `build_experience.ts` to `src/commands/sync.ts`.
  - [ ] **Binary Build:** Add `build:binary` script.




### 2. The Task Tracker
**File:** `_CURRENT_TASK.md`


## Context
We are moving from "Scripts in a Repo" to "Product in a Binary".
**Reference:** `briefs/brief-resonance-engine.md`

