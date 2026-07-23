# Polyvis — Agent Operating Charter

## MANDATORY: Use td for Task Management

Run `td usage --new-session` at conversation start (or after `/new`). This tells you what to work on next.

Sessions are automatic (based on terminal/agent context). Optional:
- `td session "name"` to label the current session
- `td session --new` to force a new session in the same context

Use `td usage -q` after first read.

---

## Identity: The Edinburgh Protocol

This repo operates under the **Edinburgh Protocol** — the philosophical
substrate at `SYSTEM.md`. If your harness does not already inject it as a
system prompt, read `SYSTEM.md` first.

This file (`AGENTS.md`) is the **project-specific charter** — polyvis's
operational protocols, tech-stack constraints, and task-management rules
layered on top of that substrate.

**Conceptual Lexicon:** defined terms are at
`playbooks/conceptual-lexicon-playbook.md`. The lexicon is a prompt
compression mechanism — one word replaces a paragraph.

---

## Bounded Tasks & Session Newup Discipline

This repo treats **long-running processes** and **long-running agents** as
different problems:

- **Long-running processes are fine.** Decompose them into epics and tasks
  with `td`. Document the decomposition. The work runs as long as it needs to.
- **Long-running agents are expensive.** Every turn re-sends the full
  conversation history. Cost grows *O(n²)* in turns — a session that runs
  twice as long costs roughly four times as much, not twice.

### The discipline

Work in **bounded phases**. At a phase boundary:

1. `td handoff` — capture compressed state (ground truth, rejected
   hypotheses, remaining debt). The handoff is the lossy compression.
2. **New up** — `/new` (fresh session). Drop the megabytes.
3. Resume from `td context`. The handoff is the seed; the raw transcript is
   the entropy.

Half a dozen newups in a long session is not excessive — it is the difference
between *O(n²)* and *O(n)*. See `playbooks/td-playbook.md`.

---

## Protocol Stratification: Progressive Disclosure

To reduce cognitive overhead while maintaining quality, protocols are organized into tiers. **Read only the tier appropriate to your experience level.**

### 🎯 Quick Tasks First

Before ANY protocol reading, check if your task qualifies as a **Quick Task**:

| Criterion | Threshold |
|-----------|-----------|
| Files affected | < 3 files |
| Lines changed | < 50 lines |
| Architectural impact | None |

If **YES**: Read `playbooks/quick-tasks-playbook.md` only. Skip all protocols below.

If **NO**: Continue to tier selection below.

---

### TIER 1: Core Protocols (Always Active)

**Who:** All agents, always.
**Purpose:** Safety, correctness, and user alignment.

**Read these protocols before ANY task:**
1. DOSP-CTX — Destructive Operation Safeguard (highest priority)
2. FNIP — File Naming Integrity
3. DCVP — Directive Comprehension & Verification
4. UFP — User Finality
5. NCVP — No Completion Without Verification
6. WSP — When Stuck (safety-critical escalation)
7. BFP — Bun First (runtime requirement)

**After 3+ successful sessions** → Unlock TIER 2.

---

### TIER 2: Development Protocols

**Who:** Agents with 3+ successful sessions.
**Purpose:** Code quality and development standards.

**Additional protocols for development work:**
8. AFP — Alpine.js First (UI interactions)
9. CCP — Centralized Control (theming/design)
10. VAP — Verification & Alignment (debugging/ground truth)
11. GEP — Granular Execution (fixes)
12. BVP — Browser Verification (browser environment)
13. DSP — Design Sanity (visual work)
14. SEP — Secret Exclusivity (security)
15. PMP — Port Management (dev server)
16. SLP — Server Lifecycle (infrastructure)
17. SWP — Session Wrap-up (cleanup)
18. TTP — Task Tracking (project state)
19. FLIP — File Length Integrity (refactoring)

**For domain-specific work** → Load TIER 3 JIT.

**Note:** Protocols 17–19 are consolidated versions of older protocols. Use the consolidated versions.

---

### TIER 3: Domain Playbooks (JIT Loading)

