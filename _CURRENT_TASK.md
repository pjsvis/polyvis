# Current Task: Polyvis Bento Implementation (Bento + Orchestrator)

## Status: IN_PROGRESS
**Start Date:** 2025-12-11

**Objective:**
Implement the "Bento Box" architecture for content chunking and identity persistence, enabling the "Diff-Safe" and "Type-Safe" protocols.

**Upcoming Steps:**
1.  **Configuration:** Create `src/config/constants.ts` (Seaman Constant: 300 tokens).
2.  **Module A (Fracture Logic):** Implement `src/core/FractureLogic.ts` with "Cleaver" regexes (Pivots, Enums).
3.  **Module B (Locus Ledger):** Implement `src/data/LocusLedger.ts` using `bun:sqlite` for idempotency.
4.  **Module A.1 (Masker):** Implement `src/core/MarkdownMasker.ts` to protect code/tables (Safety).
5.  **Module C (Bento Boxer):** Implement `src/core/BentoBoxer.ts` (Recursive Engine + Masker integration).
6.  **Module D (Orchestrator):** Implement `src/index.ts` CLI (`box`, `audit`).
7.  **Module E (Tag Engine):** Scaffold `src/core/TagEngine.ts` (Ollama integration).

**Recent Achievements:**
- ✅ Reviewed Briefs 1-4 (Found Brief 1 empty, proceeding with 2-4).
- ✅ Verified `bun:sqlite` environment compatibility.
