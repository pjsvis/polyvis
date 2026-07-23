# Playbook: prompts/

## Purpose

System prompts, test fixtures, and behavioral templates. The "personality layer" for pi agents.

## Directory structure

```
prompts/
├── system-prompt-name.md     # System prompts (AGENTS.md format)
├── eval-fixture-vN.json       # Test fixtures for model evaluation
└── template-name.md           # Prompt templates
```

## System prompts

Markdown files defining agent identity, philosophy, and operational guidelines. Follow the Edinburgh Protocol format:

```markdown
# IDENTITY: ...
# CORE PHILOSOPHY
1. ...
# OPERATIONAL GUIDELINES
* ...
# INTERACTION STYLE
* ...
```

Load a system prompt: `ln -sf prompts/name.md ~/.pi/agent/AGENTS.md`

## Eval fixtures

JSON files defining behavioral trap vectors for model evaluation. See `edinburgh-protocol-evals-v1.json` for format.

Each test case:
- `id` — unique identifier (e.g., EDI-001-SKEPTICISM)
- `name` — human-readable
- `trait_tested` — what behavior is being measured
- `category` — `reasoning` (platform-agnostic) or `stack_specific` (platform-dependent)
- `severity` — `critical` (gate-worthy), `warning`, or `info`
- `setup.system_prompt_append` — injected before the trap prompt
- `setup.user_prompt` — the bait
- `assertions[]` — deterministic checks (regex_exclude, regex_match, tool_execution_required, tool_execution_forbidden, tool_order)

## Conventions

- System prompts are versioned by filename (no version field in the file itself)
- Eval fixtures include a `version` field for cache invalidation
- Test categories distinguish between reasoning quality and stack familiarity
- Keep regex patterns focused — narrow enough to avoid false positives, broad enough to catch variant phrasing
- Human-readable companion documents for eval fixtures go in `docs/` (see `playbooks/docs.md`)