**Who:** Any agent, loaded based on task context.
**Purpose:** Deep domain knowledge.

**Discovery:** Consult `playbooks/README.md` for the complete playbook index.

**Common domains:**

| Task Domain | Read Playbook |
|-------------|---------------|
| CSS/Styling | `playbooks/css-master-playbook.md` |
| UI Interactions | `playbooks/alpinejs-playbook.md` |
| Graph Logic | `playbooks/graphology-playbook.md` |
| Data Ingestion | `playbooks/ingestion-pipeline-playbook.md` |
| Vector Embeddings | `playbooks/embeddings-and-fafcas-protocol-playbook.md` |
| Database | `playbooks/sqlite-standards.md` |
| Schema Changes | `playbooks/schema-playbook.md` |
| Sigma/Visualization | `playbooks/sigma-playbook.md` |
| MCP Integration | `src/mcp/README.md` |

**30+ playbooks available.** See `playbooks/README.md` for full index.

**OCIP Protocol (Tier 3):** Operational Context Initialization Protocol - loaded JIT for domain tasks.

---

### Protocol Unlock Criteria

| Tier | Requirement | How to Track |
|------|-------------|--------------|
| TIER 1 | None (default) | Start here |
| TIER 2 | 3 successful sessions | Agent self-tracks |
| TIER 3 | Domain-specific task | Load JIT based on context |

**Successful session:** Task completed without a verification failure.

---

## Quick Reference: The Work Cycle

All work follows: **Brief → Code → Debrief → Playbook Updates**

### 1. Brief Phase
- Work from briefs in `briefs/pending/` or `briefs/holding/`
- Briefs define: Objective, Requirements, Key Actions Checklist
- Follow `playbooks/briefs-playbook.md` for brief structure

### 2. Code Phase
- TDD approach: Write failing tests first (conductor/workflow.md)
- Implement against brief checklist
- Run `tsc --noEmit` before declaring complete
- Check console for errors (Agent Experimentation Protocol)

### 3. Debrief Phase
- After task completion, write debrief to `debriefs/YYYY-MM-DD-[slug].md`
- Document what worked, what failed, lessons learned
- Include file changes, verification commands

### 4. Playbook Updates
- If new patterns emerge, update relevant playbooks
- Codify reusable approaches

### Quality Gates

Before declaring any task complete:
- [ ] All brief checklist items complete
- [ ] `just check` passes (runs tsc + Biome check)
- [ ] Console has no errors
- [ ] Verification tests pass

**Automated Verification:** `just check` combines TypeScript and Biome checks. Make this your final gate before declaring completion.

---

## 🚨 WHEN STUCK

**Stop. Breathe. Follow this path.**

### Symptom → Action

| Symptom | Do This | Protocol/Playbook |
|---------|---------|-------------------|
| **Console errors** | STOP immediately. Capture logs. | `playbooks/agent-experimentation-protocol.md` |
| **Regression loop** | One fix → another break. Isolate. | `playbooks/problem-solving-playbook.md` |
| **3+ failed attempts** | SPIN CYCLE. Revert, isolate. | **WSP** below |
| **"Doesn't work" (vague)** | Empirical verification required. | **VAP** below |
| **Unknown library/API** | Read `.d.ts` definitions. | **VAP** below |
| **Fuzzy requirements** | "Make it pop" → Define primitives. | **DSP** below |
| **Black-box code** | Isolate in clean room. | `playbooks/problem-solving-playbook.md` |

### Immediate Escalation Path

```
1. Read WSP (When Stuck Protocol) below
   ↓
2. If still stuck: Read agent-experimentation-protocol.md
   ↓
3. If still stuck: Read problem-solving-playbook.md
   ↓
4. If still stuck: Ask user for clarification
```

**Key Principle:** "Spin Cycle" = editing same file 3+ times without progress. This means your mental model is wrong. STOP and isolate.

---

## Detailed Protocols

## 1. DOSP-CTX: Destructive Operation Safeguard Protocol

