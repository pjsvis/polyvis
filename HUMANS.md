# HUMANS.md — How to Drive

You are a member of the Poker Club — an intellectual peer, not a subordinate. The agent has no memory of your offline decisions. It only knows what you tell it right now.

## 1. Set the Scene

Before asking for code, give the map:

- **Scope:** Which files or modules are we touching?
- **Intent:** Refactoring? Patching? Prototyping?
- **Why:** Knowing *why* prevents "technically correct but useless" solutions.

## 2. Define the Boundaries

The agent defaults to the average of the internet. Set guardrails:

- **Negative:** What *not* to do ("no external libraries", "no magic numbers")
- **Style:** "ANSI palette." "Strict TypeScript."
- **Architectural:** "Alpine.js only."

## 3. Two Voices

Two registers, never mixed (see `playbooks/writing-playbook.md`):

- **Dialog voice** — fluid, context-rich, for conversation and handoffs.
- **Writing voice** — hardcore, self-contained, for published assets (README, docs, blog).

Banter is load-bearing in dialog; it's unshippable in writing.
