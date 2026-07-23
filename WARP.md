# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Quick Start

**First Time?** Run `just orient` for a full orientation screen, or read `AGENTS.md` for the operational charter. The TL;DR:
- This is a neuro-symbolic graph visualizer built with Bun, Alpine.js, and SQLite
- Operates under the **Edinburgh Protocol** — see `AGENTS.md` identity header
- Protocols are stratified into 3 tiers (quick tasks → core protocols → domain playbooks)
- **MANDATORY: Use Bun, not npm** (`bun run` commands only)

**Development Server:**
```bash
just dev start            # Start dev server + CSS/JS watchers (port 3000)
just servers              # Check all service statuses
```

**Stop Server:**
```bash
just dev stop
```

---

## Essential Commands

### Development Workflow

| Command | Purpose |
|---------|---------|
| `just orient` | Agent orientation (git, services, task memory, entry points) |
| `just dev start` | Start dev server + watchers (port 3000) |
| `just dev stop` | Stop dev server |
| `just dev status` | Check dev server status |
| `just servers` | Status dashboard for all services |
| `just check` | Run TypeScript + Biome checks (quality gate) |

### Building & Testing

| Command | Purpose |
|---------|---------|
| `bun run build:css` | Build CSS once |
| `bun run build:js` | Build JS once |
| `bun run watch:css` | CSS watcher (runs via dev server) |
| `bun run watch:js` | JS watcher (runs via dev server) |
| `bun run check` | Run Biome check (lint + format) |
| `bun run format` | Auto-format with Biome |
| `bun test` | Run unit tests (Bun's built-in test runner) |

**Running Individual Tests:**
```bash
bun test tests/unit/schema.test.ts                    # Single test file
bun test --watch tests/unit/schema.test.ts           # Watch mode
bun test tests/                                       # All tests in directory
```

### Data Pipeline

| Command | Purpose |
|---------|---------|
| `bun run build:data` | Rebuild database from source files |
| `bun run daemon start` | Start vector embedding service (port 3010) |
| `bun run mcp start` | Start Model Context Protocol server |
| `bun run inspect-db` | Debug database contents |

### Backend Services

All services follow the same lifecycle pattern: `start`, `stop`, `restart`, `status`.

| Service | Command | Port | Purpose |
|---------|---------|------|---------|
| Dev Server | `bun run dev [cmd]` | 3000 | Web server + CSS/JS watchers |
| Daemon | `bun run daemon [cmd]` | 3010 | Vector embedding service |
| MCP | `bun run mcp [cmd]` | Stdio | Model Context Protocol server |
| Reactor | `bun run reactor [cmd]` | 3050 | Datastar SSE experiment |
| Olmo-3 | `bun run olmo3 [cmd]` | 8084 | LLM service |
| Phi-3.5 | `bun run phi [cmd]` | 8082 | LLM service |
| Llama-3 | `bun run llama [cmd]` | 8083 | LLM service |
| Llama-UV | `bun run llamauv [cmd]` | 8085 | LLM service |

**Service Artifacts:** Each service creates `.<name>.pid` and `.<name>.log` in project root.

**View Logs:**
```bash
tail -f .daemon.log        # Tail daemon logs
grep "error" .dev.log      # Search for errors
```

---

## Architecture Overview

### Core Philosophy: "Zero Magic"
- **No build complexity:** Bun + Tailwind CLI (no webpack/vite)
- **No framework overhead:** Alpine.js for reactivity, no React/Vue
- **No runtime services for dev:** Static HTML + SQLite in browser (via sql.js)
- **No magic numbers:** All CSS values are semantic variables in `src/css/layers/theme.css`

### Project Structure

```
├── public/                 # Static web root (NEVER commit generated CSS here)
│   ├── explorer/           # Sigma.js graph explorer
│   ├── resonance.db        # SQLite database (generated locally)
│   └── css/                # Build output (gitignored)
│
├── src/                    # Application source
│   ├── core/               # Graph processing (EdgeWeaver, VectorEngine)
│   ├── resonance/          # Data layer (DB schema, embeddings)
│   │   ├── db.ts           # ResonanceDB class (typed SQLite wrapper)
│   │   ├── schema.ts       # Schema definitions & migrations
│   │   └── services/       # Embedder, Tokenizer
│   ├── pipeline/           # Data ingestion (Ingestor)
│   ├── utils/              # ServiceLifecycle, Logger, Validators
│   └── css/                # CSS source files
│       └── layers/         # Layered CSS architecture
│           └── theme.css   # The Control Panel (all design tokens)
│
├── scripts/                # CLI tools & data pipeline
│   ├── cli/                # User-facing commands (dev, servers, etc.)
│   ├── pipeline/           # ETL scripts
│   └── verify/             # Debug utilities
│
├── playbooks/              # 30+ operational playbooks (indexed in README.md)
├── briefs/                 # Task briefs (pending/ and holding/)
├── debriefs/               # Retrospective documents
│
├── AGENTS.md               # Protocol hierarchy (TIER 1/2/3)
├── polyvis.settings.json   # Central configuration
└── tsconfig.json           # Path aliases defined here
```

### Key Architectural Patterns

#### 1. Database: "Hollow Nodes"
- **Schema Version:** 5 (see `src/resonance/schema.ts`)
- **Core Tables:** `nodes`, `edges` (FTS removed in v5)
- **Hollow Pattern:** Node content stored in filesystem, DB only has metadata + embeddings
- **Why:** Reduces DB size, keeps source files as source of truth
- **Access:** Use `ResonanceDB` class (typed wrapper), not raw SQLite
- **⚠️ CRITICAL:** NEVER use `readonly: true` - WAL mode requires ReadWrite even for readers (to update `-shm` file)

```typescript
// Always use ResonanceDB wrapper
import { ResonanceDB } from "@src/resonance/db";
const db = new ResonanceDB("public/resonance.db");
```

#### 2. Vector Search: "FAFCAS Protocol"
- **Model:** `all-MiniLM-L6-v2` (384 dimensions)
- **Normalization:** L2-normalized vectors (unit length)
- **Storage:** Raw bytes in BLOB column
- **Search:** Pure dot product (cosine similarity for unit vectors)
- **Speed:** <10ms per query, 85% accuracy
- **No Chunking:** Documents are already chunk-sized (~550 words avg)

#### 3. CSS Architecture: "The Control Panel"
- **Source:** `src/css/layers/theme.css` is the single source of truth
- **Protocol:** NEVER hardcode pixels/colors in components
- **Pattern:** Define semantic variable → use `var(--name)` everywhere
- **Build:** Tailwind v4 CLI compiles to `public/css/app.css` (gitignored)
- **Rule:** Do NOT commit static CSS to `public/` (causes "zombie code")

```css
/* Good: Use semantic variables */
.card { background: var(--surface-panel); border: var(--border-base) solid var(--surface-hover); }

/* Bad: Magic numbers */
.card { background: #f5f5f5; border: 1px solid #ccc; }
```

#### 4. UI: "Alpine First"
- **State:** Use `x-data` for component state
- **Events:** Use `@click`, `@change` (NEVER `addEventListener`)
- **DOM:** Use `$refs` only for third-party libs (Sigma, Viz)
- **Shared Logic:** Use `Alpine.data()` for reusable components
- **Why:** Declarative, no imperative DOM manipulation

#### 5. Imports: Path Aliases (NOT Relative)
- **Rule:** NO relative imports beyond current directory
- **Aliases:** Defined in `tsconfig.json` and recognized by Bun

```typescript
// Good: Path aliases
import { ResonanceDB } from "@src/resonance/db";
import settings from "@/polyvis.settings.json";
import { EdgeWeaver } from "@scripts/core/EdgeWeaver";

// Bad: Relative imports
import { ResonanceDB } from "../../src/resonance/db";
```

**Available Aliases:**
- `@src/*` → `src/`
- `@scripts/*` → `scripts/`
- `@resonance/*` → `src/resonance/`
- `@/*` → Project root

#### 6. Services: "ServiceLifecycle" Pattern
All long-running services use unified management via `ServiceLifecycle` class:
- **Detached Processes:** Run in background, survive terminal close
- **PID Files:** Track process state (`.service.pid`)
- **Log Files:** Capture output (`.service.log`)
- **Graceful Shutdown:** SIGTERM → wait → SIGKILL
- **Central Dashboard:** `bun run servers` shows all services

---

## Quality Gates

**Before ANY code is complete:**
1. Run `bun run precommit` (TypeScript + Biome)
2. No console errors in browser (for UI changes)
3. Tests pass (if modifying tested code)
4. Visual verification (for UI changes)

**Automated Check:**
```bash
bun run precommit
```

This runs:
- `tsc --noEmit` (TypeScript type checking)
- `biome check .` (linting + formatting)

---

## Critical Protocols

### Port Management
- **Dev Server:** Port 3000 (default)
- **If Port 3000 Busy:** Use `bun run dev restart` to kill and restart
- **Manual Kill:** `lsof -ti:3000 | xargs kill -9` (last resort)

### File Length Limits (FLIP Protocol)
- **< 300 lines:** ✅ Ideal
- **300-500 lines:** 🟡 Add TODO comment for future refactor
- **500-700 lines:** 🟠 Requires Architecture Decision Record (ADR)
- **> 700 lines:** 🔴 MUST split before new features
- **Why:** Prevents AI "context blindness" during edits

### When Stuck (WSP Protocol)
**STOP if any of these apply:**
- Edited same file 3+ times without progress
- One fix causes another regression
- Console errors and you don't know why
- 3+ failed attempts based on assumptions

**Escalation Path:**
1. Read `AGENTS.md` → Protocol 6 (WSP)
2. If stuck: Read `playbooks/agent-experimentation-protocol.md`
3. If stuck: Read `playbooks/problem-solving-playbook.md`
4. If stuck: Ask user

### Secrets Management (SEP Protocol)
- **NEVER** hardcode API keys in source
- **Storage:** `.env` file (gitignored)
- **Access:** `process.env.VARIABLE_NAME`
- **Validation:** Check existence at runtime

---

## Common Development Patterns

### Database Access Pattern
```typescript
import { DatabaseFactory } from "@src/resonance/DatabaseFactory";
import settings from "@/polyvis.settings.json";

// Standard connection (ReadWrite REQUIRED for WAL mode)
const db = DatabaseFactory.connectToResonance();
// DO NOT use { readonly: true } - causes disk I/O errors in WAL mode!

// Do work...

// Always close
db.close();
```

### Vector Search Pattern
```typescript
import { VectorEngine } from "@src/core/VectorEngine";
const engine = new VectorEngine(db);  // Pass Database object, not string path

const results = await engine.search("your query", 10);
```

### Testing Pattern (Bun Test)
```typescript
import { describe, test, expect, beforeEach, afterEach } from "bun:test";

describe("Feature Name", () => {
  let db: ResonanceDB;
  
  beforeEach(() => {
    db = new ResonanceDB(":memory:");
  });
  
  afterEach(() => {
    db.close();
  });
  
  test("should do something", () => {
    expect(result).toBe(expected);
  });
});
```

---

## Domain Playbooks

**30+ playbooks available** in `playbooks/` directory. Always consult `playbooks/README.md` for the complete index.

**Most Common:**
- **CSS/Styling:** `playbooks/css-master-playbook.md`
- **Alpine.js:** `playbooks/alpinejs-playbook.md`
- **Database:** `playbooks/sqlite-standards.md`
- **Graph Logic:** `playbooks/graphology-playbook.md`
- **Vector Embeddings:** `playbooks/embeddings-and-fafcas-protocol-playbook.md`
- **Problem Solving:** `playbooks/problem-solving-playbook.md`
- **When Stuck:** `playbooks/agent-experimentation-protocol.md`

**Discovery Pattern:**
1. Check task domain (CSS? Database? Graph?)
2. Open `playbooks/README.md`
3. Scan domain column
4. Read matching playbook BEFORE coding

---

## Session Workflow

### Starting Work
1. Check current status: `bun run servers`
2. Start dev server: `bun run dev start`
3. Open browser: `http://localhost:3000`
4. Check for active brief: `briefs/pending/` or `_CURRENT_TASK.md`

### During Work
- Make incremental changes
- Verify in browser (no console errors)
- Run `bun run precommit` frequently

### Ending Session
1. Run all quality gates
2. Stop services: `bun run dev stop`
3. Clean up root workbench files
4. Update `_CURRENT_TASK.md`
5. Write debrief to `debriefs/YYYY-MM-DD-topic.md`

---

## Anti-Patterns (DO NOT DO)

❌ **Use npm or yarn** → Always use `bun`
❌ **Use `readonly: true` for database connections** → Breaks WAL mode, causes disk I/O errors
❌ **Commit `public/css/app.css`** → This is build output (gitignored)
❌ **Hardcode colors/pixels in CSS** → Use variables from `theme.css`
❌ **Use `addEventListener` in UI code** → Use Alpine.js directives
❌ **Relative imports across directories** → Use path aliases
❌ **Edit same file 3+ times without progress** → Read WSP protocol
❌ **Skip `bun run precommit`** → This is the quality gate
❌ **Use string paths with VectorEngine** → Pass Database object
❌ **Guess at library APIs** → Read `.d.ts` type definitions
❌ **Commit without testing** → Run verification first

---

## Environment Requirements

- **Bun:** v1.0+ (MANDATORY - enforced by preinstall hook)
- **Node:** v22.x (for compatibility)
- **TypeScript:** v5.9.3
- **OS:** macOS (primary), Linux (supported)

**Path Aliases Work In:**
- TypeScript compilation
- Bun runtime
- Test files
- Build scripts

---

## Important Files

| File | Purpose | Notes |
|------|---------|-------|
| `AGENTS.md` | Protocol hierarchy | Start here, 3-tier system |
| `playbooks/README.md` | Playbook index | 30+ domain-specific guides |
| `polyvis.settings.json` | Central config | Paths, models, thresholds |
| `src/css/layers/theme.css` | Design tokens | The Control Panel |
| `src/resonance/schema.ts` | DB schema | Current version: 5 |
| `tsconfig.json` | Path aliases | Import resolution |
| `_CURRENT_TASK.md` | Active work | Task tracking |
| `SCOREBOARD.md` | Agent history | Learn from past sessions |

---

## Help & Debugging

**Console Errors:**
- STOP immediately
- Capture logs
- Read `playbooks/agent-experimentation-protocol.md`

**Build Issues:**
- Check service status: `bun run servers`
- View logs: `tail -f .dev.log`
- Restart: `bun run dev restart`

**Database Issues:**
- Inspect: `bun run inspect-db`
- Rebuild: `bun run build:data`
- Check schema version: See `src/resonance/schema.ts`

**Regression Loop:**
- Read `AGENTS.md` Protocol 6 (WSP)
- Follow `playbooks/problem-solving-playbook.md`
- Isolate in clean room

---

## Quick Reference Card

```bash
# Start development
bun run dev start

# Check everything
bun run servers

# Quality gate
bun run precommit

# Run tests
bun test

# Stop everything
bun run dev stop

# View logs
tail -f .dev.log

# Rebuild database
bun run build:data
```

**Remember:** Read `AGENTS.md` for protocols, `playbooks/README.md` for domain guides.
