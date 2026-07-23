# Playbook: Conceptual Lexicon

## Purpose

The Conceptual Lexicon (CL) is the registry of defined terms used across the Edinburgh Protocol system. It is **not a glossary** — it is a **prompt compression mechanism**. Each term compresses a complex instruction or concept into a phrase the agent recognizes across sessions. One word replaces a paragraph. Fewer tokens, less instruction variance, more consistency.

The CL lives at `conceptual-lexicon.jsonl` (repo root, append-only JSONL). The protocol prompt (`SYSTEM.md`) and agent config (`AGENTS.md`) reference it; they do not contain it inline.

## When to add a term

Add a term to the CL when **all three** conditions are met:

1. **It compresses.** The term replaces a paragraph of instruction. If you can define it in one sentence and it doesn't save tokens by being referenced, it doesn't belong in the CL — it belongs in a doc.

2. **It's cited.** The term is used in briefs, prompts, playbooks, or evals. A term that nobody cites is entropy. The CL is not a place for terms you *might* use someday.

3. **The agent recognizes it.** The term is understood from context without a formal definition lookup. The formal definition *sharpens* understanding — it doesn't *create* it. If the term requires the agent to look it up every time, it's not compressed enough.

## What makes a good CL term

**One word or a short phrase.** "Wrap-up" (one word). "No muppets" (two words). "The moat question" (three words). If the term is a paragraph, it's not a term — it's a section.

**Carries weight.** The term encodes a behavioral instruction, a concept, or a measurement. "Wrap-up" encodes "summarize + persist + note remaining + close phase." "Predictably adequate" encodes "not enhancement, floor rises not ceiling, variance compresses, 22/24 deployable." One phrase, paragraph of meaning.

**Has a test of validity.** When the term is used in a prompt, does the agent do the right thing without explicit instruction? If yes, the term works. If the agent does something different each time, the term isn't compressed enough — the context doesn't carry the meaning.

**Anti-ceremony.** Don't add terms that are ceremony. A term that doesn't compress, isn't cited, or isn't recognized is entropy, not anti-entropy. The CL should stay thin. Every term earns its place.

## Categories

| Category | Description | Examples |
|---|---|---|
| `instruction-compression` | One-word instructions the agent recognizes | wrap-up, proceed, opinion |
| `concept` | Core ideas the protocol depends on | stuff into things, predictably adequate, decorated stuff |
| `metaphor` | Shorthand for complex positions | pizza shop, chip pan fire, edge-lord |
| `gate` | Decision points in a process | the moat question, the Derrida question, no muppets |
| `measurement` | Terms tied to eval data | normalisation, delta, adequacy threshold |

## How to add a term

1. Check it compresses (replaces a paragraph).
2. Check it's cited (or will be cited immediately).
3. Append to `conceptual-lexicon.jsonl` at the repo root — one line, valid JSON.
4. Use it in a prompt, brief, or playbook the same day. If it doesn't get cited, remove it.

```bash
# Add a term (append one line)
echo '{"term":"new-term","definition":"...","category":"concept","created":"2026-07-17","protocol_version":"1.1.0"}' >> conceptual-lexicon.jsonl

# Verify it parses
cat conceptual-lexicon.jsonl | jq 'select(.term == "new-term")'
```

## How not to use the CL

- **Don't add terms speculatively.** "This might be useful someday" is not a criterion. Add terms when they're cited.
- **Don't add terms that are just labels.** "The eval" is a label, not a compression. It doesn't replace a paragraph.
- **Don't duplicate definitions.** If a term is defined elsewhere (a playbook, a decision), reference it — don't redefine it.
- **Don't let the CL grow unbounded.** If a term hasn't been cited in 30 days, it's probably entropy. Consider removing it.

## Relationship to the protocol prompt

The protocol prompt references the CL file. It does not contain the definitions inline. This means:

- The protocol prompt stays short (fewer tokens per session).
- The CL grows independently of the protocol (new terms don't bloat the prompt).
- Scripts can query the CL (the preflight audit checks whether cited terms resolve).
- The CL is append-only (no rewriting the protocol when a term is added).

## Relationship to briefs and evals

Briefs and evals cite CL terms. The citation should resolve — if a brief says "apply the wrap-up directive," the term "wrap-up" should exist in the CL. The preflight audit (future) checks this: it scans briefs/evals for cited terms and verifies they resolve in the CL. Unresolved citations are flagged as entropy (the brief references something undefined).

## Versioning

Terms evolve. If a definition changes:
1. Don't rewrite the existing line (append-only).
2. Add a new line with the updated definition and `"supersedes": "old-term-id"`.
3. Mark the old line with `"superseded": true` (edit the existing line — this is the one exception to append-only, and it's a flag, not a rewrite).

This preserves history while keeping the current definition queryable.
