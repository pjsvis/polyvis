# Top-Level Folder Review

**Date:** 2026-07-23
**Status:** Analysis (proposals for human approval)

## Current state: 27 top-level directories

```
_misc/        backups/     briefs/      conductor/   context/     debriefs/
decisions/    docs/        drizzle/     examples/    images/      inferences/
ingest/       knowledge/   local_cache/ plans/       playbooks/   prompts/
public/       reports/     schemas/     scratchpads/ scripts/     src/
substack/     tasks/       tests/
```

## Classification

### Tier 1 — Core (keep at root, no changes)

| Dir | Tracked | Purpose |
|-----|---------|---------|
| `src/` | 83 | Application source code (the product) |
| `public/` | 142 | Web root — served HTML, built CSS/JS, SQLite DB |
| `scripts/` | 119 | CLI tools, maintenance scripts, build pipeline |
| `tests/` | 18 | Test suite |
| `docs/` | 59 | Human-readable documentation |

These are the working spine. No changes needed.

### Tier 2 — Edinburgh Protocol knowledge system (keep at root)

| Dir | Tracked | Purpose |
|-----|---------|---------|
| `playbooks/` | 54 | Operational protocols (the *how*) |
| `briefs/` | 109 | Feature specs (the *what/why*) |
| `debriefs/` | 120 | Retrospectives (the *what happened*) |
| `decisions/` | 0 | ADRs (the *why behind choices*) — empty, ready for use |

These are the four-directory knowledge system from the `repo-setup-retrofit-playbook`. Correctly placed at root. `decisions/` is empty but that's expected — it's created when the work demands it (MVAS principle).

### Tier 3 — Infrastructure / config (keep at root, small)

| Dir | Tracked | Purpose |
|-----|---------|---------|
| `drizzle/` | 3 | Drizzle ORM config + migrations |
| `schemas/` | 3 | JSON schema definitions |
| `images/` | 6 | Static images for docs/README |
| `ingest/` | 9 | Python ingestion pipeline (KG harvester, classifier) |

Small, purposeful, correctly placed. `ingest/` is 1GB but mostly `.venv/` (gitignored).

---

## Proposals

### Proposal A: Consolidate near-empty single-file directories

**The problem:** Five directories contain exactly one file each. That's
a directory-to-file ratio that signals entropy — the directory is
ceremony, not structure.

| Dir | Tracked | Single file | Last touched |
|-----|---------|-------------|-------------|
| `knowledge/` | 1 | `excalibur.md` | Dec 2025 |
| `plans/` | 1 | `experience-graph-integration.md` | Dec 2025 |
| `tasks/` | 1 | `ui-investigation.md` | Dec 2025 |
| `prompts/` | 1 | `gemini-king-mode-prompt.md` | Dec 2025 |
| `inferences/` | 0 | *(empty)* | Dec 2025 |

**Proposal:** Move all five into `_misc/archive/` (or `docs/archive/`).
They are stale one-off documents from Dec 2025, not active working
directories. The `prompts/` directory has a playbook now
(`playbooks/prompts-playbook.md`) that describes a `prompts/` directory
— but the actual directory has one unrelated file. Either populate
`prompts/` with real system prompts/eval fixtures, or archive the
single file and let the playbook describe the *intended* structure.

**Risk:** Low. These files are historical. The `prompts-playbook.md`
references a `prompts/` directory that would need recreating if prompts
are ever authored here — but that's a future decision, not a current
state.

### Proposal B: Consolidate `scratchpads/` into `debriefs/` or `_misc/`

**The problem:** `scratchpads/` has 55 tracked files — but most are
**copies of debriefs** (`scratchpads/debriefs/` contains duplicated
debrief content). The rest are old debugging scratchpads from Dec 2025.

**Proposal:** Move the debugging scratchpads to `_misc/scratchpads/`
and delete `scratchpads/debriefs/` (duplicates of tracked debriefs).
Or move the whole directory to `_misc/scratchpads/` if scratchpads
aren't actively used.

**Risk:** Low-medium. Verify no script references `scratchpads/`
before moving.

### Proposal C: Consolidate `context/` into `docs/` or `_misc/`

**The problem:** `context/` has 5 files from Nov–Dec 2025 — memory
blocks, critiques, a template. It's a stale "agent context" directory
from an older workflow that predates the Edinburgh Protocol system.

**Proposal:** Move to `_misc/context/` or `docs/archive/`.

### Proposal D: Consolidate `conductor/` into `docs/`

**The problem:** `conductor/` has 11 files — product guidelines, tech
stack, workflow, code styleguides. It's project documentation that
belongs in `docs/`, not a standalone top-level directory.

