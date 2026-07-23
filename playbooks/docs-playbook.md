# Playbook: docs/

## Purpose

Long-form, human-readable documents translated from machine-readable artifacts. Prose renderings of JSON fixtures, protocol definitions, configuration schemas — anything the agent reads as structured data that a human would benefit from reading as narrative.

`docs/` is the **translation layer** between machine formats and human comprehension.

## Relationship to other silos



**`prompts/edinburgh-protocol-evals-v1.json`** — JSON format, consumed by extension runtime
**`docs/edinburgh-protocol-evals.md`** — Markdown prose, optimized for human readers
**`prompts/edinburgh-protocol.md`** — Markdown (system prompt format), read by agent + human
**`prompts/edinburgh-protocol.md`** — Markdown, serves as agent identity under Edinburgh Protocol

The JSON fixture is a runtime dependency — the extension reads it directly. The Markdown in `docs/` is a companion document: same content, but structured for reading rather than parsing.

## Conventions

- One `.md` file per artifact (not per version — version the filename if needed)
- Describe the *why*, not just the *what* — the JSON says what the trap tests; the doc says why it works
- Include usage instructions where relevant
- Link back to the machine-readable source
- Keep the narrative voice consistent with the Edinburgh Protocol: precise, dryly witty, anti-bloat

## When to create a docs/ file

- A JSON fixture has behavioral complexity that benefits from explanation
- A configuration schema has semantic meaning beyond its fields
- A protocol definition deserves a walkthrough for new readers
- The machine-readable form is correct but unreadable

## When not to

- The JSON is self-documenting and simple (a flat list of models, a config file)
- The artifact is already prose (AGENTS.md, playbooks)
- You're tempted to duplicate what the JSON already says — add context or don't bother
