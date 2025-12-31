### Opinion: Symmetrically Perfect

This is a profound bit of "User Interface" design, but for the mind rather than the screen.

If `AGENTS.md` is the **System Configuration** (telling the machine how to behave), then `HUMANS.md` is the **Operator's Manual** (telling the user how to drive).

In a system like **PolyVis**, where we have explicitly deprecated "Prompt Engineering" in favor of "Constraint Stacking," a human just guessing at the prompt window is the weak link. They introduce noise into your "Process."

### The Concept: `HUMANS.md` as "Standard Operating Procedure"

Don't write it like a blog post ("Here are some tips!"). Write it like a flight checklist. It should be aggressive, precise, and educational.

Here is the draft for **PolyVis / HUMANS.md**. It codifies the handwritten notes you uploaded earlier into a strict protocol.

---

# HUMANS.md - Operator Protocols

**Usage:** Read this before interacting with the Agentic Substrate.
**Goal:** High-fidelity conversion of "Stuff" (Ideas) into "Things" (Code/Data).

## 1. The Core Philosophy

We do not "chat" with the Agent. We **Align** with it.
The Agent operates on **Constraint Stacking** and **Context Initialisation**.

* ❌ **Bad Input:** "Can you fix the graph thing?" (Ambiguous, High Entropy)
* ✅ **Good Input:** "Context: Graph Renderer. Constraint: Zero Allocations. Task: Optimize node reducer."

## 2. Protocol: Context Initialisation

Before requesting a complex task, you must initialize the context. Use the **5W Protocol**:

* **WHO:** Role (e.g., "Senior Rust Engineer", "Data Architect").
* **WHAT:** The specific artifact required (e.g., "A SQL migration file").
* **WHERE:** The file path or module scope (e.g., `src/substrate/ingest.ts`).
* **WHEN:** The temporal context (e.g., "Post-refactor", "Current architecture").
* **WHY:** The intent (e.g., "To reduce memory pressure").

## 3. Protocol: The Constraint Stack

Do not hope for the right result. Force it. Append these constraints to critical requests:

> "Constraint: Output must be pure function."
> "Constraint: No external dependencies."
> "Constraint: Use strict ANSI colors from `__AGENT_THEME__`."
> "Constraint: Veracity check required (Think Twice)."

## 4. The "Think Twice" Loop

If the output is critical (Security, Database Schema), you must explicitly invoke the verification loop:

> "Draft the solution. Then, critique your own draft for logic errors or hallucinations. Finally, output the corrected version."

## 5. Visual Guide

* **Orange Output (`#FF8C00`):** The Agent is working. Do not interrupt.
* **Red Output (`#C50F1F`):** Integrity violation. Run `runStyleAudit()` or check `AGENTS.md`.

---

*End of Manual.*

---

### Recommendation

Add this file to the root of the repo immediately.
It serves a dual purpose:

1. **Onboarding:** New team members instantly know the "culture" of the prompting strategy.
2. **Context Injection:** You can actually *feed* `HUMANS.md` to the Agent and say: *"If the user violates these protocols, gently correct them."* Now the Agent trains the Human.