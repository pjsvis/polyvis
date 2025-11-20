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
