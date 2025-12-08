
# Implementation Plan: Experience Graph Tuning

## Objective
Refine the Experience Graph visualization to achieve parity with the Persona graph's clustering quality and information density. This involves fixing hardcoded settings and tuning the Louvain resolution.

## Current State
- **Hardcoded Resolution:** `viz.js` currently forces the `persona` resolution (1.1) for all domains.
- **Inconsistent Thresholds:** `cycleLouvainGroup` uses a threshold of 8 for the "Show All" state, conflicting with the recently updated default of 5.
- **Settings:** `polyvis.settings.json` defines `experience: 1.0`, but this is currently ignored.

## Implementation Steps

### 1. Code Fixes (System Logic)
- [ ] **Dynamic Resolution:** Update `src/js/components/sigma-explorer/viz.js` to select the Louvain resolution based on `this.activeDomain`.
    ```javascript
    const domainKey = this.activeDomain === 'experience' ? 'experience' : 'persona';
    const resolution = this.settings?.graph?.tuning?.louvain?.[domainKey] || 1.1;
    ```
- [ ] **Consistent Thresholds:** Update `cycleLouvainGroup` in `viz.js` to use a threshold of **5** when resetting to the "Show All" view, matching the `toggleColorViz` logic.

### 2. Tuning & Verification
- [ ] **Visual Check:** Load the Experience Graph.
- [ ] **Cluster Analysis:** Observe the number and size of communities. (Target: ~5-9 distinct groups).
- [ ] **Tuning:** If the clusters are too large (under-segmented) or too fragmented, adjust `experience` resolution in `polyvis.settings.json`.
    - *Higher Resolution (> 1.0):* Smaller, more numerous communities.
    - *Lower Resolution (< 1.0):* Larger, fewer communities.

### 3. Finalization
- [ ] **Commit:** Save the tuned settings and code fixes.