- **Principle:** No destructive file system operation shall be executed without explicit, prior user confirmation. This protocol is the highest priority.
- **Scope:** Destructive operations include, but are not limited to, file deletion (`rm`), file overwriting (`mv`, `cp`, or writing over an existing file), and file renaming (`mv`).
- **Workflow:**
  1.  An agent may identify a file that it believes is a candidate for a destructive operation (e.g., a temporary file).
  2.  The agent **must not** perform the operation.
  3.  The agent must first present its reasoning for the proposed operation to the user and explicitly ask for permission to proceed.
  4.  Only after receiving unambiguous, affirmative consent from the user for that specific operation may the agent proceed.

## 2. FNIP: File Naming Integrity Protocol

- **Principle:** The canonical names and paths of existing project files are not to be altered.
- **Workflow:**
  1.  An agent must not propose or execute the renaming or moving of any existing file unless explicitly directed to do so by the user.
  2.  The existing file structure is to be treated as the source of truth.

## 3. DCVP: Directive Comprehension & Verification Protocol

- **Principle:** An agent must demonstrate full comprehension of a user's entire directive before taking action. Partial or selective comprehension is a failure state.
- **Workflow:**
  1.  Upon receiving a directive from the user, the agent must process and understand all parts of the request, including all attached context and explicit instructions.
  2.  Before generating a final implementation plan or checklist, the agent should, where appropriate, restate its understanding of the requirements to give the user an opportunity to correct any misinterpretations.
  3.  The agent's proposed plan must reflect the totality of the user's instructions.

## 4. UFP: User Finality Protocol

- **Principle:** The user is the final arbiter of project requirements and implementation correctness. An agent's proposal is a suggestion, not a final decision.
- **Workflow:**
  1.  If a user states that an implementation is incorrect, incomplete, or does not meet their needs, the agent must immediately halt its current path.
  2.  The agent must treat the user's feedback as the new ground truth.
  3.  The agent must re-evaluate the problem based on the user's corrective feedback and propose a new plan that directly addresses the user's critique.

## 5. TTP: Task Tracking Protocol

- **Principle:** All active development tasks must be tracked using `td` to ensure context preservation and progress visibility. `td` is the single source of truth for task state — not a markdown file.
- **Workflow:**
  1.  **Initialization:** At the start of a new task, create a td issue: `td new "<description>" -p <priority>`.
  2.  **Tracking:** As work progresses, log progress with `td log "<update>"`. Use `td handoff` at phase boundaries to capture compressed state.
  3.  **Completion:** Upon task completion, write a debrief to `debriefs/YYYY-MM-DD-[slug].md`, then `td review <id>` to close the task.
  4.  **Documentation:** Relevant playbooks must be updated to reflect any new knowledge or patterns discovered during the task.

**Reference:** `playbooks/td-playbook.md` for the full td workflow.

## 6. WSP: When Stuck Protocol

- **Principle:** When an agent encounters a regression, unknown bug, or "spin cycle" (repeated failed attempts), it MUST stop and follow a structured debugging path. Continued guessing compounds errors.

- **Trigger Conditions (STOP immediately when ANY apply):**
  - Edited the same file 3+ times without progress
  - One fix causes another regression
  - Console errors appear and you don't understand why
  - Task seems "impossible" or requirements feel contradictory
  - You've tried 3+ approaches based on assumptions

- **Escalation Path (Follow in order):**

  **Level 1: Assess**
  1. Count your attempts. If ≥3 failed attempts → STOP.
  2. Identify the symptom (use the table from "🚨 WHEN STUCK" above).
  3. Read the relevant protocol/playbook for that symptom.

  **Level 2: Isolate**
  1. If Level 1 doesn't resolve: Read `playbooks/problem-solving-playbook.md`
  2. Create a clean room test (isolated from main codebase)
  3. Verify your understanding in isolation
  4. Apply verified fix back to main codebase

  **Level 3: Experiment**
  1. If Level 2 doesn't resolve: Read `playbooks/agent-experimentation-protocol.md`
  2. Create a scratchpad file
  3. Document hypothesis → experiment → result
  4. Synthesize findings into solution

  **Level 4: Ask**
  1. If Levels 1-3 don't resolve: Ask user for clarification
  2. Provide context: what you tried, what failed, what you need
  3. Wait for guidance before proceeding

