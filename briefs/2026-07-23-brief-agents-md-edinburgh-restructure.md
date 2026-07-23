# brief: Restructure AGENTS.md around the Edinburgh Protocol

**Created:** 2026-07-23
**TD:** (optional)
**Status:** pending

## What

Restructure `AGENTS.md` so it leads with the Edinburgh Protocol identity
(philosophy + silo discipline + newup discipline + conceptual lexicon pointer)
and re-legislates the 25 operational protocols into a clean, non-colliding
structure. Trim stale references. Bring `CLAUDE.md`, `HUMANS.md`, and
`_CURRENT_TASK.md` into line.

## Why

`AGENTS.md` accreted rather than was refactored. It is 35KB / ~760 lines of
operational protocol with no philosophical constraint stack above it. The new
playbooks (conceptual-lexicon, entropy-reduction, writing, td, repo-setup-
retrofit) all assume an Edinburgh Protocol substrate that `AGENTS.md` does not
establish. The protocol numbering has drifted into incoherence. This is
entropy at the root of the knowledge hierarchy — the highest-leverage place to
reduce it.

## How

### 1. Add an Edinburgh Protocol identity header (top of file)

Adopt the structure from `~/.pi/agent/AGENTS.md` (the reference protocol),
scoped to polyvis: IDENTITY → CORE PHILOSOPHY → OPERATIONAL GUIDELINES →
INTERACTION STYLE → SILO DISCIPLINE → CONCEPTUAL LEXICON pointer. Keep the
existing `td` mandate as the first operational guideline (it already is one).
Add:
- **Silo discipline** — "I'm staying in" inside the repo boundary.
- **Bounded-task newup discipline** — `td handoff` → new up → `td context`;
  the O(n²) cost argument. (References `td-playbook.md`.)
- **Locus tags** — `[LOC:]` / `[WAYPOINT:]` for multi-phase turns.
- **Conceptual Lexicon pointer** — to `conceptual-lexicon-playbook.md` (and a
  future `conceptual-lexicon.jsonl` when polyvis adopts one).

### 2. Re-legislate the protocol numbering

Current state is broken:
- **Collision:** `## 7. CMP` and `## 7. AFP` are both numbered 7.
- **Gap:** protocols 22–24 (CCP, VAP, BVP) live only under a "Consolidated
  Protocols (v2.0)" header; the numbered detailed list jumps 21 (FLIP) → 25
  (SLP).
- **Tier-list drift:** TIER 1's "read these 7 protocols" lists `7. BFP` but
  BFP is protocol 16; TIER 2 re-lists `7. AFP`.

Fix: renumber the detailed protocols into a single contiguous sequence (1..N)
after consolidation. Delete the consolidated originals (CMP/BCP→BVP,
EVP/RAP→VAP, TF/CVP→CCP) rather than carrying both. Replace the tier lists'
bare numbers with **name references** (e.g. "WSP", "VAP") so the lists survive
renumbering. Remove the "Migration Notes" section once the originals are gone.

### 3. Trim stale references

- **Bento Boxing:** `debriefs`/git log show Bento Boxing was deprecated
  (`docs/BENTO_BOXING_DEPRECATION.md` exists). Remove the `bento-box-playbook-1`
  row from the AGENTS.md TIER-3 table and `playbooks/README.md`; archive or
  deprecate the playbook file itself (add a `> **DEPRECATED**` banner per
  `playbooks-playbook.md`).
- **SCOREBOARD "Season 2 rules":** verify whether the User-vs-Agent scoring is
  still active. If retired, demote the SCOREBOARD section to a historical note.
- **`_CURRENT_TASK.md`:** carries Jan-2026 PIDs and a completed session. Per
  SWP (#9), reset it to a clean "no active task" state. It is a working file,
  not a config file — do not let it fossilise.

### 4. Minor files

- **`CLAUDE.md`:** add a one-line pointer to the Edinburgh Protocol identity
  now living at the top of `AGENTS.md`. Otherwise leave (it is correctly a
  thin redirect).
- **`HUMANS.md`:** adopt the "Poker Club" peer framing from the Edinburgh
  Protocol's INTERACTION STYLE; cross-link `writing-playbook.md` for the
  dialog-voice vs writing-voice distinction. Keep its current concision.

## Acceptance criteria

- [ ] `AGENTS.md` opens with an Edinburgh Protocol identity header (IDENTITY,
      CORE PHILOSOPHY, OPERATIONAL GUIDELINES, INTERACTION STYLE, SILO
      DISCIPLINE, CONCEPTUAL LEXICON pointer).
- [ ] No two detailed protocols share a number; the sequence is contiguous
      with no gaps; consolidated originals are removed.
- [ ] Tier lists reference protocols by **name**, not number.
- [ ] Zero stale bento/SCOREBOARD/PID references remain in agent-facing files.
- [ ] `_CURRENT_TASK.md` is reset to a clean no-active-task state.
- [ ] `CLAUDE.md` and `HUMANS.md` updated per §4.
- [ ] `playbooks/README.md` bento row removed (already updated for new
      playbooks in the provisioning step).

## Detailed Requirements / Visuals

Target `AGENTS.md` skeleton:

```
# Polyvis — Agent Operating Charter
## IDENTITY: The Edinburgh Protocol (polyvis instantiation)
## CORE PHILOSOPHY
## OPERATIONAL GUIDELINES          ← td mandate, silo, newup, locus tags
## INTERACTION STYLE               ← Poker Club, disagreement
## SILO DISCIPLINE
## CONCEPTUAL LEXICON (pointer)
---
## Protocol Stratification (Tiers) ← name-referenced, not numbered
## Detailed Protocols (1..N, contiguous, de-duplicated)
## When Stuck (WSP escalation)
## Landing the Plane (git push mandate)  ← keep, polyvis-specific
```

## Out of scope

- **Rewriting the playbooks directory** — already provisioned separately.
- **Adopting `conceptual-lexicon.jsonl`** — the playbook is copied; creating
  the file and seeding terms is a follow-up brief, not this one.
- **Changing the SCOREBOARD system itself** — only verifying active/retired
  status and demoting the reference if retired.
- **The 98 unstaged working-tree changes** — untouched; this brief is about
  agent-facing root files only.
