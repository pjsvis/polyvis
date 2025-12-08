# Current Task: Documentation & Launch Prep

**Status:** In Progress
**Objective:** Replace initial test documentation with real content, finalize the Substack narrative, and publish.


## todo

- [x] Why are debriefs from November all H1 whereas debriefs from December are all ok. Probably a faulty ingestion pipeline, as we changed it recently
- [x] The debriefs ingestion pipelline should move the lessons-learend to before the accomplishments, and problems sections.
- [x]  The wiki-style feature in our docs page is not working correctly. Identify a page with a wiki link and investigate.
- [x] The front page business-card is not working properly as a result of recent style changes. Fix it.
- [x] In sigma-explorer the ANALYSIS GUIDE text is dark on dark in light more, but ok in dark mode
- [x] The POLYVIS string in the nav bar should be stronger
- [x] In sigma-explorer the text in the nav bar should not wrap
- [x] Remove the source link from the navbar
- [x] Rationalize the Playbooks (CSS playbooks consolidated) the 10+ CSS playbooks into a single authoritative `playbooks/css-master-playbook.md` to improve agent context efficiency.
- [ ] Document any other issues that need addressed


## Checklist
- [ ] Review `substack/substack-playbook-1.md` and `substack/substack-playbook-2.md`
- [x] Refactor CSS Variables and Legacy Cleanup <!-- id: 0 -->
    - [x] Cleanup deprecated explorer and graph files <!-- id: 1 -->
    - [x] Refactor navbar to static HTML <!-- id: 2 -->
    - [x] Verify site navigation <!-- id: 3 -->
- [x] **CSS Lint Sprint** (New) <!-- id: 4 -->
    - [x] Review `briefs/_brief-css-lint-sprint.md` <!-- id: 5 -->
    - [x] Resolve `noImportantStyles` in `utilities.css` <!-- id: 6 -->
    - [x] Resolve `noImportantStyles` in `markdown.css` <!-- id: 7 -->
    - [x] Verify clean `bun run check` <!-- id: 8 -->


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



