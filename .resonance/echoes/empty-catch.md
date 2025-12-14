# Echo: Empty Catch Blocks

**Type:** ast-grep  
**Tags:** critical, error-handling, security  
**Version:** 1.0.0  
**Created:** 2025-12-12

---

## Pattern

```bash
# Match empty catch with any variable name
ast-grep --pattern 'catch ($ERR) { }' --lang ts --lang js
```

**Alternative (catches with only comments):**
```bash
# Find catches with minimal/no handling
ast-grep --pattern 'catch ($E) { $$ }' --lang ts | grep -v "console\|log\|throw"
```

---

## What It Finds

**Empty catch blocks** that silently swallow errors:

```typescript
try {
  riskyOperation();
} catch (e) {
  // Silent failure - BAD!
}
```

**Why AST-grep:**
- Understands block structure
- Ignores commented-out catches
- Can't be fooled by string literals

---

## Why It Matters

### **Critical Risk**

**Silent Failures:**
```typescript
try {
  await saveImportantData(data);
} catch (e) {
  // Data lost, no one knows!
}
```

**Debugging Nightmares:**
- Errors disappear
- No stack traces
- Impossible to diagnose production issues

**Security Issues:**
- Auth failures ignored
- Validation bypassed
- Attack attempts hidden

**Risk Level:** 🔴 **CRITICAL**  
**Effort to Fix:** 5 minutes per instance

---

## How to Fix

### **Option 1: Log the Error**
```typescript
catch (error) {
  console.error("Failed to save:", error);
  // Or use proper logger
}
```

### **Option 2: Re-throw**
```typescript
catch (error) {
  // Add context, then re-throw
  throw new Error(`Failed to process ${id}`, { cause: error });
}
```

### **Option 3: Handle Gracefully**
```typescript
catch (error) {
  // If truly expected, document WHY
  // and provide fallback
  logger.warn("Optional feature failed, continuing", error);
  return defaultValue;
}
```

### **Option 4: Remove Try-Catch**
```typescript
// If you can't handle it, don't catch it!
// Let it bubble up
await riskyOperation(); // No try-catch
```

---

## Acceptable Patterns

**Only acceptable with clear comment:**

```typescript
catch (error) {
  // INTENTIONAL: Ollama connection is optional
  // Fallback: Tag generation disabled
  return null;
}
```

**Must have:**
1. Comment explaining WHY silent
2. Fallback behavior documented
3. Not hiding real errors

---

## Related Echoes

- `error-swallowing.md` - Broader error anti-patterns
- `console-patterns.md` - Find console.error (better than silent)
- `logger-migration.md` - Proper error logging setup

---

## Success Criteria

### **Target**
```bash
$ ast-grep --pattern 'catch ($E) { }' --lang ts
# Should return: 0 results
```

### **Current Status (2025-12-12)**
```bash
$ ast-grep --pattern 'catch ($E) { }' --lang ts scripts/ src/ resonance/
# Result: 0 instances ✅
```

**Status:** ✅ **CLEAN** - No empty catches found!

---

## Session History

**Scanned:** 2025-12-12 (Echoes Bootstrap)

**Result:** Zero instances found!

**Analysis:** Codebase follows good error handling practices. This echo serves as:
1. **Prevention** - Catches regressions in PRs
2. **Documentation** - Shows team what NOT to do
3. **Template** - For similar anti-pattern searches

---

## AST-Grep Pattern Notes

**Why this pattern works:**
```
catch ($ERR) { }
```

- `$ERR` = matches any variable name (e, err, error, etc)
- `{ }` = matches empty block
- Won't match blocks with statements inside

**Variation for "nearly empty":**
```bash
# Find catches with only comments or single line
ast-grep --pattern 'catch ($E) { $STMT }' --lang ts
```

**This would find:**
```typescript
catch (e) {
  // Just a comment - still bad
}
```

---

## Pro-Tips

**Combine with ripgrep:**
```bash
# Find try-catch, then verify handling
rg "catch \(" --type ts -A 3 | grep -E "^\s*}\s*$"
```

**Check for catch-all ignores:**
```bash
# Find catches that ignore EVERYTHING
ast-grep --pattern 'catch ($_) { /* ignore */ }' --lang ts
```

---

**Prevention is better than cure!** ✨