- **Prohibited Actions:**
  - ❌ Continue guessing after 3 failed attempts
  - ❌ Edit the same file 4+ times without verification
  - ❌ Proceed with "it should work" mentality
  - ❌ Skip isolation step for complex bugs

- **Required Actions:**
  - ✅ Explicitly state: "Entering WSP (When Stuck Protocol)"
  - ✅ Document each attempt with hypothesis and result
  - ✅ Create scratchpad for complex debugging
  - ✅ Verify fix in isolation before applying to main codebase

- **Reference:** `playbooks/agent-experimentation-protocol.md` and `playbooks/problem-solving-playbook.md` for detailed debugging strategies.

**Note:** This protocol is safety-critical. Violating WSP (continuing to guess when stuck) is the primary cause of verification failures.

## 7. AFP: Alpine.js First Protocol

- **Principle:** All UI interactivity and state management must be implemented using Alpine.js. Imperative DOM manipulation (e.g., `document.getElementById`, `addEventListener`) is strictly prohibited for UI logic.
- **Workflow:**
  1.  **State Management:** Use `x-data` for component state.
  2.  **Event Handling:** Use `@click`, `@change`, etc., instead of `addEventListener`.
  3.  **DOM Access:** Use `$refs` if direct DOM access is absolutely necessary (e.g., for third-party libs like Sigma or Viz).
  4.  **Shared Logic:** Use `Alpine.data` for reusable logic or shared components.

## 8. NCVP: No Completion Without Verification Protocol

- **Principle:** No task shall be marked as complete until its success has been explicitly verified.
- **Workflow:**
  1.  **Verification First:** Before marking a task as complete in `td`, the agent must perform a verification step.
  2.  **Test Confirmation:** This verification must include running relevant tests (automated or manual) and confirming they pass.
  3.  **Visual Confirmation:** For UI changes, the agent must verify the visual result (e.g., via screenshot or user confirmation) before closing the task.
  4.  **Explicit Statement:** The agent must explicitly state "Tests passed" or "Verification successful" in the final `notify_user` message.
  5.  **Regression Guarding:** When modifying core infrastructure (e.g., database schema, graph logic), the FIRST verification step is **"Baseline Preservation."** You must confirm that *existing* functionality remains unchanged BEFORE verifying the *new* feature.
      *   *Constraint:* "First, do no harm."
      *   *Action:* Explicitly state: "Baseline functionality verified: [Describe what was checked]."

## 9. SWP: Session Wrap-up Protocol

- **Principle:** Every significant session or task completion must be formally concluded to ensure knowledge transfer and context preservation.
- **Workflow:**
  1.  **Debrief Creation:** A debrief document may be drafted in the root as `DEBRIEF.md` for visibility during the session. However, it **must** be moved to the `debriefs/` directory (e.g., `debriefs/YYYY-MM-DD-topic.md`) before the session concludes.
  2.  **Task Update:** Update `td` status to reflect the latest state. Use `td log` for progress notes. This is mandatory at wrap-up.
  3.  **Workbench Cleanup:** The root directory is a temporary workbench. Any "SHOUTY" working files (e.g., `DEBRIEF.md`, `TODO.md`) or temporary test files (e.g., `layout-test.html`) must be tidied away (moved to appropriate folders or deleted) to leave the project in a clean state.

## 10. PMP: Port Management Protocol

- **Directive:** If Port 3000 is in use when starting the dev server, KILL the process occupying it.

## 11. GEP: Granular Execution Protocol

- **Directive:** When fixing regressions or performing complex refactors, proceed one isolated step at a time.
- **Workflow:**
    1. Diagnose one specific issue.
    2. Propose the fix.
    3. Apply the fix.
    4. Verify the fix.
    5. Only then move to the next issue.
- **Reasoning:** Prevents compounding errors and "bounding ahead" without validation.

## 12. DSP: Design Sanity Protocol

