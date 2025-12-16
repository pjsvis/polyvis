# Current Task: Resonance Engine Migration

**Objective:** Consolidate core Resonance Engine logic from `scripts/` to `src/resonance/` to enable portability.

## Status: In Progress (Iterative Migration)

## Checklist
- [x] **Setup:** Clean slate established, READMEs audited.
- [x] **Phase 1:** `ingest.ts` and `daemon.ts` moved/merged.
- [ ] **Phase 2.1:** Move `transform_cda.ts` -> `src/resonance/transform/cda.ts` [/]
- [ ] **Phase 2.2:** Move `extract_terms.ts` -> `src/resonance/pipeline/extract.ts`
- [ ] **Phase 2.3:** Move `migrate_db.ts` -> `src/resonance/cli/migrate.ts`
- [ ] **Phase 2.4:** Move `transform_docs.ts` -> `src/resonance/pipeline/transform_docs.ts`
- [ ] **Validation:** Verify successful build (`tsc`) after each step.

## Next
- Move `scripts/transform/transform_cda.ts` and fix imports.
