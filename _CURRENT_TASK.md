# Current Task: Documentation & Launch Prep

**Status:** In Progress
**Objective:** Replace initial test documentation with real content, finalize the Substack narrative, and publish.

## Checklist
- [ ] Review `substack/substack-playbook-1.md` and `substack/substack-playbook-2.md`
- [ ] Replace test docs with real documentation
- [ ] Generate high-resolution screenshots/assets of the graph
- [ ] Finalize the narrative ("Structural Information Engineering")
- [ ] Publish


## Next task

# Task: Build Resonance Engine (v1.0)

refer to 

- `briefs/A-brief-resonance-engine.md` 
- `briefs/B-brief-configuration-engine.md`
- `briefs/C-brief-experience-graph.md`  

for details



**Status:** Pending
**Objective:** Create the standalone `resonance` binary for Meta-Cognitive Graph management.

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



