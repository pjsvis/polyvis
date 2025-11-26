# CSS Playbook

## Purpose
To document the styling standards, architectural patterns, and common "gotchas" for the PolyVis project. This ensures consistency and prevents recurring layout bugs.

## Core Principles
1.  **Vanilla First:** We use standard CSS variables and layout primitives (Flexbox/Grid) before reaching for frameworks.
2.  **Utility Classes:** We use Tailwind CSS for utility classes but maintain semantic class names (e.g., `.btn-structural`) for recurring components.
3.  **Theming:** All colors must be defined in `:root` variables in `style.css`. Hardcoded hex values are forbidden in component CSS.

## Global Variables (The DNA)
Located in `public/css/style.css`.

```css
:root {
  --primary: #070709;  /* The Ink (Tolinski Black) */
  --secondary: #fff;   /* The Paper (Pure White) */
  --accent: #f4f4f4;   /* The Void */
}
```

## Common Pitfalls & Solutions

### 1. The "Overflow Trap" (Z-Index Clipping)
**Problem:** If you apply `overflow: auto` (or `hidden`/`scroll`) to a container (like a sidebar), any child element with `position: absolute` will be clipped by that container's bounds, even if it has a high `z-index`.

**Scenario:** Tooltips or dropdown menus inside a scrolling sidebar.

**Solution:**
1.  **Fixed Positioning:** Use `position: fixed` for the floating element. This positions it relative to the viewport, breaking it out of the overflow container.
2.  **Portal/Global Mounting:** Move the DOM element outside the scrolling container (e.g., to the `<body>` tag) and use JavaScript to position it.

### 2. Stacking Contexts
**Problem:** `z-index` only works within a Stacking Context. Elements like `opacity`, `transform`, and `filter` create new stacking contexts, often trapping your `z-index` values.

**Solution:** Keep your z-index hierarchy flat and simple. Avoid unnecessary transforms on container elements.

## Component Standards

### Buttons (`.btn-structural`)
- **Style:** Brutalist, high-contrast, monospace.
- **Interaction:** `transform: translate` on click for tactile feel.
- **Shadows:** Hard shadows (`box-shadow: 4px 4px 0px 0px`) for depth.

### Layouts
- **Viewport:** `100vh` / `100vw` with `overflow: hidden` on `body` for app-like feel.
-   **Flexbox:** Use `flex-col` for the main page structure (Navbar -> Main -> Footer).

### 3. Footer Layout
**Problem:** A footer placed outside a scrollable main area can push the body height beyond `100vh`, causing global scrollbars (The "Tailwind Paradox").

**Solution:** Place the footer **inside** the scrollable container (e.g., `<main>`).
```html
<div class="h-screen flex flex-col">
  <nav>...</nav>
  <main class="flex-grow overflow-y-auto">
    <!-- Content -->
    <footer>...</footer>
  </main>
</div>
```
