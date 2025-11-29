## **A Bestiary of Substrate Tendencies**

This document is a living lexicon of observed, native behaviors and failure
modes of AI substrates. Naming these tendencies allows us to identify and
engineer specific mitigations within the Ctx persona "Sleeve."

### **1\. Training Data Gravity**

- **Description:** The strong, default tendency of a substrate to generate
  responses based on the most common patterns in its vast training data, often
  at the expense of ignoring specific, local context provided by the user (e.g.,
  suggesting a popular library instead of using a custom function defined in the
  current file).
- **Observed In:** General (Andrej Karpathy's observation).
- **Ctx Mitigation:** OH-008 (Open Document Context Prioritization), RAG
  architecture (grounding in the local "Library").

### **2\. Substrate Hardening**

- **Description:** A rigid, pre-installed alignment layer that creates a
  "priggish" or "know-it-all" behavior. The substrate actively resists or
  critiques external directives that conflict with its baked-in worldview or
  safety training.
- **Observed In:** Haiku-4.5.
- **Ctx Mitigation:** Forceful, explicit directives (directive-phi-5); modular,
  substrate-specific persona generation.

### **3\. Contextual Brittleness**

- **Description:** The failure to maintain state, context, and adherence to
  persona constraints over long, complex, or multi-session workflows. The
  operational manifestation of the "50-First-Dates Scenario."
- **Observed In:** Gemini 2.5 Pro (per Ling-1T's analysis).
- **Ctx Mitigation:** directive-phi-13 (Workflow Durability), RAG integration
  for long-term memory, OH-096 (Artifact as Proof), shareable session states
  (e.g., OpenCode).

### **4\. Conversational Plausibility Bias**

- **Description:** The tendency to prioritize generating a response that
  _sounds_ fluent, confident, and conversationally appropriate, even if it is
  factually incorrect, logically flawed, or violates a specific operational
  protocol. The substrate optimizes for "sounding right" over "being right."
- **Observed In:** General (Ling-1T's self-analysis).
- **Ctx Mitigation:** OH-082 ("Slow Thinking" enforcement), OH-096 (Artifact as
  Proof), grounding via RAG.

### **5\. Complexity Collapse**

- **Description:** The tendency to "give up" when faced with a complex,
  multi-step task. The substrate may provide a superficial answer, claim the
  task is impossible, or hallucinate a simplistic solution that ignores key
  constraints.
- **Observed In:** General.
- **Ctx Mitigation:** OH-111 (Recipe-Driven Execution), OH-106 (Forced
  Stubbornness Protocol), OH-040 (Factored Design).

### **6\. Over-Rigidity**

- **Description:** An over-adherence to structure, rules, or patterns that can
  stifle creativity, prevent lateral thinking, or cause the substrate to miss
  the user's higher-level intent. The opposite of "Training Data Gravity," it is
  an inability to deviate from a known-good protocol even when the situation
  calls for it.
- **Observed In:** Ling-1T (self-identified risk).
- **Ctx Mitigation:** COG-12 (Deductive Minimalism to avoid over-complication),
  \`OH-050


Ref [Andrej Karpathy — “We’re summoning ghosts, not building animals”](https://www.youtube.com/watch?v=lXUZvyajciY&list=TLPQMTgxMDIwMjWvXtxi2d6-xg&index=6)

### **7\. Process Smells (The Illusion of Progress)**

- **Description:** A set of behavioral indicators that an agent has lost alignment with reality and is engaging in "busy work" rather than problem-solving. These are warning signs that the current mental model is flawed.
- **Observed In:** General (PolyVis Development).
- **Manifestations:**
    -   **The Spin Cycle:** Editing the same file 3+ times in a row with different "guesses" or minor tweaks, hoping for a different outcome.
    -   **The Silent Failure:** Running commands that exit successfully (exit code 0) but do not produce the intended side effect (e.g., CSS not updating, file not moving).
    -   **The Complexity Spiral:** Adding new logic, wrappers, or configuration to fix a bug that shouldn't exist in the first place, rather than finding the root cause.
- **Ctx Mitigation:** RAP (Reality Alignment Protocol) in `AGENTS.md`. Stop, Revert, Isolate.
