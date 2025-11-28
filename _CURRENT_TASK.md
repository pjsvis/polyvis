    -   Automated builds (`build:js`, `build:css`) passed.
    -   Manual verification pending (post-reboot).

**N# Current Task

**Status:** Idle / Ready for Next Task

## Objective
The CSS refactor (Magic Numbers, Control Panel, Container Queries) and Front Page Theme Fix are complete.

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
- [x] Verify Changes `src/js/components/explorer.js`
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