# Brief: Playbooks Tidy-Up

**Date:** 2026-07-29
**Status:** Proposed
**Locus:** `[Locus: Protocol_Maintenance]`

## Objective

Audit and consolidate `playbooks/` (55 files) to remove stale, superseded, and redundant playbooks. The AGENTS.md charter names ~20 consolidated protocols, but the directory contains 55 files — many reference superseded protocols that have been merged or deprecated.

## Context

The AGENTS.md protocol stratification explicitly consolidated older protocols:

| Consolidated Protocol | Supersedes |
|----------------------|------------|
| CCP (Centralized Control) | TFP (Theme First) + CVP (CSS Variables) |
| VAP (Verification & Alignment) | EVP (Empirical Verification) + RAP (Reality Alignment) |
| BVP (Browser Verification) | CMP (Console Monitoring) + BCP (Browser Capabilities) |
| SWP (Session Wrap-up) | Older wrap-up protocols |
| TTP (Task Tracking) | Older tracking protocols |
| FLIP v2.0 (File Length) | FLIP v1.0 |

Playbooks referencing the pre-consolidation names (TFP, CVP, EVP, RAP, CMP, BCP) are likely stale and should be archived or deleted.

## Key Actions Checklist

- [ ] **Inventory:** List all 55 playbook files with their protocol abbreviations
- [ ] **Cross-reference:** Map each playbook to the AGENTS.md consolidated protocol list
- [ ] **Identify stale:** Flag playbooks that reference superseded protocol names
- [ ] **Identify orphans:** Flag playbooks not referenced by AGENTS.md or any other playbook
- [ ] **Identify duplicates:** Flag playbooks covering the same domain (e.g., multiple CSS playbooks)
- [ ] **Triage decision:** For each flagged playbook, decide: keep / archive / delete / merge
- [ ] **Execute:** Move archived playbooks to `archive/playbooks/`; delete dead ones (with user confirmation per DOSP)
- [ ] **Update `playbooks/README.md`:** Reflect the consolidated state
- [ ] **Verify:** `just check` passes; no broken cross-references in AGENTS.md or other playbooks

## Constraints

- **FNIP:** Do not rename playbooks — only relocate or delete
- **DOSP:** All deletes require explicit user confirmation
- **No new content:** This is a curation pass, not a writing pass. Do not rewrite playbooks during tidy-up.
- **Preserve active references:** Any playbook referenced by AGENTS.md, src/, or scripts/ must be kept

## Success Criteria

- `playbooks/` contains only actively-referenced, non-redundant playbooks
- `playbooks/README.md` index is accurate and complete
- No broken cross-references
- `just check` passes

## Related

- `AGENTS.md` — protocol stratification and consolidation history
- `playbooks/README.md` — playbook index (to be updated)
