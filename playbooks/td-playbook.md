# TD Playbook — Solo Workflow

> This playbook defines how to work on the polyvis project using `td` for task management.

---

## Session Startup

At the start of every session:

```bash
just orient    # see branch, git status, last commit
git fetch origin
td usage --new-session   # new session identity
```

---

## Claiming Work

Before editing a file, claim its task:

```bash
td start td-abc123       # start work on a task
td log "started"         # log progress
```

If the task is claimed by another session, comment requesting handover:

```bash
td comment td-abc123 "I'd like to work on this — can you handoff?"
```

---

## Progress Logging

After substantive changes:

```bash
td log "completed phase 1, drafted outline for post X"
```

---

## Pre-Commit Gate

Before every commit:

```bash
just check
```

---

## Ending Work — or Newing Up

Capture context before closing **or newing up**:

```bash
td handoff td-abc123 --done "post drafted and reviewed" --remaining "export and distribute"
td review td-abc123           # submit for review
```

### When to new up instead of ending

A newup is a phase boundary, not a session end. The work continues — the
transcript doesn't. New up when:

- You've completed a logical unit of work and the context is heavy.
- The meter is climbing faster than the work is progressing (*O(n²)* cost).
- The task is **intractable** — persist state, new up, attack with a clean
  slate. A fresh context solves problems a stale one can't, because it isn't
  anchored to its own discarded attempts.

```bash
td handoff td-abc123 --done "phase 1 complete" --remaining "phase 2: integration"
# /new — fresh session
td usage --new-session
td context td-abc123    # resume from compressed handoff
```

The handoff is the lossy compression. The raw transcript is the entropy.
Locus tags (`[LOC:]` / `[WAYPOINT:]`) in the handoff tell the fresh session
which files and milestones matter. Half a dozen newups in a long session is
not excessive — it is the difference between *O(n²)* and *O(n)*.

See `briefs/2026-07-18-brief-session-newup-discipline.md` and
`blog/2026-07-18-token-minimisation.md`.

---

## Branch Hygiene

- **Never commit directly to `main`**
- **Always branch** before starting work: `git checkout -b feat/<name>`
- **One epic per branch** — stack if dependent
- **Run `just check`** before every commit

---

## TD Labels Convention

| Label | Meaning |
|-------|---------|
| `claimed-by:<session>` | Active session working this task |
| `blocked` | Task is blocked, not available |
| `needs-review` | Ready for human review |

---

## Common Commands

```bash
td current              # what you're working on
td list                 # all open tasks
td list --status in_progress   # in-flight tasks
td next                 # highest priority open issue
td context td-abc123    # full context for a task
td ws start "Epic: X"   # start a work session for an epic
td ws tag td-abc123 ... # tag tasks to workspace
td ws end               # end current workspace
```

---

## Related

- `AGENTS.md` — Project identity and coding rules
- `playbooks/development-workflow-playbook.md` — Development workflow and server management