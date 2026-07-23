#!/usr/bin/env bash
# scripts/orient.sh — Agent orientation entry point (VEST Protocol)
# Shows git state, service status, and entry points so a fresh agent
# can understand the project in one command.
set -euo pipefail

echo "═══ polyvis — agent orientation ═══"
echo ""

echo "▸ git"
git log --oneline -5 2>/dev/null || echo "  (not a git repo)"
echo "  branch: $(git branch --show-current 2>/dev/null || echo 'unknown')"
echo ""

echo "▸ services"
if command -v bun >/dev/null 2>&1; then
  bun run servers 2>/dev/null || echo "  (servers script unavailable)"
else
  echo "  (bun not installed)"
fi
echo ""

echo "▸ task memory"
if command -v td >/dev/null 2>&1; then
  td current 2>/dev/null || echo "  (no active task)"
else
  echo "  (td not installed)"
fi
echo ""

echo "▸ entry points"
echo "  just orient       — this screen (agent front door)"
echo "  just browse       — list docs and playbooks (human front door)"
echo "  just check        — pre-commit gate (tsc + biome)"
echo "  just build        — build CSS + JS"
echo "  just dev start    — start dev server + watchers (port 3000)"
echo ""

echo "▸ playbooks"
echo "  playbooks/README.md — full playbook index"
echo "  AGENTS.md           — operational charter (Edinburgh Protocol + protocols)"
echo ""
