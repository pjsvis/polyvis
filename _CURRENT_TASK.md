# Current Task

**Status**: Active 🟢
**Started**: 2026-01-01
**Objective**: Implement "Slab & Grid" (Holy Grail) Layout

We are replacing the current application shell with a strict **3-Slab (Header/Stage/Footer)** architecture using **CSS Grid** and **Flexbox** to achieve a robust "Viewport Lock".

## Directives
# Current Task: Data Star Reactor Experiment (COMPLETED)

## Status: **COMPLETED**

The "Reactor" experiment successfully demonstrated the viability of a **Hollow Node** architecture. We proved that a high-frequency (10Hz) UI can be driven entirely by server-side logic using Server-Sent Events (SSE) and Datastar, with zero custom client-side JavaScript.

### Objectives Achieved
- [x] **Hollow Client**: `index.html` uses only HTML attributes (`data-text`, `data-attr-style`).
- [x] **Reactor Core**: `reactor.ts` (Bun) streams telemetry at 10Hz.
- [x] **Custom Bundling**: Solved plugin loading issues by creating a custom `datastar.bundle.js` with `bun build`.
- [x] **Protocol Decoding**: Reverse-engineered Datastar v1's SSE protocol (Line-based Key-Value pairs).
- [x] **Cloud Deployment**: Deployed successfully to **Cloudflare Pages** (`polyvis-reactor.pages.dev`) using Edge Functions.

### Key Artifacts
- **Experiment Code**: `experiments/data-star-dashboard/`
- **Playbooks**:
    - `playbooks/playbook-data-star.md`: Guide to Raw SSE & Datastar bundling.
    - `playbooks/playbook-cloudflare.md`: Guide to Pages Direct Uploads & Functions.

### Next Actions
- Review the experiment results and determine how to integrate "Hollow Node" patterns into the main PolyVis architecture (e.g., for the Agent Status monitors).
- Considerations for production: Use stable bundling, handle SSE reconnections gracefully.
