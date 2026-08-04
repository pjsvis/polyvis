# brief: Spatial Canvas Arrangement (MonoBox Workspace)

**Created:** 2026-08-03
**TD:** td-bb916c (epic) · P1 td-6fd506 · P2 td-abce57 · P3 td-d231e7
**Status:** pending
**Updated:** 2026-08-04 — added founding decision #3 (scoped reset, ADR-002).

## What

Arrange MonoBox instances on a spatial workspace: a free-form canvas for
active/expanded boxes plus a stash rail of icon-sized (S=0.15) greeked boxes.
Boxes transition between a small set of discrete states, each binding a scale
and a positioning model.

## Why

The MonoBox primitive (td-ad15a5, complete) gives a scalable, reflow-stable
text box with a verified greeked icon state at S=0.15. That state is the
literal *stash appearance* — the primitive already encodes the workspace's end
state. This brief turns the isolated primitive into an arrangable surface: the
foundational layer of a spatial, drag-and-stash document workspace.

## Founding decisions (resolve before Phase 1)

These two forks shape everything downstream. The proposed defaults are in
brackets; confirm or override.

1. **Scale model: discrete states vs free scaling.**
   [DECISION: discrete states.] Scale snaps to a small finite set; `scale`
   becomes an attribute of the current state, not a free field. Simpler state
   machine; matches "define distinct states and cycle between them."
2. **Positioning model: free canvas vs managed layout.**
   [DECISION: hybrid — free canvas + stash rail.] Boxes live on the canvas at
   free `(x, y)`; the rail is a flex column of stashed boxes at S=0.15. "Throw
   to the side" = transition `active → stashed`, which moves the box to the
   rail. Reuses the verified greeked state as the stash appearance.
3. **CSS inheritance: global cascade vs scoped reset.**
   [DECISION: scoped reset on the workspace container (ADR-002).] The spatial
   canvas has different layout *semantics* than the document-flow app the global
   CSS stack (Tailwind preflight `border-box`, basecoat, layers) was built for.
   The Phase-1 prototype hit three inherited-rule friction points in rapid
   succession (button UA sizing, flex-shrink collapsing the monobox's explicit
   height, and non-closing coordinate math — `offsetLeft=80` + offsetParent at
   360 with no transform anywhere, yet `rect.left = -115`). Per-element patching
   is the spiral. The workspace surface declares a layout-membrane boundary:
   nuke the conflicting inherited assumptions (`box-sizing`, flex/grid
   defaults, margins, button UA sizing), then re-establish only what the
   spatial surface needs. `all: initial` is too blunt — but CSS custom
   properties (`--font-mono`, `--bg-canvas`, `--monobox-*`) are not part of
   `all` and survive, so **theme tokens flow in, layout assumptions don't.**
   The reset is a membrane, not a second design system. See
   `decisions/002-workspace-scoped-reset.md`.

## Proposed states (hypothesis — verify via prototype, then formalise)

A box has one state at a time. Scale and positioning model are attributes of
the state.

| state | location | scale | focus | positioning |
|-------|----------|-------|-------|-------------|
| `stashed` | rail | 0.15 | no | rail slot (managed) |
| `active` | canvas | 1.0 | yes | free (x, y) |
| `expanded` | canvas | 2.0 | yes | free (x, y) |

Transitions (candidate): `stashed → active` (unstash onto canvas at last
position), `active → stashed` (throw to rail), `active ↔ expanded` (cycle).
Position is *remembered* per box across stashed→active (canvas memory).

> A formal state diagram is **deferred to after the Phase-1 prototype**. Draw it
> from observed behaviour, not speculation (anti-Compulsive Narrative Syndrome).

## How

Gated phases. Advance only after the prior phase's acceptance criteria pass.

### Phase 1 — Canvas + Rail Prototype (no drag)
Position N boxes on a canvas (absolute, free x/y) and a stash rail (flex
column, S=0.15). Buttons cycle a box through `stashed → active → expanded`.
MonoBox `--cpl/--rows/--scale` drive the box; the workspace layer owns `(x,y)`
and state. No drag yet — buttons only.

### Phase 2 — Drag + Throw
Pointer drag on canvas boxes (update x/y). "Throw to rail" gesture (drag past
a threshold / onto the rail) triggers `active → stashed`. Stash transition
animates scale + position. Verify 60fps during drag (reuse the harness
method).

### Phase 3 — Multi-box State Machine + Debrief
N boxes, independent state, z-order/focus on click. Formalise the state
diagram from observed transitions. Debrief + playbook update.

## Acceptance criteria

- [ ] Phase 1: boxes render on canvas at free (x,y) and on the rail at S=0.15;
  button-driven state cycle works (stashed → active → expanded).
- [ ] Phase 1: stashed boxes render greeked (S=0.15) with constant line count
  (carry-over from MonoBox P1 criterion).
- [ ] Phase 2: pointer drag moves canvas boxes smoothly (60fps, no thrash).
- [ ] Phase 2: throw gesture transitions a box to the rail (active → stashed)
  with animated scale + position.
- [ ] Phase 3: N boxes maintain independent state; click focuses + raises z.
- [ ] Phase 3: state diagram documented in debrief, derived from the prototype.

## Out of scope

- File system loading / Markdown parsing / content ingestion (separate brief).
- Persistence (save/load workspace layout) — future brief.
- Sidebar / window shell / app chrome — future brief.
- Collision detection / auto-arrange / tiling — future brief.
- Multi-select / bulk operations — future brief.
