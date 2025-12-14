# Echo: Console Patterns (Semantic)

**Type:** ast-grep  
**Tags:** cleanup, production, logging  
**Version:** 1.0.0  
**Created:** 2025-12-12

---

## Pattern

```bash
ast-grep --pattern 'console.$METHOD($$$)' \
         --lang ts \
         --lang js \
         scripts/ src/ resonance/
```

**Advanced (count only):**
```bash
ast-grep --pattern 'console.log($$$)' --lang ts scripts/ | wc -l
```

---

## What It Finds

**Semantic** console usage - ignores comments and strings!

**Matches:**
```typescript
console.log("debug");           ✅ Found
console.error(err);             ✅ Found
const log = console.log;        ✅ Found (ripgrep misses this!)
```

**Ignores:**
```typescript
// console.log("commented")     ❌ Ignored (text search finds this)
const str = "console.log";      ❌ Ignored (text search finds this)
```

---

## Why It Matters

### **Production Leaks**
- Console statements ship to production
- Performance impact (console.log is slow)
- Exposes internals to browser devtools

### **Debugging Debt**
- Temporary debug code becomes permanent
- Signal-to-noise in logs
- Should use proper logger

### **AST-Grep Advantage**
- **Ripgrep:** Finds "console.log" in comments/strings (false positives)
- **AST-grep** Only finds actual code (true positives)

**Risk Level:** Medium (production), Low (scripts)  
**Current Count:** 347+ instances

---

## How to Fix

### **Option 1: Intentional Logging (Scripts)**
```typescript
// Scripts/migrations are OK - they're CLI tools
// Migration: scripts/migrations/add_fts.ts
console.log("✅ FTS5 Migration Complete!");
```

**Action:** Keep (legitimate CLI output)

### **Option 2: Debug Statements (Remove)**
```typescript
// Debug code that shouldn't ship
console.log(response);  // ← DELETE

// Better: Use conditional debug
if (import.meta.env.DEV) {
  console.log(response);
}
```

### **Option 3: Proper Logger (Refactor)**
```typescript
// Before
console.error("Failed:", err);

// After
import { logger } from '@/lib/logger';
logger.error("Failed:", err);
```

---

## Categorization Strategy

**Accept:**
- ✅ CLI scripts (`scripts/cli/`, `scripts/migrations/`)
- ✅ Build tools (`scripts/build*.ts`)

**Review:**
- ⚠️ Utilities (`scripts/utils/`, `scripts/verify/`)
- ⚠️ Legacy code (`scripts/legacy/`)

**Remove:**
- ❌ Frontend code (`src/`)
- ❌ Core libraries (`resonance/src/`)
- ❌ Production API routes

---

## Refined Search (Exclude CLI)

```bash
# Find console use OUTSIDE of CLI/migrations
ast-grep --pattern 'console.$METHOD($$$)' \
         --lang ts \
         src/ resonance/src/ \
         | grep -v "scripts/cli" \
         | grep -v "scripts/migrations"
```

---

## Related Echoes

- `console-logs.md` (ripgrep version - finds more, including comments)
- `debug-statements.md` - All debug patterns (debugger, TODO, etc)
- `logger-migration.md` - Workflow to add proper logging

---

## Success Criteria

### **Current State**
```bash
$ ast-grep --pattern 'console.log($$$)' --lang ts scripts/ | wc -l
347
```

### **Target State** (After triage)
```bash
# Frontend/core should be zero
$ ast-grep --pattern 'console.$METHOD($$$)' --lang ts src/ resonance/src/ | wc -l
0

# CLI/migrations are OK
$ ast-grep --pattern 'console.log($$$)' --lang ts scripts/cli/ | wc -l
<any number> # Legitimate
```

---

## Session History

**Created:** 2025-12-12 (Super-Grep Echoes Bootstrap)

**Initial Scan:**
- Total instances: 347+
- Breakdown needed by directory
- Most in migrations/CLI (legitimate)
- Some in src/ (need review)

**Action:** Categorize, then selective cleanup

---

## AST-Grep Syntax Notes

**Pattern Wildcard:**
```
$METHOD - matches any single node (method name)
$$$ - matches zero or more nodes (arguments)
```

**Example:**
```bash
console.$METHOD($$$)
```

**Matches:**
- `console.log()`
- `console.log("x")`
- `console.error("x", err)`
- `console.warn("x", "y", "z")`

**Does NOT match:**
- Comments containing "console.log"
- String literals containing "console.log"

**This is the POWER of AST-grep** 🔥
