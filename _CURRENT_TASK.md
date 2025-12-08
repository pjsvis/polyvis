# Current Task: Build Resonance Engine (v1.0)

**Status:** Active

**Prerequisites:** 
- [X] CSS Lint Sprint (id: 4) 

**Objective:** Create the standalone `resonance` binary for Meta-Cognitive Graph management.

Refer to: 

- `briefs/A*-E*.md` 

for details

## Checklist
- [ ] **Initialization & Config**
    - [ ] Create `resonance.settings.json` schema/interface.
    - [ ] Implement `src/config.ts` loader.
    - [ ] Implement `src/commands/init.ts` (Scaffolding).
- [ ] **Core Logic (ETL)**
    - [ ] Port `build_experience.ts` logic to `src/commands/sync.ts`.
    - [ ] Implement Edge Generation (Regex for `OH-` and `[[links]]`).
- [ ] **Compilation**
    - [ ] Configure `bun build --compile`.
    - [ ] Verify binary portability.



