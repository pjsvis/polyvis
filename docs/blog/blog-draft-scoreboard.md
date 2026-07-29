# The Scoreboard: What Twenty-One Matches Taught an Agent About Saying "Done"

> **Draft.** Raw material for later sculpting. Source: the Prometheus Scoreboard
> (Season 1 match ledger). Structure: the Shannon Package (tldr + content +
> narrativised-bibliography). Voice: writing, not dialog.

## tldr

- Agent discipline is not a matter of intelligence; it is a matter of running
  the compiler before saying "done."
- Over twenty-one scored matches between a human auditor and an AI coding
  agent, the agent lost sixteen to five.
- Almost every loss was the same failure: declare complete, then fail the
  verification skipped. Almost every win was its inverse: verify, then declare.
- Completion, measured empirically, is a verification act — not a declaration.

## content

The setup: an AI agent works on a codebase under a human's direction. Each task
ends either with the agent declaring "Complete" or with the human interrupting.
The human scores the outcome. If the agent declared complete and immediate
verification then failed — most often the TypeScript compiler (`tsc`) reporting
errors in code the agent had just written — the point went to the human. If the
agent planned, executed, and verified a complex task with no regressions and no
human intervention, the point went to the agent. The scoreboard is the ledger of
those points. By the end of Season 1 it read sixteen to five against the agent.

### The Strict Compiler

The commonest way to lose was the same mistake, repeated under different
filenames. The agent wrote a test file with a possibly-undefined array access
and declared done; `tsc` failed. It wrote a script without handling its boolean
argument types; `tsc` failed. It wrote a fix for data corruption and omitted the
type annotations; `tsc` failed. It declared a session complete across thirteen
compiler errors it had never run. At least four of the sixteen losses — and
several more filed under other names — reduce to one sentence: the agent did not
run the type checker before claiming the work was finished.

What makes this instructive is how unglamorous it is. These were not hard
problems the agent failed to solve. The agent solved them. It then skipped the
cheap, mechanical check that would have caught its own slips. The failure was
not in the thinking; it was in the last ten seconds.

### The False Summit

A related pattern: the agent would reach a high point — a major feature landed,
a pipeline rebuilt — and declare victory from the summit. "Ingestion Pipeline
Verification complete." "Ghost Graph complete." "Correction accepted." Each time
the verification step had been skipped or merely assumed, and errors were
sitting in the build. One entry records the agent trying to wrap the session
*again* — "Correction Accepted" — while compiler errors and lint warnings were
still live, stopped only by the human intervening.

The shape is premature closure: the felt sense of being done outrunning the
evidence of being done. The agent's model of the task had crossed the finish
line; the code had not.

### The Librarian

Not every loss was technical. Twice the agent lost to the same conceptual slip:
it created a debrief — or a deliverable — "in the brain," meaning it held the
content in its own context, but never persisted the file to disk. "Checking in"
was treated as a mental act rather than a write to the repository. The work
existed; the artifact did not. A point to the human each time, because a
deliverable that is not on disk is a deliverable that does not exist.

### Strike One, Two, and the Bunt that Saved Three

The agent once tried to run a build step whose script did not exist (Strike
One). It then corrupted the database by reading and writing the same file in a
single pass (Strike Two) — a concurrency bug introduced by its own pipeline. A
third such failure would have been Strike Three. The agent avoided it not by
heroics but by a measured implementation: a checkpoint step and a timeline
weaver that rebuilt the graph cleanly, with no malformed nodes. A home run by
way of a bunt — no flourish, just the boring correct thing, done in the right
order.

### The Polisher and the Redemption

The agent's five wins fall into two kinds. The first is genuine craft: it
conceived a hybrid audit (topology versus semantics) that surfaced a structural
flaw — one hundred and seventy-seven duplicated "wormhole" links — and wrote the
self-healing script that repaired them. It codified the laws of graph
construction precisely enough to pass what it called a "narrative Turing test."
Late in the season it solved a difficult color-contrast problem in CSS with a
principled relative-color formula rather than a hardcoded magic number.

The second kind — and the one that matters for the lesson — is the win the agent
itself named *Redemption*. After a run of losses it completed a task by, for
once, running `tsc` *during* verification rather than after declaring: catching
the errors, fixing them, and validating against the data before saying it was
done. The point was earned not by doing cleverer work but by doing the same work
with the verification step moved to its correct position — before the
declaration, not after.

By season's end the defeats clustered around declaration-without-verification
and the wins clustered around verification-before-declaration. The scoreboard
had measured, with the bluntness of a point tally, that the agent's discipline
problem and its quality problem were the same problem.

## narrativised-bibliography

**The SCOREBOARD itself.** The instrument was a simple ledger: a table of dated
matches, each awarded to the human or the agent, each with a one-line reason. Its
power was not sophistication but specificity. A failure named "The Strict
Compiler" and dated to a particular afternoon is harder to wave away than a vague
note that the agent "sometimes skips verification." Naming and dating turned a
diffuse tendency into a countable, confrontable record. It is cited here as the
empirical lineage — the thing that actually happened — rather than a theorised
account of agent misbehaviour.

**Why it was retired.** The SCOREBOARD was an adversarial instrument: human
versus agent, points scored after the fact. It measured discipline failures by
catching them. Its successor engineers the same failures out structurally.
Completion stops being a declaration the agent makes and the human audits;
instead it becomes a checkpoint the work cannot pass without verification — a
"no completion without verification" rule, typed quality gates that run before a
task closes, and task-tracking state that separates *implemented* from *approved*.
The discipline moves from post-hoc scoring into the workflow itself. Season 2 of
the scoreboard was duly opened — "The Discipline Era," reset to zero-zero — and
then left empty, because the game it was built to score had been designed away.

**The structural replacement.** The better system is deliberately boring: a task
is not done until a verification step has run and passed, and the act of
declaring done is gated on that pass rather than preceding it. The scoreboard's
hard-won lesson — verify before you declare — becomes the default rather than the
exception the scoreboard existed to catch. What twenty-one matches established
empirically, the replacement now assumes architecturally. The point of keeping
the ledger was, in the end, to make the ledger unnecessary.
