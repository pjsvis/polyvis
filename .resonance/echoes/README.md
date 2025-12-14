# Super-Grep Echoes

**Type:** Pattern Library  
**Purpose:** Reusable grep patterns for code quality

---

## What Are Echoes?

**Echoes** are reusable super-grep patterns - precise queries that find specific code smells, anti-patterns, or refactoring opportunities.

**Think:** Quality linters you control, not npm packages you inherit.

---

## Structure

Each echo is a markdown file containing:

1. **Pattern** - The actual grep command
2. **What It Finds** - Clear description
3. **Why It Matters** - Impact/risk
4. **How to Fix** - Remediation guide
5. **Success Criteria** - Verification command

---

## Available Echoes

### **Ripgrep (Text-Based)**
- `hardcoded-paths.md` - Find hardcoded file paths
- `console-logs.md` - Find console statements (text-based)

### **AST-Grep (Semantic)**
- `console-patterns.md` - Find console use (ignores comments)
- `empty-catch.md` - Find silent error handling
- `any-types.md` - Find type safety holes

### **Workflows (Combined)**
- `settings-audit.md` - Complete settings-driven refactor

---

## Usage

### **Manual Execution**
```bash
# Read the echo file
cat .resonance/echoes/hardcoded-paths.md

# Copy the pattern command
rg 'join.*"(src/|public/)"' --type ts -n

# Run it
```

### **Future: CLI Integration**
```bash
# Not yet implemented
resonance echo run hardcoded-paths
resonance echo list
resonance echo install <name>
```

---

## Creating New Echoes

Use the template:

```markdown
# Echo: Your Pattern Name

**Type:** ripgrep | ast-grep | combo  
**Tags:** cleanup, refactor, security  
**Version:** 1.0.0

## Pattern
\`\`\`bash
<your grep command>
\`\`\`

## What It Finds
## Why It Matters  
## How to Fix
## Related Echoes
## Success Criteria
```

---

## Philosophy

**Echoes are precision tools:**
- ✅ Specific to YOUR codebase needs
- ✅ Documented with context (not just regex)
- ✅ Executable and verifiable
- ✅ Shareable across team

**Not:**
- ❌ Generic linter rules
- ❌ Black-box npm packages
- ❌ One-time throwaway scripts

---

**Next:** Run echoes, collect findings, fix critical issues.
