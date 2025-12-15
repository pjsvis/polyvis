# Operations: The Ingestion Daemon (Vector Service)

**Service:** `polyvis-vector-daemon`
**Source:** `src/resonance/daemon.ts`
**Port:** 3010 (Default)

The **Ingestion Daemon** is a lightweight HTTP service that keeps the embedding model (FastEmbed) loaded in memory. This prevents the significant overhead (2-5s) of reloading the model for every single CLI command or MCP request.

## Manual Management

### Spawning
```bash
bun run src/resonance/daemon.ts
```
*Note: Run in a separate terminal or background process.*

### Verification
```bash
curl http://localhost:3010/health
# {"status":"ok"}
```

## Architectural Opinion: MCP Integration

**Proposal:** Expose Daemon Management via MCP

**Verdict:** **YES.**

Exposing `manage_daemon` (start/stop/status) through the MCP server transforms the architecture from "Static Tooling" to **"Self-Healing Infrastructure."**

### Why?
1.  **Dependency Awareness:** The MCP actions `search_documents` and `inject_tags` depend on vectorization. If the daemon is down, these tools fail or fallback to slow cold-starts.
2.  **Agentic Diagnostics:** If an agent encounters a "Connection Refused" error during search, it can autonomously check the daemon status and restart it, resolving the issue without human intervention.
3.  **Resource Management:** Agents can spin down the daemon after a bulk ingestion task to free up memory (RAM).

### Proposed Tool Interface

```typescript
// Tool: manage_vector_service
{
  "action": "start" | "stop" | "restart" | "status"
}
```
