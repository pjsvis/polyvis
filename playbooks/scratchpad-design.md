# Scratchpad: AntiGravity Design System

## Objective
Emulate the "AntiGravity" (Google Internal Agent) aesthetic to improve clarity and information density.

## 1. Typography
**Goal:** High legibility at small sizes (12px - 14px).

-   **Font Family**: `Inter` (Primary), `Roboto` (Fallback).
    -   *Action*: Ensure `Inter` is loaded via Google Fonts in `v3.html`.
-   **Scale** (Dense):
    -   `text-xs`: `11px` / `12px` (Metadata, Footers)
    -   `text-sm`: `13px` (Sidebar items, Secondary text)
    -   `text-base`: `14px` (Body text, Standard UI)
    -   `text-lg`: `16px` (Headers)
-   **Weights**:
    -   `400` (Regular)
    -   `500` (Medium) - Use for UI labels instead of Bold.
    -   `600` (SemiBold) - Use sparingly for active states.

## 2. Color Palette (Open Props Mapping)
**Goal:** High contrast "Google Dark" aesthetic using Open Props.

| Token | AntiGravity Goal | Open Prop Estimate | Description |
| :--- | :--- | :--- | :--- |
| **Backgrounds** | | | |
| `--surface-1` | `#202124` (Deep Grey) | `var(--gray-9)` | Main Background |
| `--surface-2` | `#28292c` (Lighter) | `var(--gray-8)` | Sidebar / Panels |
| `--surface-3` | `#3c4043` (Hover) | `var(--gray-7)` | Hover States / Inputs |
| `--surface-4` | `#5f6368` (Active) | `var(--gray-6)` | Active States / Borders |
| **Text** | | | |
| `--text-1` | `#e8eaed` (High Contrast) | `var(--gray-0)` | Primary Text |
| `--text-2` | `#bdc1c6` (Muted) | `var(--gray-3)` | Secondary Text |
| `--text-3` | `#9aa0a6` (Disabled) | `var(--gray-5)` | Disabled / Placeholder |
| **Accents** | | | |
| `--brand` | `#8ab4f8` (Google Blue) | `var(--blue-4)` | Links, Focus |
| `--brand-hover`| `#aecbfa` (Lighter) | `var(--blue-3)` | Hover Links |
| **Borders** | | | |
| `--border-base`| `#3c4043` (Subtle) | `var(--gray-7)` | Dividers |

## 3. Layout Density (Open Props)
-   **Sidebar Item Height**: `var(--size-7)` (approx 28px).
-   **Padding**: `var(--size-1) var(--size-2)` (4px 8px).
-   **Radius**: `var(--radius-2)` (5px) or `var(--radius-3)` (10px).

## Action Plan
1.  **Load Fonts**: Add `<link>` for Inter in `v3.html`.
2.  **Update Variables**: Apply these `var(--...)` mappings to `theme.css`.
3.  **Refine CSS**: Adjust `text-sm` and `text-base` definitions in `theme.css`.
