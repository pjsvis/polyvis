# Debriefs Playbook

## Purpose

A debrief is a retrospective created after the completion of a significant
task or milestone. It captures what was **actually** built (not what was
planned), what worked, what didn't, and what we'd do differently. Debriefs
are the **institutional memory** of the project.

**Critical:** Debriefs are **MANDATORY** for all significant changes per the
**Change Management Protocol (CMP)**. A debrief includes verification proof
that changes work as intended.

**Reference:** See `playbooks/change-management-protocol.md` for the full
Plan → Execute → Verify → Debrief cycle.

## File Naming

- **Convention:** `YYYY-MM-DD-[slug].md` (date first, always)
- **Drafting:** You may create `debrief-[slug]-YYYY-MM-DD.md` in the project
  root for visibility during the session.
- **Final Location:** `debriefs/` directory (must be moved before session end).
- **Enforcement:** Run
  `bun run scripts/maintenance/fix-debrief-names/index.ts` to verify/fix naming.

## Template

```markdown
---
date: YYYY-MM-DD
tags: [tag1, tag2, tag3]
---

# Debrief: [Task Name]

**Brief:** briefs/YYYY-MM-DD-brief-[slug].md (if applicable)
**TD:** td-xxxxx (if applicable)
**Status:** Complete

## What we built
One paragraph — what actually shipped, vs. what was planned.

## Accomplishments
- **[Accomplishment 1]:** [Description of what was achieved]
- **[Accomplishment 2]:** [Description of what was achieved]

## Problems
- **[Problem 1]:** [Issue encountered and how it was resolved]

## Architecture decisions that worked
Bullet list with reasoning — which choices paid off under implementation.

## Things we'd do differently
Honest assessment of mistakes and trade-offs. A debrief that says
"everything went perfectly" is useless.

## Design principles validated
Which principles (Edinburgh Protocol, polyvis standards) held up.

## Verification
- Commands run and their output (proof the change works)
- Baseline functionality confirmed unchanged before the new feature

## Files changed
| File | Lines | Purpose |
|------|-------|---------|
| path/to/file.ts | +42 / -7 | [what] |

## Next steps
What's left undone.
```

## Conventions

- **Write it immediately** after the project completes, while details are fresh.
- **Be honest** about failures — documenting them is as important as successes.
- **Be specific** — reference specific files or code patterns, not vague claims.
- **Link back** to the brief and any TD issues.
- **Debriefs are final** — append dated addenda if new information emerges;
  don't edit the original.

## Post-Debrief Checklist

- [ ] **Archive Brief:** Move the completed brief from `briefs/` to
      `briefs/archive/`.
- [ ] **Update Playbooks:** If a lesson implies a process change, update the
      relevant playbook immediately (don't wait).
- [ ] **Update Changelog:** Add a summary to `CHANGELOG.md` under
      `[Unreleased]`.
- [ ] **Update Current Task:** Update `_CURRENT_TASK.md` to reflect completion
      and the next objective.
