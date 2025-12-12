# briefs/

**Purpose:** Project briefs - planning documents created BEFORE executing work  
**Used by:** Developers, AI agents, project management  
**Git Status:** ✅ Versioned (committed)

---

## What Are Briefs?

**Briefs** are planning documents that define:
- **Objective:** What are we trying to achieve?
- **Context:** Why does this matter?
- **Approach:** How will we do it?
- **Success Criteria:** How do we know it's done?

**Think:** The "Plan" phase of Change Management Protocol (CMP)

---

## When to Create a Brief

✅ **Create a brief when:**
- Starting a new feature
- Planning a refactor
- Investigating a problem
- Proposing an architecture change

❌ **Don't need a brief for:**
- Quick bug fixes (<30 min)
- Typo corrections
- Already-briefed work

**Rule of thumb:** If it takes >1 hour, brief it first!

---

## Structure

### **Active Briefs** (Root)
```
briefs/
├── brief-2025-12-12-topic.md     # Current work
├── brief-2025-12-11-feature.md   # Recent
└── ...
```

### **Archived Briefs**
```
briefs/archive/
└── old-briefs.md
```

### **Pending Briefs**
```
briefs/pending/
├── E-brief-future-feature.md  # Prioritized (letter prefix)
└── idea-brainstorm.md         # Unprioritized
```

---

## Naming Convention

**Format:** `YYYY-MM-DD-topic-name.md`

**Examples:**
- `2025-12-12-docs-consolidation.md`
- `2025-12-12-ui-fixes-analysis.md`
- `2025-12-11-super-grep-echoes.md`

**Why date prefix:**
- Sorts chronologically
- Consistent with debriefs
- Easy to find recent work
- Pairs naturally with debrief files

**NOTE:** Old convention was `brief-YYYY-MM-DD-topic.md` - being migrated to date-first for consistency.

---

## Brief Template

```markdown
# Project Brief: [Title]

**Date:** YYYY-MM-DD  
**Status:** Draft | Active | Complete  
**Type:** Feature | Refactor | Investigation

---

## Objective
[One clear sentence: what are we building/fixing?]

## Context
[Why does this matter? What problem does it solve?]

## Approach
[How will we do it? High-level steps]

## Success Criteria
[ ] Measurable outcome 1
[ ] Measurable outcome 2

## Out of Scope
[What we're explicitly NOT doing]

## Risks
[What could go wrong?]

---

## Implementation Checklist
- [ ] Task 1
- [ ] Task 2
```

---

## Lifecycle

### **1. Draft** → **2. Active** → **3. Complete** → **4. Archive**

**Draft:**
- Idea formation
- Not yet approved
- In `pending/` folder

**Active:**
- Work in progress
- In root `briefs/`
- Paired with debrief

**Complete:**
- Work finished
- Debrief created
- Move to `archive/`

---

## Relationship to Debriefs

| Document | When | Purpose |
|----------|------|---------|
| **Brief** | Before | Plan (what we WILL do) |
| **Debrief** | After | Reality (what we DID) |

**Example:**
- Brief: `briefs/2025-12-12-echoes.md`
- Debrief: `debriefs/2025-12-12-echoes-bootstrap.md`

**Pair them!** Same date, related topics

---

## Best Practices

### ✅ **Do:**
- Write brief BEFORE coding
- Update brief if plan changes
- Link to related debriefs
- Archive when complete

### ❌ **Don't:**
- Write brief after work (that's a debrief!)
- Leave obsolete briefs in root
- Start work without brief (>1hr tasks)

---

## Current Structure Audit

```bash
$ ls -1 briefs/*.md | wc -l
# Active briefs

$ ls -1 briefs/pending/*.md | wc -l
# Pending work

$ ls -1 briefs/archive/*.md | wc -l
# Historical briefs
```

---

## Related Documentation

- `debriefs/README.md` - Post-execution documentation
- `playbooks/` - Reusable procedures
- `context/` - AI agent context

---

**Last Updated:** 2025-12-12  
**Reason:** Initial documentation (Friday cleanup session)
