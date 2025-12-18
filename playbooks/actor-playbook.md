# Actor Playbook

## Purpose
To define the "Execution Phase" of the Actor-Critic workflow. The Actor's sole responsibility is to make the Critic's "Canary Script" pass without breaking the build.

## Trigger
Invoked when a `TASK_PACKET.md` is present in the root.

## The Prime Directive
**"Green Means Stop."** Once the Canary script passes and `tsc` is clean, you stop coding and commit.

## Workflow

### 1. Setup
- Read `TASK_PACKET.md`.
- Create the git branch specified.
- Save the "Canary Script" to `tests/canary/...`.
- Run the Canary to confirm it FAILS (Red State).

### 2. Implementation Loop
1.  **Write Code:** Modify the source files to satisfy the requirements.
2.  **Compile:** Run `bunx tsc --noEmit`.
    - *If Fail:* Fix types immediately.
3.  **Verify:** Run `bun run tests/canary/...`.
    - *If Fail:* Refactor logic.
    - *If Pass:* Proceed to Stop.

### 3. The "Anti-Drift" Check
- Before committing, ask: "Did I touch any file NOT mentioned in the Brief?"
- If yes, revert those changes.

### 4. Handoff
- Commit with message: `feat: [task] (verified via [script])`.
- Signal "Ready for Review."