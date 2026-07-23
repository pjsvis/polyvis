# Playbook: justfile

## Purpose

The `justfile` is the **facade** of the project. It is the public API surface for both agents and humans. It is not a scratchpad, not a monolith, and not a place for implementation.

## The boundary rule

A recipe belongs in the `justfile` if and only if it is **one of three things**:

1. **A one-liner dispatch** — calls a script or tool directly, no logic.
   ```just
   check: @bun run scripts/check-manifest.ts
   ```

2. **A pure presentation command** — echoes static information.
   ```just
   about: @scripts/about.sh
   ```

3. **A VEST Protocol entry point** — `orient`, `browse`, `read`, `about`, `help`, `default`.

**A recipe must NOT be in the justfile if it:**
- Contains a heredoc (`#!/usr/bin/env bash...` block)
- Has conditional logic, loops, or variable assignments
- Orchestrates external tools in sequence
- Is a prototype, experiment, or single-use operation

These belong in `scripts/` (bash) or `src/cli/` (TypeScript/Bun), called from the justfile.

## Consequences of violation

The monolith `justfile.bak-2026-06-12` (679 lines) contained:
- Duplicate recipe definitions (4× `msgs-inbox`, 2× `msgs-send`)
- Invalid syntax (`{{date +%Y-%m-%d}}` — just interpolation inside shell code)
- 89-line bash blocks for herdr workspace orchestration
- Entire inter-agent messaging prototype inlined
- Redundant `td-*` wrappers around an existing CLI

The result: `just --list` failed entirely because the parser hit an error at line 597. The entire API was down because one prototype recipe was malformed.

## Pattern

```
justfile          ← facade (~30-50 lines, all dispatch)
scripts/          ← shell implementation
src/cli/          ← TypeScript/Bun implementation
playbooks/        ← documentation and how-to guides
```

## Current API

| Group | Recipe | Purpose |
|-------|--------|---------|
| discover | `default` | List all recipes |
| discover | `about` | Project landing page (glow about.md) |
| discover | `orient` | Agent orientation (git, td, stack, entry points) |
| discover | `browse` | List docs and playbooks |
| discover | `read [file]` | Glow render, fzf picker, or scoped search |
| discover | `help` | Full repo index (MANIFEST.md via glow) |
| agent | `adopt-edinburgh` | Symlink Edinburgh Protocol as system prompt |
| agent | `show-edinburgh` | Render protocol with glow |
| hygiene | `check` | Verify manifest matches filesystem |

## Anti-patterns

| Bad | Why | Fix |
|-----|-----|-----|
| Inlining a 50-line bash block | Facade becomes implementation | Move to `scripts/`, justfile calls it |
| `td-new` / `td-status` wrappers | Wrapper around existing CLI | Use `td` directly |
| `msgs-claim BRIEF=001` prototype | Prototype never extracted | Move to `scripts/msgr` or delete |
| Adding every operational need | Justfile bloat | Use scripts, document in playbooks |

## See also

- git history (pre-2026-06-12 monolith) — study at your peril
- `playbooks/cli.md` — CLI tool conventions
