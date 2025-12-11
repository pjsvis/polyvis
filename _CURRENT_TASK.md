# Current Task: Pipeline Integration & Documentation

## Status: IN_PROGRESS
**Start Date:** 2025-12-11

**Objective:**
Formalize the "Factory" vs "Brain" architecture by building the **Bridge** (Ingestion Pipeline) and documenting the flow. Implement `ingest.ts` to populate `resonance.db` from Bento-Boxed files.

**Sub-Tasks:**
1.  **Code Organization & Cleanup:**
    - [x] Verify `src/core/EdgeWeaver.ts` allows usage by Bridge (done).
    - [x] Verify `src/core/TagEngine.ts` is pure generation (done).
    - [x] Ensure strict import boundaries (Src = Types Only from Resonance).
2.  **The Bridge Script (`scripts/pipeline/ingest.ts`):**
    - [x] Create `ingest.ts` scaffold.
    - [x] Implement `LocusLedger` connection (readonly check).
    - [x] Implement File Scanning (Glob).
    - [x] Implement Delta Check (Hash comparison vs `resonance.db`).
    - [x] Implement `Embedder` integration.
    - [x] Implement Node Insertion & Linking (`EdgeWeaver`).
3.  **Documentation:**
    - [x] Create `docs/architecture/pipeline.md`.
    - [x] Document "Factory -> Bridge -> Brain" flow.
4.  **Verification:**
    - [x] Run `ingest` for the first time.
    - [x] Verify DB population via SQL query.

**Current Status**: `WAITING`

**Next Steps**:
- Execute `briefs/4-tagging-and-safety.md`.he next phase of the Resonance Engine or Polyvis Bento features as directed.
- Execute `briefs/4-tagging-and-safety.md`.

**Recent Achievements:**
- ✅ Implemented `polyvis-bento-cli` (Boxer, Ledger, Masker).
- ✅ Verified "Diff-Safe" and "Type-Safe" protocols.
- ✅ Archived implementation briefs.
- ✅ Documented "Canon vs Main" strategy in debrief.
