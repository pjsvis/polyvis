# brief: CSS island isolation (@scope + de-globalize base)

**Created:** 2026-07-23
**TD:** td-ab30cf
**Status:** pending

## What

Fence CSS into **islands** (shell vs markdown/docs vs graph chrome). Stop
bare-element globals fighting content. Prefer `@scope` (optional
`all: revert-layer` on island roots) over `.markdown-body h*` soup. Tokens
live in `theme.css` only.

## Why

Cascade authors pile up: Tailwind + basecoat + open-props (imported though
deprecated) + Terminal Brutalist globals in `base.css` + markdown
counter-styles + docs `prose` + non-layered `slab-layout.css`. Layers order
files; they do not isolate subtrees. Bleed recurs (sigma isolation debrief,
Dec CSS review). Structural entropy, not missing APIs.

## How

**One phase per session.** `td handoff` → new up → `td context`.

| Ph | Goal | Touch |
|----|------|--------|
| 0 | Baseline docs+explorer; note computed h1/a in markdown | read-only |
| 1 | Bare `h1`/`a`/`button` → shell scope only | `base.css`, shell HTML |
| 2 | `markdown.css` → `@scope (.markdown-body)`; revert-layer iff needed | `markdown.css` |
| 3 | Drop Open Props; map leftover vars → `theme.css` | `main.css`, theme |
| 4 | Docs: one typography path; kill zombie dual CSS | docs HTML, `public/css` |
| 5 | Verify + debrief + css-master playbook note | debrief |

Graph: local vars on `.explorer-graph-panel` only — no canvas revert.

## Acceptance criteria

- [ ] Shell still Terminal Brutalist (mono, hard borders, zero radius)
- [ ] Markdown/docs headings not forced uppercase mono by shell globals
- [ ] `markdown.css` uses `@scope`; prefix soup largely gone
- [ ] Open Props not imported; no undefined token fallout
- [ ] Docs: single content typography path (no prose+markdown fight)
- [ ] `just check` passes; visual OK on docs + sigma-explorer
- [ ] Debrief written; brief archived

## Out of scope

Full Tailwind removal; redesign/palette; Sigma logic; basecoat removal
unless it blocks phase 3; dropping `@layer` (keep; add scope).

## Session protocol (newup)

Phase end: `td log` + `td handoff td-ab30cf` → new up → resume via
`td context td-ab30cf` + this brief (frozen) + **phase N only**.
