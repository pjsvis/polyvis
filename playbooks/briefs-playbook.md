# Briefs Playbook

## Purpose

Project briefs define the **what** and **why** before any code is written. Each
brief is a self-contained specification for a single feature, refactor, or
tool. A brief is a contract between the user and the agent: it ensures
alignment before work begins, and it **freezes** when the work starts —
changes go in the debrief, not back into the brief.

Reference: `playbooks/change-management-protocol.md` for the full
Plan → Execute → Verify → Debrief cycle.

## File Naming & Location

- **Format:** `YYYY-MM-DD-brief-[slug].md` (date first, always — matches the
  debriefs convention)
- **Location:** `briefs/` directory
  - **Drafting:** `briefs/pending/` while awaiting work
  - **Active:** moved to `briefs/` root when work starts
  - **Archive:** moved to `briefs/archive/` after the debrief is written
- **Example:** `briefs/2026-07-23-brief-self-organising-database.md`

## Template

```markdown
# brief: [Short descriptive title]

**Created:** YYYY-MM-DD
**TD:** td-xxxxx (optional)
**Status:** pending | in-progress | complete

## What
One-paragraph summary of the feature.

## Why
Motivation — what problem does this solve?

## How
Implementation approach. High-level, not line-by-line.

## Acceptance criteria
- [ ] [Verifiable completion condition 1]
- [ ] [Verifiable completion condition 2]
- [ ] [Verifiable completion condition 3]

## Detailed Requirements / Visuals
[Optional: detailed descriptions, ASCII art layouts, or specific constraints]

## Out of scope
What we explicitly are NOT building (to prevent scope creep).
```

## Conventions

- **Assign a date and slug** as soon as the brief is created.
- **Link the corresponding TD issue** when one exists.
- **Update status** as work progresses.
- **Briefs are not living documents** — they freeze when the project starts.
  Mid-project changes are recorded in the debrief, not retroactively edited
  into the brief.
- **Keep briefs under 2KB.** If it's longer, split it into multiple briefs.
- **Use checklists** so progress is trackable inside the brief itself.
- **Be visual** — ASCII art or diagrams for layout changes.

## Lifecycle

```
draft (pending/) → in-progress (briefs/) → complete
                                                   │
                                                   └─► debriefs/YYYY-MM-DD-[slug].md
                                                          + brief → briefs/archive/
```
