# Current Task: Sigma Explorer UI Tweaks

## Status: READY TO START 🎯
**Start Date:** 2025-12-11

## Objective
Improve Sigma Explorer UI to better visualize the PERSONA graph, handle orphan nodes, and provide better domain filtering and navigation.

## Verification Challenge Game 🎯
**Current Score:** User: 1 | Agent: 0

---

## Tasks

### Phase 1: Domain Filtering
- [ ] Add domain selector (Persona / Experience / Unified)
- [ ] Filter nodes and edges by selected domain
- [ ] Update graph rendering when domain changes
- [ ] Persist domain selection in URL/state

### Phase 2: Orphan Node Handling
- [ ] Visual indicator for orphan nodes (different color/size)
- [ ] Option to hide/show orphan nodes
- [ ] Orphan count display in UI
- [ ] Click orphan to see why it's disconnected

### Phase 3: Community Visualization
- [ ] Verify Louvain community detection working
- [ ] Improve community coloring (distinct palette)
- [ ] Community labels/names
- [ ] Filter by community

### Phase 4: Graph Layout
- [ ] Improve initial layout (reduce overlap)
- [ ] Zoom to fit on load
- [ ] Center graph on domain switch
- [ ] Smooth transitions

## Context from Previous Task

### PERSONA Graph Status
- **Nodes:** 185 (161 concepts + 24 directives)
- **Edges:** 386 (MENTIONS)
- **Connectivity:** 86% (159 connected, 26 orphans)
- **Status:** ✅ Functional and ready for visualization

### EXPERIENCE Graph Status
- **Nodes:** 128 documents
- **Edges:** 112 (MENTIONS, EXEMPLIFIES)
- **Connectivity:** 38% (48 connected, 80 orphans)
- **Status:** ⚠️ Sparse, needs improvement (future task)

### Current UI Issues
- Mixed domains shown together (confusing)
- Orphan nodes clutter the view
- No way to filter by domain
- Community structure not obvious

## Success Criteria
- [ ] Can switch between Persona/Experience/Unified views
- [ ] Orphan nodes are visually distinct
- [ ] Graph is centered and well-laid-out
- [ ] Communities are clearly visible
- [ ] UI is responsive and smooth

## Files to Modify
- `public/sigma-explorer/index.html`
- `public/sigma-explorer/index.js`
- `public/sigma-explorer/viz.js`
- `public/css/components.css` (if needed)

## Reference
- Current database: `public/resonance.db`
- 313 nodes, 498 edges
- PERSONA: 86% connectivity
- EXPERIENCE: 38% connectivity
