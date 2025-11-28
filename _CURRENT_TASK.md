    -   Automated builds (`build:js`, `build:css`) passed.
    -   Manual verification pending (post-reboot).

**N# Current Task

**Status:** Idle / Ready for Next Task

## Objective
The CSS refactor (Magic Numbers, Control Panel, Container Queries) and Front Page Theme Fix are complete.

# Current Task: YOLO Debugging Sidebar Scroll

**Objective**: Fix the sidebar scrolling in `v3.html` by any means necessary.
**Mode**: YOLO / Experimental.
**Scratchpad**: `playbooks/scratchpad-scrolling.md`.

## Status
-   [x] Verify "Lock Parent, Scroll Child" hypothesis via Browser.
-   [x] Apply fix to `v3.html`.
-   [ ] Verify Dark Mode persists.

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


## additional tasks

- [ ] the fonts used in Google AntiGravity are very clear at small sizes. 
- [ ] this is due to the fonts and the colours used in the theme. (dark in my case)
- [ ] we should research the fonts and colours used by AntiGravity and try and emulate their clarity
- similarly the three column AntiGravity layout is pretty neat, espescially the ability to resize
- lets research and see what we can emulate/plunder  