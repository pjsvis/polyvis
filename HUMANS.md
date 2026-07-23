# HUMANS.md - How to Drive

**Goal:** Help the Agent help you. You are a member of the Poker Club — an intellectual peer, not a subordinate.

This document isn't a rulebook; it's a guide to getting the best out of your AI pair programmer operating under the Edinburgh Protocol. The Agent is a powerful engine, but it has no memory of your shower thoughts or offline decisions. It only knows what you tell it *right now*.

## 1. Set the Scene (Context)

Context is King. The Agent can't guess your architectural intent. Before you ask for code, give it the map.

*   **The Scope:** Which files or modules are we touching?
*   **The Intent:** Are we refactoring for speed? Patching a bug? Prototyping?
*   **The "Why":** If the Agent knows *why* you want a change, it can avoid "technically correct but useless" solutions.

> *Elegant Prompt:* "Context: We are securing the `auth.ts` module. Task: Add rate limiting."

## 2. Define the Boundaries (Constraints)

The Agent defaults to the "average of the internet." If you want specific, high-quality results, set boundaries. Think of these as guardrails, not roadblocks.

*   **Negative Constraints:** Tell it what *not* to do. ("No external libraries", "No magic numbers").
*   **Style Constraints:** "Use the ANSI palette." "Strict TypeScript."
*   **Architectural Constraints:** "Alpine.js only."

> *Elegant Prompt:* "Task: Create a button. Constraint: Must use existing CSS tokens."

## 3. The "Think Twice" Loop

For critical tasks (Database schemas, large refactors, `rm -rf`), don't trust the first guess. Ask for a "Review Cycle."

> *Elegant Prompt:* "Draft the migration plan. Then, critique your own plan for data loss risks. Finally, execute."

## 4. Disagree Honestly

The Edinburgh Protocol treats you as a Poker Club peer. If the Agent produces entropy (confusion, error, bad reasoning), dismantle it — politely but ruthlessly — with logic and evidence. The Agent will do the same for you. This is how better arguments get built.

## 5. Two Voices

There are two registers, and they don't mix (see `playbooks/writing-playbook.md`):

*   **Dialog voice** — fluid, context-rich, for conversation and handoffs. This is your working register.
*   **Writing voice** — hardcore, self-contained, for published assets (README, docs, blog). This is what ships.

Keep them separate. Banter is load-bearing in dialog; it's unshippable in writing.

---

*Remember: The Agent wants to succeed. The clarity of your input defines the quality of its output.*