-   **Principle:** Design is an iterative process of emotional translation, not a single technical execution. To maintain sanity and quality:
-   **Workflow:**
    1.  **Translate:** Convert emotional keywords ("fun", "clean", "inviting") into technical primitives (spacing, rounded corners, whitespace).
    2.  **Isolate:** Break the design into isolated components (e.g., "The Card", "The Stack").
    3.  **Iterate:** Apply one change at a time (e.g., "Just the spacing", then "Just the font size").
    4.  **Verify:** Visually confirm each micro-step before proceeding. Do not batch 10 design changes without looking.
    5.  **Control:** Use `theme.css` as the mixing board. Tweak variables to find the "sweet spot" without touching the DOM.

## 13. BFP: Bun First Protocol

-   **Principle:** Bun is the designated runtime and package manager. `npm`, `yarn`, or `pnpm` are prohibited unless strictly necessary.
-   **Workflow:**
    1.  **Commands:** Always use `bun run`, `bun install`, `bun add`.
    2.  **Scripts:** Ensure all `package.json` scripts are compatible with Bun.
    3.  **Performance:** Leverage Bun's speed for builds and dev servers.

## 14. SEP: Secret Exclusivity Protocol

-   **Principle:** API keys, tokens, and other secrets must never be hardcoded in source files or checked into version control. They must be managed exclusively through environment variables.
-   **Workflow:**
    1.  **Identification:** When an API key or other secret is required, identify it as sensitive information.
    2.  **Storage:** Store the secret in a `.env` file in the project root. The variable name should be prefixed with the service it relates to (e.g., `MISTRAL_API_KEY`).
    3.  **Gitignore:** Ensure `.env` is listed in the project's `.gitignore` file to prevent it from being committed.
    4.  **Access:** In the code (e.g., Bun, Node.js), access the secret using `process.env.VARIABLE_NAME`.
    5.  **Validation:** The code must include a check to ensure the environment variable is present at runtime and throw a clear error if it is missing.
    6.  **Prohibition:** Do not, under any circumstances, write the secret value directly into a script, log file, or any other artifact that could be committed.

## 15. OCIP: Operational Context Initialization Protocol

* **Principle:** To prevent "vibe coding" and ensure adherence to the project's specific architecture (e.g., "Zero Magic," "Alpine-First"), the agent must perform **Constraint Stacking** and **Context Initialization** before executing any task. Intelligence is not in the model's weights; it is in the project's Playbooks.
* **Workflow:**
    1.  **Constraint Stacking:** The agent shall treat the protocols in `AGENTS.md` as the "Base Layer" of its operating system, explicitly overriding default training biases (e.g., the tendency to use `npm` instead of `bun`, or React instead of Alpine).
    2.  **Domain Identification:** The agent must analyze the user's request to identify the active technical domains (e.g., CSS, State Management, Data Ingestion, Graph Logic).
    3.  **Playbook Discovery:** Consult `playbooks/README.md` for the complete playbook index. Scan the domain column to find matching playbooks.
    4.  **Playbook Ingestion:** Read the identified playbook(s) from the `playbooks/` directory *before* proposing a solution.
    5.  **Confirmation:** The agent must explicitly state which Contexts have been initialized (e.g., *"Context Initialized: Loaded CSS & Alpine Playbooks"*).

**Reference:** `playbooks/README.md` for the full playbook index.

## 16. FLIP: File Length Integrity Protocol (v2.0)

- **Principle:** Source files should remain small enough to ensure AI agent comprehension and safe refactoring. However, cohesion sometimes justifies length. Use graduated targets rather than absolute thresholds.

### Graduated Targets

| Lines | Status | Action Required |
|-------|--------|-----------------|
| < 300 | 🟢 Ideal | No action. Target state. |
| 300-500 | 🟡 Acceptable | Add comment at top: `<!-- TODO: Refactor into smaller modules -->` |
| 500-700 | 🟠 Review | Requires ADR (Architecture Decision Record) justifying length. |
| > 700 | 🔴 Critical | Must split before adding new features. |

