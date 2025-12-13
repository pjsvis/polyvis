# Echo: Hardcoded Paths

**Type:** ripgrep  
**Tags:** refactor, settings, single-source-of-truth  
**Version:** 1.0.0  
**Created:** 2025-12-12

---

## Pattern

```bash
rg 'join.*"(src/|public/|scripts/|docs/|node_modules/)"' \
   --type ts --type js \
   -n \
   scripts/ src/ resonance/
```

**Explanation:**
- Finds `join()` calls with hardcoded path strings
- Targets common directories that should be in settings
- Only searches TypeScript/JavaScript files
- Shows line numbers for easy fixes

---

## What It Finds

Hardcoded directory paths in `path.join()` calls that should reference `polyvis.settings.json`.

**Example violations:**
```typescript
const dbPath = join(process.cwd(), "public/resonance.db");
const docsPath = join(ROOT, "docs/webdocs");
```

---

## Why It Matters

### **Portability**
- Breaks on different environments (Windows vs Unix)
- Hardcoded paths assume specific project structure

### **Maintainability**
- Scattered magic strings = nightmare to refactor
- No single source of truth for paths

### **Testability**
- Can't easily mock/override paths in tests
- Tight coupling to filesystem structure

**Risk Level:** Medium  
**Effort to Fix:** Low (5 min per instance)

---

## How to Fix

### **Step 1: Add to Settings**

```json
// polyvis.settings.json
{
  "paths": {
    "docs": {
      "root": "docs",
      "webdocs": "docs/webdocs"
    }
  }
}
```

### **Step 2: Update Code**

```typescript
// Before
const docsPath = join(process.cwd(), "public/docs");

// After
import settings from "@/polyvis.settings.json";
const docsPath = join(process.cwd(), settings.paths.docs.public);
```

### **Step 3: Verify**

```bash
# Should return 0 results for that specific path
rg '"public/docs"' scripts/ --type ts
```

---

## Related Echoes

- `magic-strings.md` - All hardcoded strings (broader)
- `settings-audit.md` - Complete refactor workflow
- `import-analysis.md` - Find inconsistent import paths

---

## Success Criteria

### **Before Running Fix**
```bash
$ rg 'join.*"(public/|docs/)"' scripts/ -c
# Returns: 5 matches
```

### **After Running Fix**
```bash
$ rg 'join.*"(public/|docs/)"' scripts/ -c
# Returns: 0 matches

# Settings usage should increase
$ rg 'settings\.paths\.' scripts/ -c
# Returns: 10+ matches
```

---

## Session History

**Created:** 2025-12-12 (Docs Consolidation Session)

**Findings:**
- Found 2 instances during consolidation
- Fixed: `transform_cda.ts`, `consolidate-docs/index.ts`
- Result: Zero hardcoded doc paths remain

**Debrief:** `debriefs/2025-12-12-settings-driven-doc-paths.md`

---

## Notes

**False Positives:**
- `node_modules/` paths are usually OK (dependencies)
- `.resonance/` paths might be intentional (tooling)

**Pro Tip:**
Add `--type-not json` to avoid matching settings file itself!
