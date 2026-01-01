# Current Task

**Status**: Active 🟢
**Started**: 2026-01-01
**Objective**: Implement "Slab & Grid" (Holy Grail) Layout

We are replacing the current application shell with a strict **3-Slab (Header/Stage/Footer)** architecture using **CSS Grid** and **Flexbox** to achieve a robust "Viewport Lock".

## Directives
- **Viewport Lock**: `100vh` / `overflow: hidden` on body. No global scroll.
- **Slabs**: 
  1. Header (Fixed)
  2. Stage (Flex-Grow + Grid)
  3. Footer (Fixed)
- **Grid**: 3-Column Stage (`250px` | `1fr` | `350px`).
- **Resilience**: Use `min-height: 0` on flex children and `grid-column` locking to prevent layout shifts.

## Implementation Plan

### Phase 1: Prototyping (Experiment)
- [x] **Brief**: Analyze `briefs/brief-slab-and-grid-layout.md`.
- [x] **Prototype**: Build `experiments/slab-and-grid/index.html`.
- [x] **Validation**: Verify "Slab" behavior and "Grid" collapse logic with Alpine.js.
- [x] **Fix**: Resolve Grid auto-placement bug when sidebars are hidden.

### Phase 2: Integration (PolyVis Core)
- [ ] **Styles**: Port layout CSS to `src/css/layers/layout.css` and `main.css`.
- [ ] **Shell**: Update `public/index.html` to match the "Slab" structure.
- [ ] **Logic**: Port Alpine.js sidebar toggles to strict javascript or maintain Alpine if permitted (User requested Alpine for proto, need to confirm for App).

## Context
The "Slab & Grid" layout is the foundational architecture for the PolyVis IDE, ensuring that the Graph Canvas never fights with the document scrollbar.
