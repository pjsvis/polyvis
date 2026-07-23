# Debrief: CSS Island Isolation (@scope + de-globalize base)

**Date:** 2026-07-23
**TD:** td-ab30cf
**Brief:** `briefs/pending/2026-07-23-brief-css-island-isolation.md` (→ archived)
**Branch:** alpine-refactor
**Commits:** 3fba9eb → 6a38224 → 077095c → 7c82e38 → d7106a7 (5 phases, 5 commits)

## Objective

Fence CSS into islands (shell vs markdown/docs vs graph chrome) so bare-element
globals stop fighting content. Prefer `@scope` over `.markdown-body h*` prefix
soup. Tokens live in `theme.css` only. Drop Open Props.

## What happened (phase by phase)

### Phase 0 — Baseline (3fba9eb)
Read-only survey of docs + explorer computed styles. Resolved two blockers
before any code change:
- **Radius tension:** enforced `0px` across markdown content (consistency with
  shell + `theme.css --radius-component:0px`). Recorded for Phase 3.
- **Staged-changes blocker:** committed tidy + docs-newup fixes first so the
  tree was clean before Phase 1.

### Phase 1 — Shell donut (6a38224)
Wrapped bare `h1`/`a`/`button` in `base.css` inside
`@scope (body) to (.markdown-body)` — the "donut" (applies to `body` down to,
but excluding, `.markdown-body`). Zero HTML edits: the donut avoids needing an
`.app-shell` wrapper the docs page doesn't have.
**Behavior changes (all desired):** markdown h2/h3/h5/h6 lose forced uppercase;
h1-h6 lose forced mono (inherit sans from markdown scope); `a:hover` loses harsh
invert. Side benefit: rebuilt `app.css` flushed stale `.ln` selectors.

### Phase 2 — Markdown scope (077095c)
Wrapped `markdown.css` in `@scope (.markdown-body)`. Dropped all `.markdown-body`
prefixes from selectors; root typography uses `:scope` (covers div + article).
**No behavior change** — selectors are equivalent. Specificity dropped from
`(0,1,N)` to `(0,0,N)`, safe because the utilities layer sits above all
competitors and the only within-scope override is `.doc-card > h2:first-child`
(intentional).

### Phase 3 — Drop Open Props (7c82e38)
Removed `@import open-props/style` and the `open-props` package. Mapped 32
compat tokens (30 src-consumed + `shadow-color`/`shadow-strength` transitive)
into `theme.css :root`. `radius-2`/`radius-3` → `0px` (Phase 0 decision);
`radius-round` kept `9999px` for `status-dot` circular indicator. basecoat
verified independent of open-props. **`app.css` shrank ~800 lines.**

### Phase 4 — Docs single typography path (d7106a7)
Docs already had a single path (`app.css` with `@scope`'d `markdown.css`;
`slab-layout.css` is layout-only). Removed dead `prose`/`prose-invert`/`prose-sm`
classes from `public/docs/index.html` (2 spots) and `src/js/components/doc-viewer.js`
(wiki-content template) — no Tailwind Typography plugin installed, so they were
pure noise. Deleted 6 zombie files (DOSP-confirmed): `public/css/markdown.css`,
`public/css/app 2.css`, 3 stale docs HTML backups, 1 sigma backup.

### Phase 5 — Verify + close (this session)
Ran the acceptance criteria checklist against live computed styles.

## Verification (Phase 5)

**`just check`:** green (TypeScript + Biome).

**Docs page (`/docs/`) — computed styles on `.markdown-body` children:**
| Element | font-family | text-transform | font-size | border-radius |
|---------|-------------|----------------|-----------|---------------|
| h1 | JetBrains Mono | uppercase | 32px | 0px |
| h2 | JetBrains Mono | **none** | 24px | 0px |
| p | JetBrains Mono | none | 15px | 0px |
| pre | JetBrains Mono | none | 14px | 0px |

h1 uppercase is the **deliberate** markdown design (markdown.css), not shell
global bleed. h2 not uppercase confirms the shell donut excludes `.markdown-body`.

**Sigma-explorer (`/sigma-explorer/`):**
- `.explorer-graph-panel`: radius 0px, JetBrains Mono, canvas present.
- Graph chrome unaffected — local vars on the panel only, no canvas revert (per brief).

**Console / server log:** no errors, no 404/500. One unrelated Node
`DEP0205` deprecation warning (module.register) — not CSS-related.

**Prefix soup:** `rg "\.markdown-body" src/css/layers/markdown.css` returns only
comments + the single `@scope (.markdown-body)` fence. Zero prefixed selectors
inside the scope.

**Open Props:** not in `package.json`; no `@import` in `src/css/`; only
provenance comments remain in `theme.css`.

## Acceptance criteria — all met

- [x] Shell still Terminal Brutalist (mono, hard borders, zero radius)
- [x] Markdown/docs headings not forced uppercase mono by shell globals (h1 uppercase is markdown.css, not shell)
- [x] `markdown.css` uses `@scope`; prefix soup gone
- [x] Open Props not imported; no undefined token fallout
- [x] Docs: single content typography path (no prose+markdown fight)
- [x] `just check` passes; visual OK on docs + sigma-explorer
- [x] Debrief written; brief archived

## Lessons

1. **The donut beats the wrapper.** `@scope (body) to (.markdown-body)` scopes
   bare shell elements without requiring a structural `.app-shell` wrapper —
   critical because the docs page has no shell. Exclusion boundary > wrapper
   boundary when the page topology varies.

2. **`@scope` survives Tailwind v4's build.** Verified across 4 phases —
   `@scope` blocks pass through the Tailwind v4 `@import`/`@layer` pipeline
   intact and appear in compiled `app.css` with correct semantics.

3. **Specificity drops are safe inside a scope.** Moving from `.markdown-body h2`
   `(0,1,1)` to `h2` inside `@scope` `(0,0,1)` is safe when (a) the scope
   isolates you from external competitors and (b) the only within-scope
   override is intentional. Don't assume specificity is load-bearing — verify
   it.

4. **Open Props removal is mostly mechanical.** 30 tokens were directly
   consumed; 2 transitive (`shadow-color`/`shadow-strength`). Mapping them into
   `theme.css :root` as compat aliases preserved all `var(--token)` references
   without touching consumers. `app.css` shrank ~800 lines.

5. **Zombie defense false positives on shared hosts.** `just dev start` aborts
   on *any* unknown `bun` process — including an unrelated Claude VoiceServer.
   `SKIP_ZOMBIE_CHECK=true just dev start` is the documented bypass when the
   "unknown" is not yours to kill (DOSP). The "unknowns" list is advisory, not
   a kill target — only ghosts and duplicates are killable.

## What's left (out of scope, not debt)

- Full Tailwind removal (explicitly out of scope).
- Redesigning the preserved soft-shadow tokens (open-props defaults kept; noted
  in `theme.css` comments).
- Sigma canvas revert (brief said: local vars on panel only — no revert needed).

## Artifacts

- Debrief: this file.
- Playbook note: `playbooks/css-master-playbook.md` §9 (new — Island Isolation).
- Brief archived: `briefs/archive/2026-07-23-brief-css-island-isolation.md`.
