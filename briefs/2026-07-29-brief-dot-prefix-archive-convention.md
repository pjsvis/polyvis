# Brief: Dot-Prefix Archive Convention

**Date:** 2026-07-29
**Status:** Complete
**Locus:** `[Locus: Process_Standard]`

## Objective

Codify the `.archive/` dot-prefix convention as a project process standard.

## Context

During the tidy-up pass (2026-07-29), we consolidated all historical material into a root `archive/` folder. Renaming it to `.archive/` provided three benefits:

1. **Visual declutter** — `ls` doesn't show it; the root reads as a working project
2. **Git tracking preserved** — unlike gitignoring, `.archive/` stays versioned
3. **Tool sidebar cleanup** — markdown previewers like Glow that hide dot-folders no longer show archived material in the sidebar, keeping the active set honest

The third benefit was emergent, not planned. It should be explicit.

## Convention

**Archived material goes to `.archive/`, never to a visible folder.**

- Visible folders are live: `briefs/`, `debriefs/`, `playbooks/`, `docs/`
- Hidden folders are history: `.archive/briefs/`, `.archive/debriefs/`, `.archive/_misc/`, `.archive/images/`
- The dot-prefix is the Unix convention for "infrastructure, not content" — same semantic as `.git/`, `.env`, `.venv/`
- `ls -a` shows it; that's the archaeologist's tool

## Rule

When moving material to archive:
1. Target is always `.archive/<category>/`
2. Never create a visible `archive/` folder
3. Update all references in live files to use `.archive/` paths

## Success Criteria

- [x] `.archive/` is the single canonical archive location
- [x] No visible `archive/` folder exists at root
- [x] All references in live files point to `.archive/`
- [x] Glow (and similar tools) sidebar shows only active material