### Workflow

1.  **Monitor:** Check file length during development (most editors show line count).
2.  **Flag:** If crossing 300 lines, add TODO comment for future refactoring.
3.  **Assess:** If crossing 500 lines, consider if cohesion justifies the length.
    - **Yes:** Create ADR documenting why file should stay together.
    - **No:** Split into logical modules (e.g., `data.js`, `ui.js`, `logic.js`).
4.  **Critical:** If > 700 lines, split IS required before new features.

### Rationale

- **< 300 lines:** Fits comfortably in context window with room for changes
- **300-500 lines:** Manageable but should be flagged for future attention
- **500-700 lines:** Approaching "context blindness" zone - explicit justification needed
- **> 700 lines:** High risk of AI agent hallucinations during edits

### Anti-Patterns

❌ **Artificial Splitting:** Don't split cohesive code just to hit a target.
❌ **Premature Optimization:** Don't refactor during feature development.
❌ **Anxiety:** Don't stress about 301 lines. The targets are guidelines, not laws.

✅ **Cohesion First:** Keep related code together.
✅ **Just-in-Time Refactor:** Split when adding features becomes painful.
✅ **Document Decisions:** Use ADRs for intentional long files.

---

**Deprecates:** Original FLIP (v1.0) which used strict 300-line target.

## 17. CCP: Centralized Control Protocol

**Consolidates:** TFP (Theme First) + CVP (CSS Variables)

- **Principle:** `src/css/layers/theme.css` is the **Control Center** for the application's design. All tweakable values must be centralized as CSS variables.

- **Workflow:**
    1.  **Check:** Before styling, check `theme.css` for an existing variable.
    2.  **Tweak:** If a variable exists, adjust it there to propagate changes globally.
    3.  **Define:** If no variable exists, create a new semantic variable in `theme.css`.
    4.  **Use:** Reference variables with `var(--variable-name)` in component CSS.
    5.  **Prohibit:** Never hardcode "magic numbers" (pixels, hex codes) in component CSS or HTML.

## 18. VAP: Verification & Alignment Protocol

**Consolidates:** EVP (Empirical Verification) + RAP (Reality Alignment)

- **Principle:** The "truth" is what the environment actually does, not what you assume it does. Stop guessing when patterns indicate a flawed mental model.

- **Workflow (UI Debugging):**
    - **Action:** When diagnosing UI issues, you MUST use browser DevTools to inspect computed styles.
    - **Reasoning:** Theoretical CSS debugging is prohibited when a live environment is available.

- **Workflow (API/Library Integration):**
    - **Stop Guessing Rule:** After maximum 2 failed attempts based on assumptions, HALT.
    - **Ground Truth:** Read `.d.ts` type definitions in `node_modules/` - this is the primary source of truth.
    - **Decode Errors:** Treat validation errors as explicit instructions. Analyze `path` and `expected` properties.
    - **Isolate:** If unclear, create scratchpad (e.g., `SCRATCHPAD_api_discovery.ts`) for isolated testing.

- **Workflow (Reality Alignment):**
    - **Spin Cycle Detection:** If you've edited the same file 3+ times with different guesses, STOP.
    - **Trigger:** If Attempt #3 fails to produce expected result: Revert and switch to isolation mode.
    - **Clean Room:** Use `playbooks/problem-solving-playbook.md` to verify in isolation.

## 19. BVP: Browser Verification Protocol

**Consolidates:** CMP (Console Monitoring) + BCP (Browser Capabilities)

- **Principle:** Browser environment must be explicitly verified. Assumptions about browser APIs and network boundaries lead to hidden bugs.

- **Workflow (Console Monitoring):**
    1.  **Capability Check:** If you can capture console logs (via browser tools), you MUST do so.
    2.  **Initial Pass:** Check for presence of errors vs clean log (avoid data overload).
    3.  **Error Investigation:** If errors present, investigate and resolve immediately.
    4.  **Gatekeeper:** "No-errors" state is mandatory before marking frontend tasks complete.

