# Current Task: The Unification Sprint (One Brain)

**Status:** COMPLETED
**Goal:** Consolidate "Split Brain" (ctx.db vs resonance.db) into a Single Source of Truth.

**Objectives:**
1.  ✅ **Schema Upgrade:** Support Lexicon (JSON) + Experience (Markdown) in `nodes` table.
2.  ✅ **Pipeline Unification:** Update `sync` to ingest JSON Lexicon.
3.  ✅ **Legacy Kill:** Retire `ctx.db` and legacy scripts.
4.  ✅ **AST Integration:** Implement Structural Chunking (Sections).
5.  ✅ **UI Wiring:** Polyvis Frontend now fully powered by `resonance.db`.

**Reference:**
- [Unification Brief](briefs/brief-unification-sprint.md)
- [Implementation Plan (DONE)](implementation_plan.md)

**Outcome:**
The system now runs on a single unified database (`resonance.db`) containing both the Conceptual Lexicon (Persona) and Experience Data (Resonance). The frontend (Polyvis) has been successfully re-wired to consume this new source of truth.
