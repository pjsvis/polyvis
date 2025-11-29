    -   Automated builds (`build:js`, `build:css`) passed.
    -   Manual verification pending (post-reboot).

# Current Task: CSS Isolation & Tailwind v4

**Status:** Complete
**Objective:** Isolate `sigma-explorer` styles to prevent theme bleeding and ensure consistent graph visualization.

## Checklist
- [x] Research Tailwind v4 "CSS-first" configuration
- [x] Create `playbooks/tailwind-v4-playbook.md`
- [x] Refactor `src/css/layers/graph.css` for isolation
- [x] Remove inline styles from `public/sigma-explorer/index.html`
- [x] Fix bundling issue (Direct import vs Layer wrapper)
- [x] Verify isolation on `localhost:3000`

# Previous Task: Emulate AntiGravity Design (Typography & Colors)

**Objective**: Adopt the visual language (fonts, colors) of Google's AntiGravity agent to improve clarity and aesthetics.
**Mode**: Design / Implementation.
**Scratchpad**: `playbooks/scratchpad-design.md` (To be created).

## Status
- [ ] Research & Plan Design System
- [ ] Apply Visual Styles (Dark Mode, Typography)

## Checklist
- [ ] Define Color Palette (High Contrast Dark Mode)
- [ ] Define Typography (Google Sans/Inter, Fluid Sizes)
- [ ] Update `theme.css` / CSS Variables
- [ ] Verify clarity at small sizes

# Completed Task: YOLO Debugging Sidebar Scroll
**Status**: Complete
- [x] Verify "Lock Parent, Scroll Child" hypothesis via Browser.
- [x] Apply fix to `v3.html`.
- [x] Verify Dark Mode persists.
- [x] Fix Alpine.js TOC errors (Unique IDs).
- [x] Filter empty TOC items.
- [x] Simplify TOC styling (Strip-it-back).

## Checklist
- [x] Refactor Magic Numbers
- [x] Establish Control Panel in `theme.css`
- [x] Implement Container Queries
- [x] Fix Front Page Theme Logic
- [x] Refine Docs Directory Layout
- [x] Add Temporary RHS Directory
- [x] Implement Responsive Layout
- [x] Implement Fluid Layout
- [x] Emulate AntiGravity Design (Fonts, Colors, Resizing)
- [x] Verify Changes

# Current Task: Implement Doc Viewer v2
- [x] **Preparation**
    - [x] Generate `public/index.json` from existing docs
    - [x] Create `src/js/components/doc-viewer.js` (Alpine Store)
    - [x] Create `public/docs/v2.html` (Alternative Layout)
- [x] **Implementation**
    - [x] Implement "Sliding Window" Logic (Browse vs Reference Mode)
    - [x] Implement Left Panel Tabs (Index vs Outline)
    - [x] Implement Markdown Parsing & ID Injection
    - [x] Implement ToC Generation
- [x] **Verification**
    - [x] Verify Mobile/Desktop Responsiveness
    - [x] Verify Internal Link Routing
    - [x] Verify Back Button Logic `src/js/components/explorer.js`
    - [x] Create `src/js/components/sigma-explorer.js`
    - [x] Create `src/js/components/graph.js`
    - [x] Update `src/js/app.js` to bundle these
    - [x] Remove inline scripts from HTML files
- [x] Fix CSS Issues
    - [x] Move inline styles to `src/css/layers/`
    - [x] Ensure `build:css` works correctly
- [x] Verify Build Process

# Future Ideas (Backlog)
- [ ] **Publish Playbooks**: Create a `playbooks.md` index that lists all playbooks and scratchpads, allowing them to be browsed via the main `v3.html` viewer. The TOC will naturally handle the listing.  