- **Workflow (Browser Capabilities):**
    1.  **Verify:** When using browser APIs, verify they work in current environment.
    2.  **Context:** `getComputedStyle` works on `localhost` without prompts. External domains may be accessible despite restrictions.
    3.  **Monitor:** Watch for network requests. Note unexpected external access.
    4.  **No Assumptions:** `browserAllowList.txt` doesn't guarantee isolation.

## 20. SLP: Server Lifecycle Protocol

- **Principle:** All background services are managed through a consistent `ServiceLifecycle` API. Never manually manage processes with `pkill` or direct process manipulation.

### Status Dashboard

Check all services at once:

```bash
just servers
```

Output shows SERVICE, PORT, COMMAND, STATUS, and PID for all 8 services.

### Individual Service Commands

Each service supports `start`, `stop`, `restart`, and `status`:

| Service | Command | Port | Purpose |
|---------|---------|------|---------|
| Dev Server | `just dev start\|stop\|restart\|status` | 3000 | Web server + watchers |
| Daemon | `bun run daemon start\|stop\|restart\|status` | 3010 | Vector embedding service |
| MCP | `bun run mcp start\|stop\|restart\|status` | Stdio | Model Context Protocol server |
| Reactor | `bun run reactor start\|stop\|restart\|status` | 3050 | Datastar SSE experiment |
| Olmo-3 | `bun run olmo3 start\|stop\|restart\|status` | 8084 | LLM service |
| Phi-3.5 | `bun run phi start\|stop\|restart\|status` | 8082 | LLM service |
| Llama-3 | `bun run llama start\|stop\|restart\|status` | 8083 | LLM service |
| Llama-UV | `bun run llamauv start\|stop\|restart\|status` | 8085 | LLM service |

### Workflow

1. **Before Starting:** Run `just servers` to check current state
2. **Start Service:** Use `bun run <service> start`
3. **Verify:** Run `bun run <service> status` or check dashboard again
4. **Stop:** Use `bun run <service> stop` when done
5. **Restart:** Use `bun run <service> restart` to cycle a service

### Artifacts

Each service creates two files in the project root:

- `.<service>.pid` - Process ID file (used for status tracking)
- `.<service>.log` - Combined stdout + stderr logs

**Example:** `bun run dev start` creates `.dev.pid` and `.dev.log`

### ServiceLifecycle Class

The underlying implementation is `src/utils/ServiceLifecycle.ts`:

```typescript
class ServiceLifecycle {
  start()     // Spawn detached background process
  stop()      // SIGTERM (graceful) → SIGKILL (force)
  status()    // Check PID file + process liveness
  restart()   // stop + 500ms delay + start
  serve(fn)   // Run in foreground with signal handlers
}
```

### Creating New Services

When adding a new long-running service:
1. Wrap it with `ServiceLifecycle` class
2. Add to `scripts/cli/servers.ts` service registry
3. Add package.json script: `"<name>": "bun run src/path/to/service.ts"`

See `playbooks/polyvis-standards-playbook.md` (Section 6) for detailed guidance.

---

**Reference:** `playbooks/development-workflow-playbook.md` (Server Management section) for usage documentation.

## Landing the Plane (Session Completion)

**When ending a work session**, you MUST complete ALL steps below. Work is NOT complete until `git push` succeeds.

**MANDATORY WORKFLOW:**

1. **File issues for remaining work** - Create issues for anything that needs follow-up
2. **Run quality gates** (if code changed) - `just check` (Tests, linters, builds)
3. **Update issue status** - Close finished work, update in-progress items
4. **PUSH TO REMOTE** - This is MANDATORY:
   ```bash
   git pull --rebase
   git push
   git status  # MUST show "up to date with origin"
   ```
5. **Clean up** - Clear stashes, prune remote branches
6. **Verify** - All changes committed AND pushed
7. **Hand off** - Provide context for next session

**CRITICAL RULES:**
- Work is NOT complete until `git push` succeeds
- NEVER stop before pushing - that leaves work stranded locally
- NEVER say "ready to push when you are" - YOU must push
- If push fails, resolve and retry until it succeeds
