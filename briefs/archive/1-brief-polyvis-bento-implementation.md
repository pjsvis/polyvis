# Implementation Brief: Polyvis Bento-Boxing Tool

**Target:** `polyvis-bento-cli` | **Stack:** Bun, TypeScript, SQLite | **Version:** 0.1.0

## 1\. Project Overview

**Objective:** Develop a Command Line Interface (CLI) tool using the Bun runtime to transform unstructured Markdown documents (from the `canon` branch) into "Seaman-sized", structurally factored, and uniquely tagged units (into the `main` branch).

**Core Constraint:** The process must be **idempotent** and **non-destructive** to semantic content.

## 2\. Technical Requirements

  * **Runtime:** Bun (Latest Stable).
  * **Language:** TypeScript (Strict Mode).
  * **Database:** `bun:sqlite` (Native).
  * **External Libs (Minimal):** `yargs` or `commander` (for CLI parsing), `simple-git` (optional, if direct git manipulation is required later, otherwise file-system based).

## 3\. Project Structure

```text
/src
  /config
    - constants.ts        // SEAMAN_CONSTANTS, DB_PATHS
  /core
    - FractureLogic.ts    // The Regex definitions (The Cleaver)
    - BentoBoxer.ts       // Recursive splitting logic
  /data
    - LocusLedger.ts      // SQLite persistence layer
  /utils
    - FileSystem.ts       // Read/Write & Diff logic
  - index.ts              // Entry point
```

## 4\. Module Specifications

### Module A: The Fracture Logic (`FractureLogic.ts`)

  * **Responsibility:** Export strict Regex patterns and scoring constants.
  * **Task:** Implement the `const` definitions agreed upon in the architecture (Pivots, Enumerations, Digressions).
  * **Requirement:** Ensure Regex patterns are optimized for V8 (Bun) and include unit tests for false positives.

### Module B: The Locus Ledger (`LocusLedger.ts`)

  * **Responsibility:** Manage the SQLite state to ensure stable IDs across runs.
  * **Schema:**
    ```sql
    CREATE TABLE IF NOT EXISTS bento_map (
      canon_hash TEXT PRIMARY KEY,  -- MD5/SHA of original text block
      locus_id TEXT NOT NULL,       -- The UUID or Hash ID assigned
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
    ```
  * **Methods:** `getOrMintId(contentHash: string): string`

### Module C: The Bento Boxer (`BentoBoxer.ts`)

  * **Responsibility:** The core recursive engine.
  * **Logic:**
    1.  Accept input text.
    2.  Token Count Check (using simple whitespace/punctuation split).
    3.  If `> MAX_SIZE` -\> Call `FractureLogic` to find split index.
    4.  Split -\> Recurse on Left and Right parts.
    5.  Base Case -\> Wrap in Markdown structure with `LocusLedger` ID.

### Module D: The Orchestrator (`index.ts`)

  * **Responsibility:** CLI Command handling.
  * **Commands:**
      * `box <file>`: Process a specific file.
      * `audit <file>`: Run the diff check to prove integrity.
  * **Output:** Write processed file to `stdout` or specified `--output` path.

## 5\. Implementation Steps (The Happy Path)

### Phase 1: Scaffold & Database

1.  Initialize Bun project: `bun init`.
2.  Install types: `bun add -d @types/bun`.
3.  Implement `LocusLedger.ts` and verify SQLite connection.

### Phase 2: Logic Core

4.  Implement `FractureLogic.ts` with test cases (create a `tests/` folder).
5.  Implement `BentoBoxer.ts` using the recursive strategy.
6.  *Checkpoint:* Verify that a large text block splits correctly at a "However," or "First,".

### Phase 3: IO & CLI

7.  Implement file reading/writing.
8.  Wire up the CLI entry point.
9.  Run on a sample `canon` document.

### Phase 4: Validation

10. Implement the "Strip & Diff" logic.
11. Prove `Diff(Strip(Output), Input) === 0`.

## 6\. Definition of Done

  * The tool runs via `bun run box target.md`.
  * It produces a Markdown file where no section exceeds 300 tokens.
  * All created sections have invisible Locus Tags.
  * The SQLite database successfully maps content hashes to IDs.
  * The diff check passes.

-----

**Status:** Ready for execution.
**Query:** Shall I generate the initial scaffolding code for **Module B (Locus Ledger)** and **Module C (Bento Boxer)** to kickstart the development?