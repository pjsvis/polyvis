# ADR-001: MonoBox Scale Mutation Strategy — Variable Font-Size (Option B)

**Date:** 2026-08-03
**Status:** accepted
**Brief:** `briefs/2026-08-02-brief-fixed-aspect-monobox.md` (Phase 1)
**Task:** td-93b3ab · Epic: td-ad15a5

## Context

MonoBox is the foundational primitive for a spatial, drag-and-stash document
workspace: a monospaced text box whose bounding box (`width × height`) and line
wrapping stay strictly proportional to a character-scale factor `S ∈ [0.15, 2.0]`
(extended from the original `[0.15, 1.0]` on 2026-08-03 per Phase-1 review —
`S=1.0` is native render size, not a ceiling; the range is now symmetric in
spirit: shrink toward icon below, enlarge for emphasis above),
with no layout reflow. Phase 1 requires picking ONE of two scale-mutation paths
and implementing the DOM/CSS primitive.

The two candidate paths:

- **Option A — Container Scale Transform.** Text renders fixed at 16px; the
  wrapper is scaled with `transform: scale(S)`, origin `0 0`.
- **Option B — Variable Font-Size Scaling.** `font-size: calc(16px * S)`; width
  in `ch`; unitless `line-height`.

Phase 1's acceptance criteria pull in *opposite* directions: "container width
tracks `cpl · 1ch · scale`" favours B (layout-native geometry); "zero layout
thrash / text recalculation" favours A (compositor-only). A choice had to be
made and rationalised.

## Decision

**Option B — Variable Font-Size Scaling.**

Geometry — no hardcoded box pixels; `S` enters through `font-size` alone:

```css
.monobox {
  --cpl: 60; --rows: 10; --scale: 1;
  font-size: calc(var(--monobox-font-size) * var(--scale)); /* 16px · S */
  line-height: var(--monobox-line-height);                  /* 1.2, unitless */
  width:  calc(var(--cpl) * 1ch);                           /* cpl · ch(16·S) */
  height: calc(var(--rows) * var(--monobox-line-height) * 1em); /* rows · 1.2 · 16 · S */
  white-space: pre-wrap; word-break: break-all; overflow: hidden;
}
```

Because `1ch` and `1em` are relative to `font-size`, both `width` and `height`
are proportional to `S` by construction — `cpl` and row count never change.

## Alternatives considered

- **Option A — Container Scale Transform.**
  - *Pros:* zero reflow (compositor-only); text never re-rasterised; strongest
    raw 60fps; crisp glyph scaling.
  - *Cons:* `transform: scale()` is paint-only, so the DOM layout box stays
    native-sized → the Phase-1 width criterion ("tracks `cpl·1ch·scale`") becomes
    false unless a second, *untransformed* compensating wrapper re-derives the
    same width formula (i.e. re-inventing B's rule to paper over A's nature).
    Deferred to a future camera-zoom layer, where it belongs.

## Rationale

1. **Criterion truth.** Option B satisfies "width tracks `cpl·1ch·scale`"
   *literally and by layout*. Option A satisfies it only by reinterpretation.
2. **Phase 2 fits the model.** The verification harness (`td-87a031`) places 3
   boxes side-by-side in Grid/Flexbox — a flow context. Option A's unscaled
   flow footprint overlaps/gaps there; Option B participates correctly.
3. **"Thrash" is overstated.** Option B's reflow is *local and containable*
   (`contain: layout style`; absolutely-positioned on the future canvas),
   scoped to one box — not document-wide. Modern browsers hold 60fps for that;
   Phase 2 exists to *measure* it, not assume it.
4. **Camera zoom is orthogonal.** Option A's compositor advantage serves a
   whole-canvas camera zoom — a `transform` on a container — independent of
   per-document MonoBox scaling. It does not decide the primitive.

## Consequences

**Easier**

- Exact geometry by construction; spatial positioning/collision can trust the
  box's real dimensions.
- Phase 2 Grid/Flex harness works without compensation scaffolding.
- Per-instance state lives in CSS custom properties (`--cpl`/`--rows`/`--scale`);
  no JS layout math required.

**Harder / risks**

- Continuous real-time scaling changes `font-size` → local reflow per frame.
  Phase 2's 60fps gate is the real test.
- `box-sizing`: Tailwind preflight sets `border-box` globally, which would
  shrink the content box under any border and break the exact `cpl` fit.
  Mitigation: `.monobox` is `box-sizing: content-box` (documented in the CSS)
  and uses `outline` for any visual frame — outline does not affect layout.

**Deferred escape hatch (for Phase 2):** if 60fps fails under continuous
scaling, adopt *transform during active drag, commit `font-size` at rest*.
Additive; does not change the primitive's identity; therefore this decision
remains reversible without an ADR-002.
