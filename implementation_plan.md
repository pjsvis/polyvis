# Implementation Plan: The Unification Sprint (DONE)

**Goal:** Consolidate "Split Brain" (ctx.db vs resonance.db) into a Single Source of Truth (`resonance.db`).

## User Review Required
> [!IMPORTANT]
> This sprint involves **DESTRUCTIVE** actions: `scripts/build_db.ts` and `ctx.db` will be permanently retired. Ensure you have backups if needed (though `conceptual-lexicon.json` is the source of truth).

## Proposed Changes

### 1. Database Schema Upgrade
**Target:** `resonance/src/db.ts`
- **Modify `nodes` table:**
    - Add `meta` column (JSON) for tags/aliases (needed for Terms).
    - Ensure `domain` column distinguishes `persona` (Terms) vs `resonance` (Debriefs).
    - Ensure `type` column supports `term`, `debrief`, `playbook`, `heuristic`.

### 2. Unified Ingestion Pipeline
**Target:** `scripts/sync_resonance.ts`
- **Load `resonance.settings.json`:**
    - Read `lexicon` path (e.g., `scripts/conceptual-lexicon-ref-v1.79.json`).
- **Pipeline A (Lexicon / JSON):**
    - Iterate through Lexicon items.
    - Generate Embeddings for each Term.
    - Insert as `domain: 'persona'`, `type: 'term'`.
    - Populates `meta` with `aliases`.
- **Pipeline B (Markdown - Enhanced):**
    - **AST Chunking:** Instead of 1 Node per File, parse `playbooks/` sections (H2).
    - Create Child Nodes: `id: playbook-file#section-slug`.
    - Link `File -> HAS_CHILD -> Section`.
- **Pipeline C (Edges):**
    - Link `Debrief -> CITES -> Term` (using regex/AST analysis of `[[Term]]` or "Term Name").

### 3. Verification & Cleanup
- **Script:** `scripts/verify_unification.ts`
    - Check count of Terms vs Docs.
    - Verify Vector Search returns mixed results (Terms + Docs).
- **Legacy Kill:**
    - Delete `ctx.db` (file).
    - Delete `scripts/build_data.ts` (if confirmed redundant).

## Verification Plan

### Automated Tests
```bash
# 1. Run the Unified Sync
bun run scripts/sync_resonance.ts

# 2. Verify Integirty
bun run scripts/verify_unification.ts

# 3. Test Vector Search (Mixed Domain)
bun run scripts/debug_search.ts "simplicity"
# Expect:
# - OH-041 (Heuristic)
# - Playbook Section (Markdown)
```