**Proposal:** Move `conductor/` contents into `docs/conductor/` or
split relevant files into existing `docs/` structure.

**Risk:** Low. Check for references to `conductor/` paths in scripts.

### Proposal E: Consolidate `reports/` into `docs/` or `_misc/`

**The problem:** `reports/` has 11 files — hybrid audit JSON, ingestion
stats, baseline analysis. All from Dec 2025. These are historical
analysis outputs, not an ongoing reporting system.

**Proposal:** Move to `_misc/reports/` or `docs/reports/`.

### Proposal F: Consolidate `examples/` and `substack/`

**The problem:** `examples/` (12 files, Dec 2025) and `substack/`
(2 files, Dec 2025) are small, stale directories.

**Proposal:**
- `examples/` → `docs/examples/` (if still useful) or `_misc/`
- `substack/` → `_misc/substack/` (two playbook files from Dec 2025)

### Proposal G: Gitignore `backups/`

**The problem:** `backups/` (15MB, untracked) contains a 6MB SQLite DB
backup. It's not gitignored (only `backups/db/` is). This is local
scratch that should be gitignored entirely.

**Proposal:** Add `backups/` to `.gitignore`.

### Proposal H: Consolidate `_misc/` as the single archive sink

**The problem:** `_misc/` already holds 30 tracked files including the
archived SCOREBOARD. But it's named `_misc/` which is vague.

**Proposal:** Rename to `_archive/` (clearer purpose) and make it the
single destination for all consolidated historical material from
Proposals A–F. Keep `_misc/SCOREBOARD.md` and `_misc/blog-draft-*` as
active blog-post raw material.

---

## Summary table

| Dir | Tracked | Verdict | Action |
|-----|---------|---------|--------|
| `src/` | 83 | **Keep** | Core |
| `public/` | 142 | **Keep** | Core |
| `scripts/` | 119 | **Keep** | Core |
| `tests/` | 18 | **Keep** | Core |
| `docs/` | 59 | **Keep** | Core |
| `playbooks/` | 54 | **Keep** | Edinburgh system |
| `briefs/` | 109 | **Keep** | Edinburgh system |
| `debriefs/` | 120 | **Keep** | Edinburgh system |
| `decisions/` | 0 | **Keep** | Edinburgh system (empty, ready) |
| `drizzle/` | 3 | **Keep** | Config |
| `schemas/` | 3 | **Keep** | Config |
| `images/` | 6 | **Keep** | Static assets |
| `ingest/` | 9 | **Keep** | Python pipeline (1GB, mostly .venv) |
| `_misc/` | 30 | **Rename → `_archive/`** | Consolidation target |
| `backups/` | 0 | **Gitignore** | Local scratch |
| `local_cache/` | 0 | **Keep** (gitignored) | Model weights |
| `scratchpads/` | 55 | **Consolidate** | → `_archive/scratchpads/` |
| `context/` | 5 | **Consolidate** | → `_archive/context/` |
| `conductor/` | 11 | **Consolidate** | → `docs/conductor/` |
| `reports/` | 11 | **Consolidate** | → `_archive/reports/` |
| `examples/` | 12 | **Consolidate** | → `docs/examples/` or `_archive/` |
| `substack/` | 2 | **Consolidate** | → `_archive/substack/` |
| `knowledge/` | 1 | **Consolidate** | → `_archive/` |
| `plans/` | 1 | **Consolidate** | → `_archive/` |
| `tasks/` | 1 | **Consolidate** | → `_archive/` |
| `prompts/` | 1 | **Consolidate** | → `_archive/` (repopulate if prompts are authored) |
| `inferences/` | 0 | **Remove** | Empty |

**Result:** 27 → ~16 top-level directories (13 core + `_archive/` + 2
gitignored infrastructure). The 11 consolidated directories move into
`_archive/` or `docs/` subdirectories, reducing root clutter without
losing any tracked content.

## What needs human decision

1. **`_misc/` → `_archive/` rename?** The name is clearer but it's a
   path change that affects the SCOREBOARD blog-post brief.
2. **`conductor/` → `docs/conductor/`?** Or keep as a top-level
   "product guidelines" directory? It's the only one with an argument
   for staying (it's project-specific product/tech-stack docs, not
   generic docs).
3. **`prompts/` — repopulate or archive?** The playbook describes a
   `prompts/` directory structure. If you plan to author system prompts
   or eval fixtures here, keep it. If not, archive the single file.
4. **`ingest/` — keep at root or move to `scripts/ingest/`?** It's a
   Python pipeline in a Bun/TS project. Could be `scripts/ingest/` for
   consistency, but it has its own `.venv/` and requirements.txt — it's
   a self-contained subproject.
