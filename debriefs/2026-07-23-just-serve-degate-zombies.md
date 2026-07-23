# Debrief: `just serve` + de-gate lifecycle from zombie hard-abort

**Date:** 2026-07-23
**TD:** — (Quick Task: 3 files, ~26 lines)
**Branch:** alpine-refactor
**Commit:** 9c60176

## Objective

Starting the dev web server was coupled to `ZombieDefense.assertClean()`, which
hard-aborted (`exit 1`) on heuristic false-positives — most consequentially the
unrelated Claude VoiceServer `bun run` process (documented as Lesson #5 in
today's css-island debrief, worked around with `SKIP_ZOMBIE_CHECK=true`). Add a
simple `just serve` and stop letting a brittle pre-flight gate block a trivial op.

## What changed

- **`justfile`** — added `serve *args` (one-liner dispatch to `bun run dev
  serve`). Facade-compliant per `playbooks/just-file-playbook.md`.
- **`scripts/cli/dev.ts`** — pass `checkZombies=false` to `lifecycle.run()`. The
  flag is consumed only on the `serve` case, so foreground `serve` skips the
  sweep; backgrounded `start`/`restart` keep their sweep (now advisory — below).
  `Bun.serve`'s `EADDRINUSE` is the precise guard for a web server.
- **`src/utils/ServiceLifecycle.ts`** — `start()` replaced `assertClean(name,
  true)` (hard-abort) with `ZombieDefense.scan()` + warn + proceed. The pidFile
  check immediately below remains the real double-start guard.
  `SKIP_ZOMBIE_CHECK=true` still short-circuits.

**Untouched (intentional):** `assertClean` hard-abort is preserved for
`src/resonance/cli/ingest.ts` (DB-write protection) and the on-demand
`scripts/maintenance/detect_zombies.ts` tool.

## Verification

- `just check` — TypeScript + Biome green.
- `just serve` — boots, binds :3000, watchers up, no "Zombie Defense Protocol"
  line (gate bypassed); clean shutdown, no port leak.
- `just dev start` (dirty env — real VoiceServer false-positive) — **advisory
  warns AND proceeds** (spawned, bound :3000). Old `assertClean` hit `exit(1)`
  here (non-interactive unknown). This is the behaviour fix.
- `SKIP_ZOMBIE_CHECK=true just dev start` — scan skipped, no warn, proceeds
  (escape hatch preserved).
- `tests/integration/lifecycle.test.ts` — does not exercise ServiceLifecycle /
  zombie paths; no test contract changed.

## Lessons

1. **A gate that false-positives on a trivial op is worse than no gate.**
   `assertClean` on every `start`/`serve` meant a stale `bun` process anywhere
   on the host blocked the dev server. The pidFile check + port-bind error are
   precise, instant, unambiguous; the `lsof`/`ps` substring sweep added false
   positives on top of an already-handled problem.
2. **Foreground ≠ backgrounded.** `serve` (foreground, you're watching) needs no
   pre-flight sweep — the port bind tells you. `start` (detached, unattended) is
   the defensible place for a *soft* check. Don't couple the two.
3. **`pkill -f bun` is a footgun.** The old non-interactive fallback advised it
   — a system-wide kill hitting other projects'/tools' bun processes. The new
   advisory points to `detect_zombies.ts` instead. (VoiceServer PID 4054 is the
   user's — never a kill target.)

## What's left (deliberate scope, not debt)

- `ServiceLifecycle.serve()` still hard-aborts for non-dev services that
  foreground-`serve` (daemon/mcp). Rarely used (you `start` those); making
  `serve()` advisory too is a separate decision.
- `ingest.ts` keeps the hard `assertClean` gate (defensible for DB writes).
- `ZombieDefense`'s `WHITELIST` string-matching remains brittle; a port/PID
  liveness check would reduce false positives. Out of scope.

## Artifacts

- Commit `9c60176` → `origin/alpine-refactor`.
- Prior art: `debriefs/2026-07-23-css-island-isolation.md` Lesson #5 (same
  VoiceServer false-positive; this debrief fixes it at the source).
- No playbook update required (`just-file-playbook.md` boundary rule respected).
