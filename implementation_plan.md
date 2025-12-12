# Implementation Plan: Sigma Explorer UI Restoration

**Goal:** Restore the UI improvements (Domain Filtering, Orphan Handling, Visual Polish) that were reverted, but implement them correctly this time using the **Direct Method Import** pattern to prevent Alpine.js method binding errors.

## User Review Required
> [!IMPORTANT]
> **Constraint Check:** This plan strictly enforces the "Direct Method Import" pattern (`...Viz.methods`) discovered in the `alpinejs-playbook.md`. We will NOT use `Object.fromEntries` wrapping.

## Proposed Changes

### Phase 1: Method Binding Foundation (Critical Path)
**Target:** `src/js/components/sigma-explorer/graph.js`

The root cause of previous failures was broken `this` context when methods tried to call each other. We will fix this foundation first.

#### [MODIFY] `src/js/components/sigma-explorer/graph.js`
- **Change:** Replace `...Object.fromEntries(...)` with `...Viz.methods`.
- **Change:** Initialize `settings` in the `init()` method so it's available to all methods via `this.settings`.
- **Verification:** Confirm `toggleColorViz()` can call `resetColors()` without error.

### Phase 2: Domain Logic & Filtering
**Target:** `src/js/components/sigma-explorer/graph.js` & `public/sigma-explorer/index.html`

Once the foundation is solid, we re-introduce the domain capability.

#### [MODIFY] `src/js/components/sigma-explorer/graph.js`
- **Add State:** `currentDomain: 'persona'` (options: `persona`, `experience`, `unified`).
- **Add Logic:** `updateGraphForDomain(domain)` method to filter nodes/edges based on the domain.
- **Add Persistence:** sync state to URL params.

#### [MODIFY] `public/sigma-explorer/index.html`
- **Add UI:** Dropdown/Buttons for switching domains.

### Phase 3: Orphan Node Handling
**Target:** `src/js/components/sigma-explorer/graph.js` & `public/sigma-explorer/index.html`

#### [MODIFY] `src/js/components/sigma-explorer/graph.js`
- **Add State:** `showOrphans: false`.
- **Add Logic:** `computeOrphans()` to identify nodes with degree 0.
- **Add Visuals:** Color orphan nodes distinctly (e.g., Red/Orange) when shown.

#### [MODIFY] `public/sigma-explorer/index.html`
- **Add UI:** "Show/Hide Orphans" toggle button.
- **Add Stats:** Display count of orphan nodes.

### Phase 4: Visual Polish
**Target:** `public/sigma-explorer/index.html`

#### [MODIFY] `public/sigma-explorer/index.html`
- **Fix:** "Analysis Guide" text color (ensure high contrast in dark/light modes).
- **Fix:** Button active states (visual feedback for toggles).

## Verification Plan

### 1. Zero-Error Gate (New Protocol)
- **Action:** Open Browser Console.
- **Check:** Click "Persona" -> "Experience" -> "Unified".
- **Pass Criteria:** ZERO red errors in the console. specifically looking for `this.methodName is not a function`.

### 2. Visual Functional Test
- **Domain Switch:** Graph updates to show different node sets (Persona ~185, Experience ~128).
- **Orphan Toggle:** Clicking "Show Orphans" makes red nodes appear. Clicking again hides them.
- **Layout:** Graph centers correctly after domain switch.

### 3. Build Verification
- `tsc --noEmit` (Must pass).
- `bunx biome check` (Must pass).
