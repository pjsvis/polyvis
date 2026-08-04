# Debrief: Spatial Canvas — Phase 1 (Canvas + Rail Prototype)

**Date:** 2026-08-04
**Epic:** td-bb916c
**Task:** td-6fd506 (P1)
**Brief:** `briefs/2026-08-03-brief-spatial-canvas-arrangement.md` (Phase 1)
**Decision:** `decisions/002-workspace-scoped-reset.md` (ADR-002)

## What was built

A self-contained workspace prototype at `/workspace/` that arranges N MonoBox
instances on a free-form canvas plus a stash rail of greeked S=0.15 icons.
Button-driven state cycle: `stashed → active → expanded → stashed`. The
workspace layer owns `(x,y)` and state; MonoBox `--cpl/--rows/--scale` drive
each box. No drag yet (Phase 2).

**Files:**
- `public/workspace/index.html` — the prototype (page-local Alpine
  `workspaceApp` via `alpine:init`, inline chrome, scoped-reset CSS).
- `decisions/002-workspace-scoped-reset.md` — ADR-002 (the scoped reset).
- `briefs/2026-08-03-brief-spatial-canvas-arrangement.md` — founding decision #3 added.

## The Derrida question + ADR-002

Mid-prototype, three CSS friction points appeared in rapid succession, each
fought against *inherited assumptions* rather than the spatial-canvas concept:

1. `<button>` UA sizing won't grow to fit a flex child → swapped to
   `<div role="button">`.
2. Flex-shrink collapsed the monobox's explicit `height: calc(...)` to 0 →
   needed `flex: none`.
3. **Non-closing coordinate math:** `offsetLeft=80`, offsetParent at
   viewport-left 360, no `transform`/`translate`/`margin` anywhere on the
   ancestor chain, yet `getBoundingClientRect().left = -115`. A 555px
   discrepancy with no visible cause.

The user asked the Derrida question: *does what we want require so much twisted
CSS that it is a spiral — should we reset-all on a container and build up from
the inside?* Answer: **yes.** Per-element patching is the spiral; the scoped
reset is the exit.

**ADR-002:** a scoped reset membrane on `.ws-surface`:
- `box-sizing: content-box` on the subtree (matches MonoBox ADR-001; undoes
  preflight `border-box`).
- `margin: 0` on the subtree; explicit `display`/positioning per-element.
- `font-family: var(--font-mono)` re-established (theme tokens survive since
  custom properties are not part of `all`).
- Canvas boxes changed from `display: flex; flex-direction: column` to plain
  `display: block` — removes the flex-column shrink-to-fit width ambiguity
  that produced the non-closing math.

**Result:** the coordinate math now closes exactly.
`cfLeft(360) + offsetLeft(80) + border(2) = rectLeft(442)`. The hidden 555px
offset is gone.

## Empirical verification record

All measurements via `agent-browser` (headless CDP Chromium) against the dev
server (`localhost:3000/workspace/`).

### Coordinate math (the ADR-002 gate)

| box | cfLeft | offsetLeft | computed left | rect.left | closes? |
|-----|--------|------------|---------------|-----------|---------|
| DOC-01 (active, S=1) | 360 | 80 | 80px | 442 | ✅ (360+80+2border) |
| DOC-02 (expanded, S=2) | 360 | 420 | 420px | 782 | ✅ (360+420+2border) |

### State cycle round-trip (DOC-01)

| step | state | scale | rect.left | rect.top | note |
|------|-------|-------|-----------|----------|------|
| baseline | active | 1 | 442 | 168 | — |
| cycle 1 | expanded | 2 | 442 | 168 | scale×2, position held |
| cycle 2 | stashed | 0.15 | — | — | on rail, greeked |
| cycle 3 | active | 1 | **442** | **168** | **position memory restored** |

`data_x=80, data_y=70` preserved across stash→unstash (canvas memory ✓).

### Rail greeked geometry (S=0.15, fs=2.4px)

| box | cpl | rows | width | height | expected w | expected h |
|-----|-----|------|-------|--------|-----------|-----------|
| DOC-03 | 40 | 14 | 57.6 | 40.3 | 40·0.6·2.4=57.6 | 14·1.2·2.4=40.32 |
| DOC-04 | 64 | 6 | 92.2 | 17.3 | 64·0.6·2.4=92.16 | 6·1.2·2.4=17.28 |

Each greeked icon preserves its own aspect ratio (varies with cpl/rows). Rail
entries grow to fit their icons (74.9px, 51.9px) — the `<div role="button">`
fix from the reset.

### Console errors

0 errors after exercising: debug toggle, add-box, full state cycle on a box.

### Screenshot

`/tmp/ws-phase1.png` — for human visual confirmation (model cannot read images).

## Acceptance criteria (Phase 1)

| criterion | status |
|-----------|--------|
| Boxes render on canvas at free (x,y) | ✅ absolute, coordinate math closes |
| Boxes render on the rail at S=0.15 | ✅ greeked, geometry verified |
| Button-driven state cycle (stashed→active→expanded) | ✅ round-trip verified |
| Stashed boxes render greeked (S=0.15) with constant line count | ✅ fs=2.4px, heights match rows·1.2·2.4 |
| Canvas position remembered per box across stashed→active | ✅ data_x/y preserved; rect restored to (442,168) |

## Lessons

- **The Derrida question is a spiral-detector.** Three inherited-rule battles
  in one prototype is the signature of fighting a cascade, not building a
  feature. When the coordinate math stops closing with no visible cause, you
  are fighting an invisible inherited rule — stop patching, ask whether the
  surface belongs in the cascade at all.
- **`all: initial` is too blunt, but custom properties survive.** The right
  scoped reset nukes layout assumptions (`box-sizing`, flex/grid defaults,
  margins) while letting theme tokens (`--font-mono`, `--bg-canvas`,
  `--monobox-*`) flow through. The reset is a membrane, not a second design
  system.
- **Plain block beats flex for positioned containers.** The canvas box was
  `display: flex; flex-direction: column` — the shrink-to-fit width ambiguity
  in an abs-pos flex container contributed to the non-closing math. Switching
  to `display: block` (children stack as normal blocks) removed the ambiguity
  entirely. Flex is for distribution; positioned spatial boxes don't need it.
- **`<button>` UA sizing is a flex-hostile quirk.** A `<button>` with
  `display: flex` won't grow to fit a child with an explicit height — it clamps
  to its UA height. Use `<div role="button" tabindex="0">` with Alpine
  `@click` + `@keydown.enter.prevent` for accessible flex-hosted interactive
  entries.

## What's left / next steps

- **Phase 2 (td-abce57): Drag + Throw.** Pointer drag on canvas boxes (update
  x/y); throw gesture (`active → stashed`); animated scale + position
  transition. The closing coordinate math is the prerequisite — now satisfied.
  Verify 60fps during drag (reuse the MonoBox harness method).
- **Phase 3 (td-d231e7): Multi-box state machine + debrief.** N boxes,
  independent state, z-order/focus on click. Formalise the state diagram from
  observed transitions.
- **Real-browser visual confirmation** of the greeked rail icons
  (`/tmp/ws-phase1.png`).

## Verification commands

```bash
just check                          # biome + tsc — green
bun run dev start                   # dev server (port 3000)
# then in a browser:
#   /workspace/          — Phase 1 prototype, cycle buttons + rail
```
