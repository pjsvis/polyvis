# Playbook: Repo Setup & Retrofit

> **The one-liner for the visiting agent:** point me at a repo, I'll review it,
> propose a retrofit plan, and carry it out using the Edinburgh Protocol and
> `td`. You approve the plan; I do the work in bounded phases.

---

## What this playbook does

An agent given this playbook and a target repo (new or existing) will:

1. **Review** the repo's current state — what's there, what's missing.
2. **Propose** a retrofit plan — what to add, what to change, what to leave.
3. **Carry out** the plan using `td` for task tracking and the Edinburgh
   Protocol for behavioural constraints, in bounded phases with handoffs.

The agent does not copy this repo wholesale. This repo is a *reference
implementation*, not a template. The structure (briefs, decisions, debriefs,
playbooks) is a consequence of the workflow, not the starting point. The
starting point is `AGENTS.md` + `td` + a `justfile`. Everything else follows
from the work.

---

## The four layers

A retrofitted repo has four layers, in order of importance:

### 1. Identity — `AGENTS.md`

The constraint stack. This is the Edinburgh Protocol: Hume's skepticism, Smith's
systems thinking, Watt's pragmatism. It tells the agent who it is, how it
behaves, and where the boundaries are.

**Minimum viable `AGENTS.md`:**

```markdown
# MANDATORY: Use td for Task Management

Run td usage --new-session at conversation start (or after /clear).
Use td usage -q after first read.

## <Project-specific rules here>
```

**Full version:** symlink `prompts/edinburgh-protocol.md` as `AGENTS.md`, or
write a project-specific one that references it. See this repo's `AGENTS.md`
for the worked example — it includes silo discipline, the bounded-task newup
discipline, and project-specific exceptions.

### 2. Task memory — `td`

Agent task memory. Tracks session state, issues, handoffs. This is what makes
bounded phases possible — `td handoff` is the lossy compression that survives
the newup.

```bash
td usage --new-session   # every session start
td start <id>            # claim work
td handoff <id>          # capture state at phase boundary
td context <id>          # resume from handoff after newup
```

### 3. Entry points — `justfile`

Two commands every retrofitted repo needs:

```just
orient:
    # Agent orientation: git state, td status, entry points
    @git log --oneline -5
    @td current

browse:
    # Human doc browser: list docs with descriptions
    @find . -name "*.md" -not -path "./.git/*" | head -50
```

`just orient` is the agent's front door. `just browse` is the human's. If the
repo has more structure (docs, playbooks), expand these. If it doesn't, these
two are enough to start.

### 4. Structure — the four directories

These are **implementation details**, not prerequisites. They emerge from the
work. Don't create them all upfront. Create them when the work demands them:

| Directory | When it appears | What goes in it |
|-----------|----------------|-----------------|
| `briefs/` | When a feature needs a spec before code | The what and why. Frozen when work starts. |
| `decisions/` | When an architectural choice needs to be recorded | The invariant constraints. Numbered, permanent. |
| `debriefs/` | When a brief completes and lessons need capturing | What happened vs. what was planned. |
| `playbooks/` | When a procedure is repeated enough to codify | How-to guides. Validated steps. |

A new repo needs none of these on day one. An existing repo may already have
equivalents (a `docs/` folder, a `ADR/` folder, a wiki). The retrofit plan
maps what exists to this structure — it doesn't bulldoze it.

---

## The retrofit procedure

### Phase 1: Review (read-only)

The agent reviews the target repo without making changes:

```bash
cd <target-repo>
git log --oneline -20          # recent history
ls -la                         # top-level structure
cat AGENTS.md 2>/dev/null      # existing identity?
cat justfile 2>/dev/null       # existing entry points?
td status 2>/dev/null          # existing task memory?
```

The agent reports:
- **What exists** — structure, tooling, documentation.
- **What's missing** — which of the four layers are absent.
- **What's already there but named differently** — e.g. `docs/` instead of
  `briefs/`, a wiki instead of `decisions/`.

### Phase 2: Propose (read-only)

The agent proposes a retrofit plan as a brief:

```bash
td add "Propose repo retrofit plan" --priority P2
td start <id>
```

The plan states:
- **What to add** — usually `AGENTS.md`, a minimal `justfile`, `td` init.
- **What to map** — existing structure → the four directories (if applicable).
- **What to leave** — things that work and don't need changing.
- **What to defer** — the four directories, created when the work demands them.

The human approves, modifies, or rejects the plan.

### Phase 3: Execute (bounded phases)

The agent carries out the approved plan using `td` and the Edinburgh Protocol:

1. Create a task per retrofit item.
2. Work in bounded phases — `td handoff` at each boundary.
3. New up between phases if the context is heavy or the task is intractable.
4. Commit per item with semantic commit messages.
5. `td review` when the work is complete.

```bash
td add "Add AGENTS.md with Edinburgh Protocol" --priority P1
td add "Add minimal justfile with orient/browse" --priority P1
td add "Init td in repo" --priority P1
td start <id>
# ... work ...
td handoff <id>
# /clear — new up
td context <id>
# ... continue ...
td review <id>
```

### Phase 4: Verify

```bash
just orient    # does the agent front door work?
just browse    # does the human front door work?
td current     # is task memory functioning?
```

A fresh session should be able to run `just orient` and understand the project.

---

## What not to do

- **Don't copy this repo's content wholesale.** The briefs, decisions, and
  playbooks in this repo are specific to this repo's history. A retrofitted
  repo grows its own.
- **Don't create all four directories upfront.** Empty directories are entropy.
  Create them when the work demands them.
- **Don't replace existing structure that works.** If the repo has a `docs/`
  folder that serves as `briefs/`, map it — don't rename it.
- **Don't skip the handoff.** Bounded phases without handoffs are just short
  sessions. The handoff is what makes the newup safe.

---

## The bounded-task newup discipline

This playbook's phases are bounded by design. Each phase is a logical unit of
work. Between phases, the agent hands off and new up:

- `td handoff` captures the compressed state.
- `/clear` or a fresh session drops the accumulated transcript.
- `td context` resumes from the handoff.

This is not optional. A retrofit that runs as a single long session is the
*O(n²)* trap — the cost grows quadratically while the work grows linearly. See
`briefs/2026-07-18-brief-session-newup-discipline.md` (the $46 lesson) and
`blog/2026-07-18-token-minimisation.md`.

The locus tags (`[LOC: file]` / `[WAYPOINT: milestone]`) help the fresh session
navigate the prior phase's work. Use them when a phase spans multiple files or
concerns.

---

## Related

- `AGENTS.md` — the repo's identity and operational guidelines
- `playbooks/td-playbook.md` — td workflow including newup discipline
- `prompts/edinburgh-protocol.md` — the constraint stack
- `decisions/015-bounded-context-entry.md` — bounded context as default entry
- `blog/2026-07-18-token-minimisation.md` — why newup matters
