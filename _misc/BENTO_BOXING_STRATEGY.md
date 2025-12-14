# MARKDOWN-FIRST BENTO-BOXING STRATEGY

**STATUS:** FRIDAY EXPLORATION / ARCHITECTURAL VISION  
**DATE:** 2025-12-12  
**CONTEXT:** POLYVIS KNOWLEDGE GRAPH PIPELINE

---

## 1. THE CORE PHILOSOPHY
**MARKDOWN IS THE SINGLE SOURCE OF TRUTH.**

We do not destroy our documents to ingest them. We **annotate** them.
- **Original:** Markdown file in repo.
- **Annotated:** Same file with injected HTML comments (semantic metadata).
- **Ingested:** Graph nodes derive from these annotations.

---

## 2. THE ARCHITECTURE

```
[Markdown Document] (Source of Truth)
       ↓
[AST-Grep / Parser] (Structural Analysis)
       ↓
[Bento-Boxing] (Semantic Chunking)
       ↓
[TagEngine] (Semantic Edge Generation)
       ↓
[Graph Nodes + Edges] (Discovery Layer)
       ↓
[Vector Embeddings] (Search Layer)
```

### The Domains
1. **PERSONA DOMAIN** (Directives, Heuristics)
   - "How we think"
   - Defined in system prompts / directives
2. **EXPERIENCE DOMAIN** (Documentation, Debriefs, Briefs)
   - "What we did / What happened"
   - Defined in Markdown files

**THE GOAL:** Link **EXPERIENCE** to **PERSONA**.
> "Show me how we implemented [Directive AUTH-001] in the code."

---

## 3. THE PROCESS: "SUPER-GREP BENTO-BOXING"

### Phase 1: Structural Analysis (AST-Grep)
Use AST-grep (or regex/parsers) to identify **safe split points**:
- Headers (`#`, `##`) are natural boundaries.
- **Code Blocks** (` ``` `) are Atomic Units (NEVER SPLIT).
- Tables and Lists are coherent units.

### Phase 2: Bento-Boxing (Chunking)
Split the document into "Seaman-sized" chunks (semantic bento boxes).
- **Size:** 100-600 words (cognitive load friendly).
- **Boundary:** Respects structure (don't break code blocks).

### Phase 3: Annotation (The "Markup")
Inject metadata directly into the Markdown using invisible HTML comments.

```markdown
<!-- bento-id: doc-auth-003 -->
<!-- tags: authentication, OAuth, security -->
<!-- implements: PERSONA::AUTH-001 -->

## Authentication Flow (H2)

We implemented OAuth 2.0 using...
[Content preserved exactly as is]
```

### Phase 4: Ingestion
- **Graph:** Creates node `doc-auth-003` linked to `AUTH-001`.
- **Vector:** Embeds the text content of the box for semantic search.

---

## 4. GRAPH VS VECTOR ROLES

### The Graph (Discovery & Logic)
- **Role:** Explicit Linking & Traversal
- **Query:** "What documents implement Directive X?"
- **Edges:** `implements`, `related_to`, `output_of`

### The Vector Store (Fuzzy Search)
- **Role:** Semantic Similarity & Retrieval
- **Query:** "How do I handle refresh tokens?"
- **Result:** Returns `doc-auth-003` (because vectors match "refresh tokens").

### Combined Power
1. **Search Vector:** User finds a specific implementation detail.
2. **Traverse Graph:** System reveals *why* it was done that way (linked Directive).

---

## 5. IMPLEMENTATION PLAN (FRIDAY PROTOTYPE)

1. **Create Echo:** `markdown-bento-box.md` (Pattern for splitting).
   - Use `rg` to find headers.
   - Use `MarkdownMasker` (existing) to protect code blocks.
2. **Experiment:** Manually annotate a Debrief file.
   - Add `<!-- bento-id -->` tags.
   - Add `<!-- tags -->`.
3. **Verify:**
   - Does it still render? (Yes, HTML comments are invisible).
   - Can we extract it back out?

---

## 6. WHY THIS MATTERS

We are building a system where **Documentation** becomes **Executable Knowledge**.
- We don't just "grep" text.
- We "query" our experience.
- We "link" our actions to our principles.

**THIS IS THE WAY.**
