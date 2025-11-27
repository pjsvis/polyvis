# current task

= [ ] Fix CSS issues raised by the recent refactor

## Front Page @public/index.html
- [x] Front page should show a business-card-like layout with a menu on top
- [x] Refer to previous front page for details
- [x] Ensure Nav Bar is rock solid across pages
    - [x] Review current state
    - [x] Standardize styling (Glassmorphism/Full-width)
    - [x] Refactor `nav.js` and CSS
    - [x] Update all pages to use standard component
    - [x] Fix regression in Explorer page (missing script tag)
- [x] Fix Layout Overflow in `public/graph/index.html`
    - [x] Ensure no main window scrollbar
    - [x] Implement internal scrolling for containers
    - [x] Standardize layout with CSS variables (`--header-height`, `--footer-height`)
- [x] Refactor CSS to Layers
    - [x] Split `main.css` into `theme`, `base`, `layout`, `components`, `utilities`
    - [x] Consolidate design tokens in `theme.css`
