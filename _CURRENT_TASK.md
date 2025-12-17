# Current Task: MCP Stabilization & OPM-15 Inquiry

**Objective:** Stabilize MCP Server and retrieve OPM-15 definition.

## Status: Complete (2025-12-17)

## Checklist
- [x] **Discovery:** Identified OPM-15 as "Resonance Dual-Provider Inference Protocol".
- [x] **Bug Fix:** Resolved MCP Server `EOF` crash caused by aggressive "Zombie Defense".
- [x] **Refactor:** `ZombieDefense` now identity-aware (excludes self-PID).
- [x] **Lifecycle:** `ServiceLifecycle` allows relaxed checks for `stdio` mode.
- [x] **Verification:** Validated via `scripts/verify/test_mcp_lifecycle.ts`.

## Next
- **Resume:** Normal development operations.
