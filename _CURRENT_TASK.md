# Current Task: Documentation & Launch Prep

**Status:** In Progress
**Objective:** Replace initial test documentation with real content, finalize the Substack narrative, and publish.

## Checklist
- [ ] Review `substack/substack-playbook-1.md` and `substack/substack-playbook-2.md`
- [x] Refactor CSS Variables and Legacy Cleanup <!-- id: 0 -->
    - [x] Cleanup deprecated explorer and graph files <!-- id: 1 -->
    - [x] Refactor navbar to static HTML <!-- id: 2 -->
    - [x] Verify site navigation <!-- id: 3 -->
- [ ] **CSS Lint Sprint** (New) <!-- id: 4 -->
    - [ ] Review `briefs/_brief-css-lint-sprint.md` <!-- id: 5 -->
    - [ ] Resolve `noImportantStyles` in `utilities.css` <!-- id: 6 -->
    - [ ] Resolve `noImportantStyles` in `markdown.css` <!-- id: 7 -->
    - [ ] Verify clean `bun run check` <!-- id: 8 -->


## Next task

# Task: Build Resonance Engine (v1.0)

**Status:** Pending
**Prerequisites:** 
- [ ] CSS Lint Sprint (id: 4) 

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



