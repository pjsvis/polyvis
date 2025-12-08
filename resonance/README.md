# Resonance Engine

Resonance is a **Knowledge Package Manager** and **Operational Memory System** for PolyVis. It standardizes how unstructured markdown artifacts (playbooks, debriefs) are indexed into a structured SQLite graph (`resonance.db`) and exposed to coding agents via the [Model Context Protocol (MCP)](https://modelcontextprotocol.io/).

## Features

-   **Knowledge Graph**: Indices Playbooks and Debriefs into `nodes` and `edges`.
-   **Package Management**: `install`, `init`, and `sync` commands to manage knowledge assets.
-   **Agent Interface (MCP)**: Exposes the graph to AI agents (Claude, IDEs) for context-aware querying.

## Installation

```bash
# Build the binary
bun run build

# Or run via source
bun run src/index.ts
```

## CLI Commands

### `resonance init`
Initializes the `.resonance` environment in the current directory.
-   `--magic`: Heuristically scans the project and auto-installs relevant playbooks.

### `resonance install [package]`
Installs a playbook from the upstream registry.
-   `--magic`: Auto-detects based on project files (e.g., `tailwind.config.js` -> installs `css-playbook`).

### `resonance sync`
Ingests local markdown artifacts (`playbooks/*.md`, `debriefs/*.md`) into the internal SQLite graph (`.resonance/resonance.db`).

### `resonance serve`
Starts the MCP Server over `stdio`. This allow AI agents to connect and query the graph.

---

## Agent Integration (MCP)

Resonance implements the Model Context Protocol, allowing generic AI clients to access project knowledge.

### Configuration for Claude Desktop

Add the following to your `~/Library/Application Support/Claude/claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "resonance": {
      "command": "/usr/local/bin/bun",
      "args": [
        "run",
        "/ABSOLUTE/PATH/TO/polyvis/resonance/src/index.ts", 
        "serve"
      ],
      "cwd": "/ABSOLUTE/PATH/TO/YOUR/PROJECT"
    }
  }
}
```

*Note: Replace `/ABSOLUTE/PATH/TO` with your actual paths. You can also point `command` to the compiled binary `resonance` if you have built it.*

### Capabilities

When connected, the Agent gains the following tools:

#### `query_graph`
Executes specific SQL queries against the knowledge graph.
-   **Input**: `SELECT * FROM nodes WHERE type = 'playbook' LIMIT 5`
-   **Use Case**: "Find all playbooks related to CSS."

#### Resources (`resonance://`)
The agent can read specific nodes directly as resources.
-   **URI Format**: `resonance://{type}/{id}`
-   **Example**: `resonance://playbook/css-playbook`

### Development

To verify the MCP server is working locally:

```bash
cd resonance
bun test
```
