# ADR-002: Workspace Surface — Scoped Reset Container

**Date:** 2026-08-04
**Status:** accepted
**Brief:** `briefs/2026-08-03-brief-spatial-canvas-arrangement.md` (Phase 1)
**Task:** td-6fd506 · Epic: td-bb916c

## Context

The Spatial Canvas workspace is a *different kind of surface* from the
document-flow app the global CSS stack (Tailwind preflight `border-box`,
basecoat, the `src/css/layers/` system) was built for. It needs absolute
positioning at free `(x,y)`, a managed rail, and the MonoBox primitive
(ADR-001, which itself mandates `content-box` against the global `border-box`).

The Phase-1 prototype was built by composing `.monobox` instances inside the
existing global cascade. Three friction points appeared in rapid succession,
each fought against *inherited assumptions* rather than the spatial-canvas
concept:

1. **`<button>` UA sizing** won't grow to fit a flex child → swapped to
   `<div role="button">`.
2. **Flex-shrink** collapsed the monobox's explicit `height: calc(...)` to 0
   inside the rail's flex column → needed `flex: none` defensively.
3. **Non-closing coordinate math.** A canvas box reported `offsetLeft=80` with
   its offsetParent at viewport-left 360 and no `transform`/`translate`/
   `margin` anywhere on the ancestor chain, yet
   `getBoundingClientRect().left = -115`. The arithmetic (360 + 80 = 440 ≠
   −115) did not close. A 555px discrepancy with no visible cause is a hidden
   inherited rule — exactly the Derrida-question failure mode.

Per-element patching (`flex: none` here, `<div>` for `<button>` there) **is**
the spiral. The question was asked: *does what we want require so much twisted
CSS that it is a spiral of complexity — should we reset-all on a container and
build up from the inside?*

## Decision

**Scoped reset on the workspace container.** The workspace surface declares a
layout-membrane boundary: nuke the inherited assumptions that conflict with a
spatial surface (`box-sizing`, flex/grid defaults, margins, button UA sizing,
document-flow normalization), then explicitly re-establish only what the
spatial surface needs — `font-family: var(--font-mono)`, the positioning
context, and `content-box` for the MonoBox layer.

**Critical constraint — `all: initial` is too blunt.** It nukes `font-family`,
`color`, `line-height` that the workspace still wants. But CSS custom properties
(`--font-mono`, `--bg-canvas`, `--monobox-*`, the `theme.css` token set) are
**not** part of `all` and survive a reset — which is exactly the right split:
**theme tokens flow in, layout assumptions don't.** The reset is a membrane,
not a parallel CSS world.

## What the reset covers (scoped to `.ws-surface`)

- `box-sizing: content-box` (matches MonoBox's mandate; undoes preflight
  `border-box` for this subtree)
- `margin: 0`, `padding: 0` on the surface and its direct layout children
- explicit `display` / positioning per-element (no inherited flex assumptions)
- isolation from `button` / form UA sizing (rail entries are `div role=button`,
  already the case)
- `font-family: var(--font-mono)` re-established so theme tokens still apply

## What the reset does NOT do

- ❌ Build a second design system inside the reset. Color/font/spacing still
  come from `theme.css` custom properties.
- ❌ Reset the `.monobox` primitive itself — its own rules stand (ADR-001).
- ❌ Touch anything outside `.ws-surface` (page chrome, header, footer stay on
  the global stack).

## Why this is anti-spiral

- The friction pattern (three inherited-rule battles, one non-closing) is the
  signature of fighting a cascade, not building a feature.
- Phase 2 (drag) *requires* coordinate math that closes: `pointer → (x,y)` must
  round-trip exactly. A surface with hidden 555px offsets is unusable for drag.
- The reset turns "diagnose an invisible inherited rule" into "build from a
  clean slate inside a known boundary" — a one-time cost that eliminates a
  class of future bugs.

## Consequences

- The workspace surface is a self-contained layout island; changes to the global
  cascade do not propagate into it (intentional — the surface has different
  semantics than document flow).
- `.monobox` continues to work unchanged: its rules are local and its
  `content-box` mandate aligns with the reset.
- The MonoBox P2 harness page (`/monobox/harness.html`) is unaffected — it lives
  outside `.ws-surface` and keeps using the global stack.
- Future spatial surfaces (a document viewer canvas, etc.) should adopt the same
  scoped-reset pattern rather than reinheriting the document-flow stack.

## Reversibility

If a future need requires inheriting from the global stack inside the workspace
(a shared component, a basecoat utility), the reset is a single CSS block —
remove it and the subtree re-joins the cascade. No structural change.
