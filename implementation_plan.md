# Implementation Plan: Automatic CSS Contrast Theming (OKLCH Edition)

**Goal:** Implement "The CSS Contrast Trick" to automatically calculate the optimal text color (Black/White) for any background color using pure CSS `calc()`.

**Architectural Shift:** We are choosing **OKLCH** over HSL.
- **Why?** HSL is not perceptually uniform. `hsl(60, 100%, 50%)` (Yellow) is much brighter than `hsl(240, 100%, 50%)` (Blue), which breaks simple threshold-based contrast math.
- **OKLCH:** `L` (Lightness) is perceptually uniform. `0.5` Lightness means the same "brightness" to the human eye regardless of Hue. This makes our math robust.

## Core Concept: The Lightness Switch

### The Formula (OKLCH)
OKLCH Lightness goes from `0.0` (Black) to `1.0` (White).
We'll use a threshold of approx `0.6` (60%).

```css
/* Input: Background Lightness (0.0 - 1.0) */
--bg-l: 1.0; 

/* Logic: 
   If bg-l > 0.6 (Light) -> (1.0 - 0.6) * -1000 = Negative -> Clamped to 0 (Black)
   If bg-l < 0.6 (Dark)  -> (0.2 - 0.6) * -1000 = Positive -> Clamped to 1 (White)
*/
--threshold: 0.6;
--contrast-switch: calc((var(--bg-l) - var(--threshold)) * -1000);
--text-lightness: clamp(0%, var(--contrast-switch), 100%);
/* Note: output is 0% or 100% for use in oklch(L C H) or just colors */
```

## Proposed Changes

### 1. Refactor `src/css/layers/theme.css`

#### Step A: Define OKLCH Channels
We will decompose colors into channels.
```css
:root {
    /* Brand / Primary */
    --brand-l: 0.25; /* Dark Gray */
    --brand-c: 0.02; /* Low Chroma */
    --brand-h: 260;  /* Hue */
    
    --primary: oklch(var(--brand-l) var(--brand-c) var(--brand-h));
    
    /* Calculate Contrast Color Automatically */
    /* If bg is light, text is black. If bg is dark, text is white. */
    --primary-fg: oklch(
        clamp(0, calc((var(--brand-l) - 0.6) * -1000), 1) /* L: 0 or 1 */
        0 0 /* No Chroma/Hue needed for Black/White */
    );
}
```

#### Step B: Surface Abstractions & Dark Mode
We will rely on re-defining the **Lightness (`--*-l`)** channel in media queries.

```css
:root {
    --surface-1-l: 0.99; /* Nearly White */
    --surface-1-c: 0;
    --surface-1-h: 0;
    --surface-1: oklch(var(--surface-1-l) var(--surface-1-c) var(--surface-1-h));
    
    --surface-1-fg: oklch(
         clamp(0, calc((var(--surface-1-l) - 0.6) * -1000), 1)
         0 0
    );
}

@media (prefers-color-scheme: dark) {
    :root {
        --surface-1-l: 0.15; /* Dark Gray */
        /* --surface-1-fg automatically flips to White because 0.15 < 0.6 */
    }
}
```

### 2. Migration Strategy
1.  **Backup** current `theme.css`.
2.  **Convert** Palette:
    -   `#ffffff` -> `oklch(1 0 0)`
    -   `#202124` -> `oklch(0.25 0.02 260)`
3.  **Implement** the Variables in `theme.css`.
4.  **Update** `layout.css` and `components.css` to use the new variables.

## Comparison: Why not HSL?
In HSL, if we had a "Brand Yellow" (`L=50%`) and "Brand Blue" (`L=50%`), the auto-contrast might treat them the same. 
- Yellow background + White Text = Unreadable.
- Blue background + White Text = Readable.
With OKLCH, Yellow `L` would naturally be higher (e.g., `0.9`), triggering the switch to Black text correctly.

## Verification
- **Visual Check:** Toggle light/dark mode.
- **Color Accuracy:** Ensure the converted OKLCH colors match previous Hex intent.
- **Contrast Check:** Verify text is strictly #000 or #FFF (or equivalent OKLCH).
