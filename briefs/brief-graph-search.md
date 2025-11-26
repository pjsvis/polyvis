# Project Brief: Graph Search

**Objective:**
Implement a search functionality in the Sigma Explorer to allow users to quickly find and navigate to specific nodes by ID or Label.

**Constraint Checklist:**
*   **UI:** Must fit within the existing "Controls" sidebar.
*   **Interaction:** Selecting a result must select the node in the graph and center the camera.
*   **Performance:** Search should be instantaneous (client-side filtering of ~200 nodes).

---

## 1. UI Components

**File:** `public/sigma-explorer/index.html`

*   **Search Input:** A text input field at the top of the Left Sidebar (above "Analysis").
*   **Results Dropdown:** A list of matching nodes that appears as the user types.

## 2. Logic

**File:** `public/sigma-explorer/index.html` (Alpine Component)

*   **State:** `searchQuery` (string), `searchResults` (array).
*   **Filtering:**
    *   Triggered on input.
    *   Matches against `node.id` and `node.label`.
    *   Case-insensitive.
*   **Selection:**
    *   Clicking a result calls `selectNode(id)`.
    *   Clears `searchQuery` and `searchResults` after selection.

## 3. Definition of Done
1.  **Input:** User can type "OH-104" or "Humility".
2.  **Results:** A list of matching nodes appears.
3.  **Navigation:** Clicking a result navigates to the node.
