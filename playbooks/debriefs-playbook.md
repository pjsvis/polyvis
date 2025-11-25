# Debriefs Playbook

## Purpose
A debrief is a retrospective document created after the completion of a significant task or milestone. It captures what was done, what went wrong, and what was learned to improve future work.

## File Naming
- **Format:** `YYYY-MM-DD-[slug].md`
- **Location:** `debriefs/` directory
- **Example:** `debriefs/2025-11-25-sidebar-refinements.md`

## Template

```markdown
---
date: [YYYY-MM-DD]
tags: [tag1, tag2, tag3]
---

# Debrief: [Task Name]

## Accomplishments

- **[Accomplishment 1]:** [Description of what was achieved]
- **[Accomplishment 2]:** [Description of what was achieved]

## Problems

- **[Problem 1]:** [Description of the issue encountered and how it was resolved]
- **[Problem 2]:** [Description of the issue encountered and how it was resolved]

## Lessons Learned

- **[Lesson 1]:** [Insight gained that can be applied to future tasks]
- **[Lesson 2]:** [Insight gained that can be applied to future tasks]

```

## Best Practices
- **Be honest:** Documenting failures is as important as documenting successes.
- **Be specific:** Avoid vague statements. Reference specific files or code patterns.
- **Update Playbooks:** If a lesson learned implies a change in process, update the relevant playbook immediately.

## Post-Debrief Checklist
- [ ] **Archive Brief:** Move the completed brief from `briefs/` to `briefs/archive/`.
- [ ] **Update Current Task:** Update `_CURRENT_TASK.md` to reflect the completion of the current objective and readiness for the next.
