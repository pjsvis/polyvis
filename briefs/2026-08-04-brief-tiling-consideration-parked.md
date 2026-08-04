# brief: Tiling Consideration (Parked) — and the Cartesian UI We Don't Have

**Created:** 2026-08-04
**TD:** none (parked — no task; recorded against epic td-bb916c)
**Status:** parked
**Kind:** consideration / fork-in-the-road record. Not for execution. A future
session may revive it; until then it exists so the fork is *named*, not lost to
oral tradition.

## What

A record of the tiling-vs-free-canvas fork, considered during Spatial Canvas
Phase 1 (td-6fd506) and deliberately **not** pursued. Plus the architectural
lament that explains *why* the fork is hard in the first place: there is no
cartesian display primitive available to us. We are stuck between two
inheritances, both hostile to spatial arrangement.

## Why a parked brief (not an ADR, not a decision)

This is not a decision — founding decision #2 of the spatial-canvas brief
(`briefs/2026-08-03-brief-spatial-canvas-arrangement.md`) stands: **hybrid free
canvas + stash rail.** This brief records the *alternative* that was weighed,
so a future session can revive it without re-deriving the reasoning. ADRs
record what we chose; parked briefs record what we considered and set down.

## The fork, weighed

**Tiling model (Helix-style).** Panes fill allocated space; split H/V into a
binary tree; no overlap; no free position; grid *responds to* the pane
allocation (cols/rows derived from pixel space ÷ char cell).

**Free canvas model (the brief's choice).** Boxes at arbitrary `(x,y)`; overlap
permitted; z-order/focus on click; throw-to-rail; discrete scale states
(stashed 0.15 / active 1.0 / expanded 2.0).

| axis | tiling | free canvas |
|------|--------|-------------|
| layout cost | low (deterministic) | high (collisions, coordinate math) |
| collision handling | none (impossible) | explicit (out of scope for now) |
| spatial memory | weak (positions are derived) | strong ("the spec is over there") |
| keyboard nav | natural | bolt-on |
| the throw/stash metaphor | doesn't fit | native |
| zoom/emphasis states | doesn't fit | native |
| coordinate-math-closing requirement | none | strict (ADR-002 was the cost) |

**Verdict (held, not final):** keep the free canvas. The affordances the brief
wants — spatial memory, throw/stash, emphasis states — are the product. Tiling
surrenders them. But the cost is real: ADR-002 (the scoped reset) was the price
of making the coordinate math close, and that cost traces directly to the
lament below.

## What's worth stealing from tiling (additive, not a pivot)

These do not reverse founding decision #2. They are tuning knobs and layer
additions, logged here as candidates for a future phase:

1. **Global base scale + per-box emphasis.** Helix's "one text size, many
   panes" feels calmer than our per-box discrete scale. If `active` shared a
   global scale and only `expanded` deviated, the workspace would read as
   "consistent text, one emphasised thing" rather than "a room of mismatched
   monitors." A tuning knob, not a rebuild.
2. **Tabs as a grouping layer above the canvas.** We have the rail (a holding
   area) but nothing above the canvas. A tab = a saved canvas arrangement.
   Cheap, high-leverage, matches a mental model people already have. Candidate
   for a future brief.
3. **A `fill` box variant.** The MonoBox primitive could support a `fill` mode
   (cpl/rows derived from a container's pixel space) alongside the current
   `free` mode (fixed cpl/rows, discrete scale). That gives tiling *inside* a
   canvas region without abandoning the canvas. Optional, deferred — the
   primitive does not block it.

## The lament: there is no cartesian computer UI

This is the architectural root cause behind both the fork's difficulty and
ADR-002's necessity. It deserves to be said plainly.

We do not have a display primitive that is *cartesian* — that is, a surface on
which you place rectangles at integer `(x,y)` with a known `(w,h)` and the
layout *is* that, nothing more. Instead we inherit one of two traditions, both
hostile to spatial arrangement:

**1. VT-series terminal emulation (1970s→).** A character grid: rows × cols,
each cell one glyph at one fixed size. The "box" is the grid; positioning is
"which row, which column." Geometry is honest and cartesian *within the grid*,
but the grid is the only shape you get. A pane fills its grid; you cannot place
a grid at `(347, 89)` at 1.7× scale. This is the Helix/terminal lineage —
deterministic, cheap, and unable to express "the spec is over there, larger."

**2. CSS / the web's document-flow model (1990s→).** A cascade of boxes whose
final geometry is the *emergent* output of a dozen interacting systems:
normal flow, flexbox, grid, the BFC, `box-sizing`, the cascade itself, UA
defaults, transforms, containing blocks, and the order in which all of these
are resolved. There is no `(x,y)` until you fight your way to `position:
absolute` against a `relative` ancestor — and even then the coordinate closes
only if nothing upstream has injected a transform, a margin, a border-box
mismatch, or (as we hit in ADR-002) an invisible inherited rule that makes
`offsetLeft=80` + offsetParent@360 produce `rect.left=-115`. CSS gives you
cartesian output only as a *special case* you must carve out of document flow.
The scoped reset (ADR-002) is exactly that carving.

**What we lack, and why it matters.** A true cartesian primitive would be a
surface where `place(rect, x, y, w, h, scale)` is an atomic, context-free
operation — no cascade to fight, no grid to fill, no ancestor rules to reset.
With it, the spatial canvas would be trivial: the workspace would be one such
surface and boxes would be rectangles on it. Without it, every spatial
arrangement is either a grid (terminal) or a carve-out (CSS), and the
carve-out's cost is the entire ADR-002 saga.

This is why the tiling fork is tempting: tiling stays *inside* the grid
tradition and pays no cartesian tax. The free canvas insists on cartesian
output and pays the tax in full. The choice between them is, at root, a choice
about which inheritance we'd rather fight — and the lament is that we must
fight one at all.

## Job for the future / a job for the ages

A real cartesian display layer — one where spatial arrangement is the *native*
operation, not a carve-out from a grid or a flow — is not this brief's work,
not this epic's work, and arguably not this stack's work. It is a foundational
reclamation: take the pixel grid (which *is* cartesian at the hardware level)
and expose it as a first-class surface, bypassing both the terminal emulator's
character grid and the browser's document flow. The canvas/SVG/WebGPU
primitives gesture at this but each carries its own inheritance (canvas has no
text model; SVG has a DOM; WebGPU is a render pipeline, not a layout system).

Recorded here so the ambition is *named*, not lost. The spatial-canvas epic
proceeds within the world we have (CSS, scoped-reset carve-outs, the MonoBox
primitive). The world we want — cartesian arrangement as a native primitive —
waits. It is a job for the future, and a job for the ages.

## Acceptance criteria

None. This is a parked brief. It accepts nothing, completes nothing. It exists
to be *found* by a future session asking "did we consider tiling?" or "why is
the coordinate math so hard?" — and to answer: yes, and here is why.

## Out of scope

Everything. By definition.
