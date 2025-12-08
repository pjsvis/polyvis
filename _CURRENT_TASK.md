# Current Task: Build Resonance Engine (v1.0)

**Status:** Active
**Status:** Done

**Prerequisites:** 
- [X] CSS Lint Sprint (id: 4) 

**Objective:** Create the standalone `resonance` binary for Meta-Cognitive Graph management.

**Progress:**
- [x] **Scaffold Project:** Created `resonance/` with Bun + TypeScript.
- [x] **CLI Entry:** Implemented `src/index.ts` with Commander.
- [x] **Registry Module:** Implemented `detector.ts` (Magic) and `installer.ts` (Fetch).
- [x] **Graph Module:** Implemented `src/db.ts` (SQLite) and `src/commands/sync.ts`.
- [x] **Build:** Compiled binary to `resonance/dist/resonance`.

**Next:** 
- [ ] Implement `serve` command (MCP Server).
- [ ] Integrate Visualizer UI.
- [ ] Implement `src/commands/init.ts` (Scaffolding).
- [ ] **Core Logic (ETL)**
    - [ ] Port `build_experience.ts` logic to `src/commands/sync.ts`.
    - [ ] Implement Edge Generation (Regex for `OH-` and `[[links]]`).
- [ ] **Compilation**



