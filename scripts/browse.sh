#!/usr/bin/env bash
# scripts/browse.sh — Human doc browser (VEST Protocol)
# Lists docs and playbooks with descriptions so a human can find what
# they need without grep.
set -euo pipefail

echo "═══ polyvis — doc browser ═══"
echo ""

echo "▸ playbooks/"
for f in playbooks/*.md; do
  [ -f "$f" ] || continue
  title=$(head -1 "$f" | sed 's/^#\+ *//')
  printf "  %-45s %s\n" "$(basename "$f")" "$title"
done
echo ""

echo "▸ docs/"
for f in docs/*.md; do
  [ -f "$f" ] || continue
  title=$(head -1 "$f" | sed 's/^#\+ *//')
  printf "  %-45s %s\n" "$(basename "$f")" "$title"
done
echo ""

echo "▸ root agent files"
for f in AGENTS.md CLAUDE.md HUMANS.md README.md WARP.md; do
  [ -f "$f" ] && printf "  %-45s %s\n" "$f" "$(head -1 "$f" | sed 's/^#\+ *//')"
done
echo ""
echo "Use 'just read <file>' to render a file with glow."
