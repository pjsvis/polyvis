# Playbook: writing (the Shannon Package)

## Purpose

How we write the assets we produce — README, DEPENDENCIES, playbooks, briefs, decisions, blog. The structure, the voice, and the attitude. This is the constraint stack for documentation, parallel to the Edinburgh Protocol for agent behavior.

## Two voices: dialog and writing

There are two registers, and they do not mix. Conflating them is the dominant failure mode of agent-authored prose.

**Dialog voice** — fluid, amusing, context-rich. The register of two minds with shared history thinking out loud. Banter is load-bearing here: it is how we move fast. This voice is *for us*. It belongs in conversation and handoffs — never in published assets.

**Writing voice** — hardcore Shannonesque, attending, self-contained. The register of prose for strangers who lack our context. It serves the reader; it does not amuse the author. This voice is *for others*. It is what ships: README, DEPENDENCIES, docs, blog.

The Shannon Package is what keeps them separate. The tldr forces self-containment — a point that needs our shared context to decode cannot ship as a tldr. The narrativised-bibliography forces relationships to be spelled out, not alluded to. The structure makes dialog-voice leakage unshippable. It is not only a checksum; it is a voice-enforcer.

**The calibration: attend.** Not noir, not brutal. Noir and brutal are both prose self-regard — noir preens (look at the style), brutal dominates (look at the force). *Attend* is other-regard: the prose pays attention to the reader's lack of context, to the subject, to precision. It is the impartial spectator rendered as prose. The writing voice has personality (precise, dryly witty, compressed) — but personality in service, not in self-amusement. The line is service vs self-regard, not personality vs no-personality. Attending is not bloodless.

**The sequence.** Dialog is upstream of writing. The fluid exploration is where insights are found; the writing is the distillation. Separate the voices, keep the sequence. A wall that kills the generative dialog produces correct, dead prose — its own form of self-amusement.

**The test.** Before shipping prose, ask: does this amuse us, or does it attend to the reader? If it amuses us, it stays in dialog. If it attends, it can ship.

---

## The voice: tldr + content + narrativised-bibliography

Every produced asset is a **Shannon Package** — a doc with a checksum. Three sections, in order:

1. **tldr** — the compressed assertion. The thing, up front. If the reader stops here, they got the point.
2. **content** — the argument / mechanics. The body that earns the tldr.
3. **narrativised-bibliography** — the sources *narrated as relationships*, not listed. Each source/tool earns its place with a stated reason.

The tldr and body are **detection** — redundancy catches inconsistency (the model says X in one place, not-X in another). The narrativised-bibliography is **correction** — it forces a different mode of engagement. You can pattern-match the tldr and body from a biased retrieval, but you can't narrate source relationships without actually encountering the sources. Detection says "these sections don't agree." Correction says "let me look at what the sources actually say." You need both.

Origin: `blog/2026-07-14-shannon-package-and-the-derrida-question.md` (Wodge 6).

## The attitude

- **"We use these tools because they are…"** — every tool/source earns its place with a stated reason. Not a neutral list; a *position*. The reason is the friction it removes.
- **Mac-first is honesty, not bias.** Report what's tested. Don't assert what you haven't verified. Label speculation as speculation.
- **No unsubstantiated speculation in the main body.** The reader's context window is finite; untested per-platform install lines are Stuff that crowds out the Thing (the tested path). Speculation belongs in an appendix, clearly marked "speculative map."
- **Clarity, attitude, honesty — in that order.** Clarity: the reader gets the point fast. Attitude: the doc takes a position (tools earn their place). Honesty: tested vs untested is explicit.

## What to avoid

- **Interminable hedging before the point.** Don't open with meta-description of the doc's interface or a taxonomy of discoverability. Get to the door; the encyclopedia is reference, lower.
- **Reference before the door.** The tested quick path goes first; the per-tool/per-case detail goes after, as the "something's missing" fallback.
- **Universal false claims.** "Works everywhere" (untested) is worse than "works on Mac; elsewhere, try and PR" (scoped, true). A scoped true claim beats a universal false one.
- **A flat bibliography.** A list of tools without reasons is a list you can write without engaging. Narrate the relationships; the narration is the verification.

## Proportionality

The Shannon Package is a tax on speed (three renderings of every point). Proportion it to the cost of error:

- **Heavy** (full tldr + content + narrated bibliography) where claims are empirical, checkable, load-bearing — DEPENDENCIES, decisions, briefs.
- **Light** (tldr + content, bibliography folded in) where claims are argumentative or the doc is a simple pointer — a short README section, a config reference.

Proportion the verification apparatus to the cost of being wrong. That's Hume: proportion belief to evidence, and proportion the checksum to the stakes.

## The re-audit discipline

Tool choice and platform claims are *current justified positions*, not permanent ideologies. "We use these because…" is re-asked at each barnacle review (Decision 007) — pricing inversions flip, tools stop earning their place, platforms get tested. The attitude is a living position, not a brand. (Anti-dogma: even the tool attitude mustn't become ideology.)

## Examples

- **`DEPENDENCIES.md`** — full Shannon Package: tldr (Mac block) + content (quick check, adding-a-dep, stack overview) + narrativised-bibliography (the toolkit, each tool's friction) + appendix (speculative map).
- **`README.md`** — tldr-first (Quick start up top), catalog as content, pointers to the narrated bibliography in DEPENDENCIES.md.

## When not to use the full package

- A one-line config reference — tldr alone is fine.
- A historical record (debrief, decision) — these have their own playbooks; the Shannon Package is for *produced assets the reader acts on*, not retrospectives.
- **Don't perform the structure.** A Shannon Package that's decoration — tldr/body/bibliography pattern-matched without engagement — is a sham (the Shamming Filter, see the source asset). The narrated bibliography is the part that can't be faked: if you can't narrate the sources, you haven't done the work.
