# brief: Convert SCOREBOARD.md to a Blog-Post Asset

**Created:** 2026-07-23
**TD:** (optional)
**Status:** pending

## What

Transform `SCOREBOARD.md` — the "Prometheus Scoreboard" log of User-vs-Agent
match scoring across Seasons 1–2 — into a blog-post draft for later sculpting
and plunder. The raw file is archived; the blog draft distills its best
material into a narrative asset.

## Why

The SCOREBOARD is retired as an operational instrument (replaced by a better
system), but its content is **raw material**, not waste. Season 1's match
history is a vivid log of AI agent discipline failures and recoveries:
"The Strict Compiler," "The Librarian," "Strike One/Two/Three," "False Summit,"
"Premature Victory," "The Polisher." These are named, dated, specific
cautionary tales — exactly the kind of Stuff that compresses into a Thing
worth reading.

A blog post about agent discipline, grounded in real match history, is more
honest than a theoretical post about "AI coding safety." The SCOREBOARD is
the empirical lineage. The blog post is the narrativised bibliography.

## How

1. **Read** `SCOREBOARD.md` (now at `_misc/SCOREBOARD.md` after archiving).
2. **Identify the arc.** Season 1 tells a story: an agent that repeatedly
   declared victory prematurely, got scored by the user, and slowly learned
   to verify before claiming completion. The "Strict Compiler" points
   dominate — `tsc` errors after declaring "Complete." The "Polisher" and
   "Redemption" points show recovery. This is the spine.
3. **Draft** in `_misc/blog-draft-scoreboard.md` using the Shannon Package
   structure from `playbooks/writing-playbook.md`:
   - **tldr** — the compressed assertion (e.g., "Agent discipline is not
     about being smart; it's about running `tsc` before saying 'done'")
   - **content** — the match history narrated as a story, not a table.
     Group by theme (Strict Compiler, False Summit, Polisher) not by date.
   - **narrativised-bibliography** — the SCOREBOARD system itself as a
     tool: what it measured, why it worked, why it was retired.
4. **Voice:** writing voice (per `writing-playbook.md`), not dialog voice.
   Attend to the reader who lacks our context. No inside baseball.
5. **Sculpt later.** This brief produces the raw draft. The sculpting —
   cutting, restructuring, finding the hook — is a separate session.

## Acceptance criteria

- [ ] `_misc/blog-draft-scoreboard.md` exists
- [ ] Draft follows Shannon Package structure (tldr + content + narrated
      bibliography)
- [ ] Voice is writing-voice (attending), not dialog-voice (amusing)
- [ ] Season 1 match history is narrated thematically, not as a table dump
- [ ] The "why the SCOREBOARD was retired" is addressed (the better system)
- [ ] No SCOREBOARD references remain in agent-facing files after archiving

## Out of scope

- **Publishing** — this is draft-only. Sculpting and publishing are later.
- **Designing the replacement system** — that exists already; the blog post
  references it, doesn't design it.
- **The other _misc/ files** — only SCOREBOARD.md is in scope.
