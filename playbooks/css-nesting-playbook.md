# PolyVis: CSS Nesting Playbook & Operational Standards

**Status:** Draft | **Context:** PolyVis UI Implementation
**Based on:** Native CSS Spec & [Kevin Powell Analysis: Analysis-Powell-Nesting-001]
**Philosophy:** Pragmatic utility over dogmatic purity.

---

## 1. Core Philosophy: "Locality of Behavior"
We adopt CSS nesting primarily to enforce **OH-040: Principle of Factored Design**. All logic related to a component—including its responsive variations and state changes—should be co-located within its primary selector block.

* **Goal:** Reduce "Cognitive Load" by preventing the scattering of related styles across the stylesheet.
* **Anti-Pattern:** "Jump-scrolling" to find media queries at the bottom of a file.

## 2. The "Killer Feature": Nested Media Queries
This is the single highest-value application of nesting for this project.

* **Directive:** All media queries affecting a specific component **must** be nested directly within that component's block.
* **Why:** It keeps the component's "responsive story" intact and readable.
* **Note:** Ignore concerns about output repetition; Gzip/Brotli handles the redundancy trivially.

**Example:**
```css
.card {
  font-size: 1rem;

  /* YES: Co-located logic */
  @media (min-width: 768px) {
    font-size: 1.25rem;
  }
}