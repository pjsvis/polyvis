# brief: Fixed-Aspect Monospace Scale Box (MonoBox)

**Created:** 2026-08-03
**Status:** pending

## What
Build an isolated text-box primitive (`MonoBox`) using monospaced typography where bounding box dimensions strictly track character scale, keeping line lengths, line counts, and aspect ratios invariant during resizing.

## Why
Validates spatial document zooming without layout reflow or line-wrapping shifts, forming the foundational primitive for a spatial, drag-and-stash document workspace.

## How
Execute in gated phases. Advance to the next phase only after validating performance and pixel-stability metrics.

### Phase 1: Core Scalar Primitive (Gated)
Define the base DOM/CSS structure. Mutate scale via custom properties or CSS transform while maintaining a hard `ch` grid.

* **Option A: Container Scale Transform**
  Keep internal text rendering fixed at normal size ($16\text{px}$) and scale the parent wrapper using `transform: scale(S)` with `transform-origin: 0 0`.
* **Option B: Pure Variable Font-Size Scaling**
  Mutate `font-size: calc(16px * var(--scale))` directly, relying on `ch` units for container width and line-height for container height.

```html
<!-- Primitive Structure Example -->
<div class="monobox" style="--cpl: 60; --rows: 10; --scale: 1;">
  <div class="monobox-content">
    MonoBox content here...
  </div>
</div>

<style>
.monobox {
  /* Option B layout pattern */
  width: calc(var(--cpl) * 1ch * var(--scale));
  font-size: calc(16px * var(--scale));
  line-height: 1.2;
  font-family: monospace;
  overflow: hidden;
  white-space: pre-wrap;
  word-break: break-all;
}
</style>

```

### Phase 2: Structural Verification (Gated)

Build a harness to stress-test 3 `MonoBox` instances side-by-side using CSS Grid/Flexbox to test reflow stability, sub-pixel rounding behavior, and 60fps scalar mutations.

### Phase 3: Phase Reflection & Debrief

Review aspect-ratio locking, sub-pixel rendering artifacting at ultra-low scales ($S \le 0.15$), and record findings in a debrief

## Acceptance criteria

* [ ] Bounding box width and height remain strictly proportional to text scale factor ($S$).
* [ ] Line wraps and row counts remain 100% constant across all scale states ($S \in [0.15, 2.0]$).
* [ ] Zero layout thrash / dynamic text recalculation detected during real-time scaling.
* [ ] Sub-pixel text Greeking/rendering remains visual-stable at icon scale ($S = 0.15$).

## Out of scope

* Canvas drag-and-drop mechanics or spatial stash drop zones.
* File system loading/Markdown parsing integration.
* Sidebar or window shell layout logic.


