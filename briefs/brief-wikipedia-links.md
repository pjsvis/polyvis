# Task: Wikipedia Links Integration

**Objective:** Enhance the graph with external learning resources by adding curated Wikipedia (or other) links to nodes.

- [ ] Data-driven approach: Links are part of the data, not hardcoded in the frontend.
- [ ] Ingestion Pipeline: Links are generated/added during the Python ingestion process.
- [ ] Manual Review: A workflow step to review/verify links before they go live.
- [ ] UI Integration: Unobtrusive "External Link" icon in the Node Details panel.

## Key Actions Checklist:

- [ ] **Schema Update:** Add `url` field to the Node JSON schema and SQLite database schema.
- [ ] **Ingestion Script Update:** Modify the Python script to accept/generate a `url` field for nodes.
- [ ] **Frontend Update:** Update `index.html` (Sigma App) to render an external link icon if `node.url` exists.
- [ ] **Data Update:** Populate the `url` field for a subset of nodes (e.g., Core Concepts) to test.

## Detailed Requirements / Visuals

### Data Flow
1.  **Source:** Python Script / LLM -> Generates Narrative + URL.
2.  **Review:** Human verifies URL in intermediate file (CSV/JSON).
3.  **Storage:** SQLite `nodes` table (`id`, `label`, ..., `url`).
4.  **Display:** Frontend reads `url` from DB.

### UI Mockup (Node Details)

```text
+--------------------------------------------------+
|  NODE DATA                                    X  |
+--------------------------------------------------+
|  LABEL                                           |
|  Kurt Gödel  [External Link Icon]                |  <-- New Icon here
|                                                  |
|  TYPE                                            |
|  [ Person ]                                      |
|                                                  |
|  DEFINITION                                      |
|  Mathematician, logician, and philosopher...     |
+--------------------------------------------------+
```

### UX Behavior
- **Icon:** Use `external-link` from Lucide.
- **Interaction:** Click opens the URL in a new tab (`target="_blank"`).
- **Visibility:** Icon only appears if `node.url` is not null/empty.
