## Current Task: Visual QA & Regression Fixing

**Objective:** Compare the refactored UI against the "Old Page" reference and fix visual regressions ("Gremlins").

**Context:**
**Context:**
-   Visual QA for Front Page (`public/index.html`) is largely complete.
-   **Step 1 (Navbar):** Fixed (Color, Alignment, Links).
-   **Step 2 (Card):** Fixed (Centering, Layout, Visuals).
-   **Step 3 (Spacing/Fonts):** Fixed (`.stack-large`, Open Props fonts).
-   **Step 4 (Overlap):** Fixed (Verified 28px gap).

**Next Steps:**
1.  Await user confirmation to close this task.
2.  Move to next QA target or feature work.

## Front Page Gremlins (public/index.html)
- [ ] **Navbar Color:** Wrong color (likely default or missing variable).
- [ ] **Navbar Alignment:** Left-justified, should be centered.
- [ ] **Card Alignment:** Should be centered in the viewport.
- [ ] **Card Layout:** Launch button overlaps copyright line.
- [ ] **Card Spacing:** Sizing and spacing needs review.
- [ ] **Button Style:** Text is purple (unexpected), should likely be high-contrast/brutalist.

## Diagnosis
-   **Navbar:** Currently transparent, picking up `app-shell` background (`var(--accent)`/gray). Needs explicit `var(--secondary)` (white) background. Alignment needs `margin: 0 auto` or flex centering in parent.
-   **Card Alignment:** `.app-main` is a flex column without centering. Needs `place-items: center` or `justify-content: center`.
-   **Button Color:** The `.btn-structural` is an `<a>` tag. It lacks a `color` override for `:visited`, so it turns purple.
-   **Card Overlap:** `.home-box::after` border has fixed offsets (`10px`). Content spacing (`stack-large`) might be insufficient.
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
