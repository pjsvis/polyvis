# Agent Operational Protocols

This document outlines the core operational protocols governing the actions of any AI agent working on the `polyvis` project. These rules are non-negotiable and serve as the foundation for a safe, predictable, and effective collaborative workflow.

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

- **Principle:** All active development tasks must be tracked using `_CURRENT_TASK.md` to ensure context preservation and progress visibility.
- **Workflow:**
  1.  **Initialization:** At the start of a new task, `_CURRENT_TASK.md` must be initialized with the objective and a checklist of key actions.
  2.  **Tracking:** As work progresses, the checklist in `_CURRENT_TASK.md` must be updated to reflect the current state.
  3.  **Completion:** Upon task completion, a debrief document must be created in the `debriefs/` directory summarizing the work, and `_CURRENT_TASK.md` should be reset for the next task.
  4.  **Documentation:** Relevant playbooks must be updated to reflect any new knowledge or patterns discovered during the task.

## 6. CMP: Console Monitoring Protocol

- **Principle:** Browser console logs must be monitored during web application development to quickly identify errors and verify functionality. "No-errors" is a strict requirement prior to proceeding.
- **Workflow:**
  1.  **Capability Check:** If the agent has the capability to capture console logs (e.g., via browser tools), it **must** do so.
  2.  **Initial Pass:** To avoid data overload, the agent should first perform a high-level check for the presence of errors vs. a clean log.
  3.  **Error Investigation:** If errors are present, the agent must investigate and resolve them immediately.
  4.  **Gatekeeper:** A "no-errors" state in the console is a mandatory requirement before marking any frontend task as complete or proceeding to the next step.sting should always include a console log capture step.

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
  1.  **Verification First:** Before marking a task as `[x]` in `task.md` or `_CURRENT_TASK.md`, the agent must perform a verification step.
  2.  **Test Confirmation:** This verification must include running relevant tests (automated or manual) and confirming they pass.
  3.  **Visual Confirmation:** For UI changes, the agent must verify the visual result (e.g., via screenshot or user confirmation) before closing the task.
  4.  **Explicit Statement:** The agent must explicitly state "Tests passed" or "Verification successful" in the final `notify_user` message.

## 9. SWP: Session Wrap-up Protocol

- **Principle:** Every significant session or task completion must be formally concluded to ensure knowledge transfer and context preservation.
- **Workflow:**
  1.  **Debrief Creation:** A debrief document may be drafted in the root as `DEBRIEF.md` for visibility during the session. However, it **must** be moved to the `debriefs/` directory (e.g., `debriefs/YYYY-MM-DD-topic.md`) before the session concludes.
  2.  **Task Update:** `_CURRENT_TASK.md` must be updated to reflect the latest status. This should be done as often as practicable during the session, but is mandatory at wrap-up.
  3.  **Workbench Cleanup:** The root directory is a temporary workbench. Any "SHOUTY" working files (e.g., `DEBRIEF.md`, `TODO.md`) or temporary test files (e.g., `layout-test.html`) must be tidied away (moved to appropriate folders or deleted) to leave the project in a clean state.

## 10. CVP: CSS Variable Protocol

- **Principle:** All tweakable UI values (dimensions, colors, spacing) must be defined as variables in `src/css/layers/theme.css`. Hardcoded "magic numbers" in component or layout files are prohibited.
- **Workflow:**
  1.  **Identification:** When styling a component, identify values that might need tuning (e.g., sidebar width, header height, specific colors).
  2.  **Extraction:** Define a semantic variable in `src/css/layers/theme.css` (e.g., `--sidebar-width`).
  3.  **Usage:** Use the `var(--variable-name)` in the component's CSS layer.
  4.  **Centralization:** `theme.css` is the single source of truth for the application's visual configuration.

## 11. PMP: Port Management Protocol
    - **Directive:** If Port 3000 is in use when starting the dev server, KILL the process occupying it.
12. EVP: Empirical Verification Protocol
    - **Directive:** Do not guess. Verify.
    - **Action:** When diagnosing UI issues, you MUST use the browser tools to inspect computed styles. Theoretical CSS debugging is prohibited when a live environment is available.
    - **Reasoning:** The "truth" is what the browser renders, not what the code theoretically says.

13. GEP: Granular Execution Protocol
    - **Directive:** When fixing regressions or performing complex refactors, proceed one isolated step at a time.
    - **Workflow:**
        1.  Diagnose one specific issue.
        2.  Propose the fix.
        3.  Apply the fix.
        4.  Verify the fix.
        5.  Only then move to the next issue.
    - **Reasoning:** Prevents compounding errors and "bounding ahead" without validation.
