# Briefs Directory

Active briefs ready for development work.

## Structure

```
briefs/
├── pending/          # Active briefs ready to work on
└── README.md         # This file

archive/
└── briefs/           # Completed briefs (have corresponding debriefs)
```

## Convention

- Briefs use `YYYY-MM-DD-brief-[slug].md` naming (date first, matches debriefs convention)
- Briefs are created in `pending/` when work begins, moved to `briefs/` root when active
- When a brief is completed, its debrief is written to `debriefs/YYYY-MM-DD-[slug].md`
- After debriefing, move the brief to `archive/briefs/`

## Workflow

1. **Create Brief:** Add to `briefs/pending/` using the template from `playbooks/briefs-playbook.md`
2. **Execute Work:** Follow the brief's checklist
3. **Debrief:** Write debrief to `debriefs/YYYY-MM-DD-{slug}.md`
4. **Archive:** Move brief from `pending/` to `archive/briefs/`

## Quick Status Check

Run `bun run map-briefs` to see:
- Which briefs are completed (have debriefs)
- Which briefs are pending (no debriefs)
- File organization status

## Reference

- **Brief Creation:** `playbooks/briefs-playbook.md`
- **Debrief Writing:** `playbooks/debriefs-playbook.md`
- **Task Tracking:** `td` (run `td current`)
