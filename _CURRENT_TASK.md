# Current Task: Migrate Bento Logic to Src

## Status: IN_PROGRESS
**Start Date:** 2025-12-11

**Objective:**
Lift and shift the core "Bento Box" and Resonance functionality (Normalizer, Weaver, Harvester) from `scripts/core` to `src/core` (or `src/bento`) to prepare for MCP distribution. Ensure high test coverage.

**Sub-Tasks:**
1.  **Migration (Lift & Shift):**
    - [x] Move `scripts/core/BentoNormalizer.ts` -> `src/core/`
    - [x] Move `scripts/core/EdgeWeaver.ts` -> `src/core/`
    - [x] Move `scripts/core/Harvester.ts` -> `src/core/`
    - [x] Update imports in moved files (use `@src` aliases).
    - [x] Update imports in `scripts/` consumers to point to `@src/core`.
2.  **Test Coverage:**
    - [x] Move `tests/bento_normalizer.test.ts` imports to point to `src`.
    - [x] Move `tests/weaver.test.ts` imports to point to `src`.
    - [x] Move `tests/harvester.test.ts` imports to point to `src`.
    - [x] Verify coverage implies all core logic is tested.
    - [x] Add missing tests if any.
3.  **Verification:**
    - [x] `tsc --noEmit` clean.
    - [x] `bun test` passes.

**Current Status**: `WAITING`

**Next Steps**:
- Begin implementing the next phase of the Resonance Engine or Polyvis Bento features as directed.
- Execute `briefs/4-tagging-and-safety.md`.

**Recent Achievements:**
- ✅ Implemented `polyvis-bento-cli` (Boxer, Ledger, Masker).
- ✅ Verified "Diff-Safe" and "Type-Safe" protocols.
- ✅ Archived implementation briefs.
- ✅ Documented "Canon vs Main" strategy in debrief.
