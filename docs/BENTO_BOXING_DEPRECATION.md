# Bento Boxing Deprecation

**Date:** January 5, 2026  
**Status:** ❌ Deprecated and Removed  
**Replaced By:** Whole-document vector embeddings

---

## What Was Bento Boxing?

**Bento Boxing** was a markdown chunking system designed to fragment large documents into smaller, semantically meaningful pieces ("bentos") for better vector search precision.

### Components

**Code (Removed):**
- `src/core/BentoBoxer.ts` - Chunking logic (split by H1-H4 headings)
- `src/data/LocusLedger.ts` - Content deduplication (hash → UUID mapping)
- `src/index.ts` - CLI tool for processing markdown files
- `tests/bento_ast.test.ts` - Unit tests

**Database (Removed):**
- `bento_ledger.sqlite` - Deduplication ledger (343 entries)

**Playbooks/Briefs (Removed):**
- `briefs/archive/1-brief-polyvis-bento-implementation.md`
- `briefs/archive/2-bento-box-core-logic.md`
- `playbooks/bento-box-playbook-2.md`

---

## Why It Was Deprecated

### 1. Never Integrated with Vector Search

**Critical issue:** Bento Boxing was an orphaned CLI tool, not integrated into the main ingestion pipeline.

- ✅ Code existed and worked
- ❌ Never used by `src/pipeline/Ingestor.ts`
- ❌ Never used by `src/resonance/db.ts`
- ❌ Not connected to `public/resonance.db`

**Result:** Documents were ingested whole, not chunked. Vector search operated on complete documents.

---

### 2. Whole-Document Embeddings Work Excellently

**Testing revealed chunking was unnecessary:**

| Metric | Value | Assessment |
|--------|-------|------------|
| Average best match | 85.2% | Excellent |
| Average spread | 21.1% | Good differentiation |
| Corpus size | 489 docs | Manageable |
| Average doc size | 2.7 KB (~550 words) | Already chunk-sized |

**Key insight:** 80% of documents are <5KB. They're already "chunk-sized" for embedding models.

---

### 3. Document Size Distribution

**Analysis of 489 documents:**

```
Size Range     | Percentage | Chunking Benefit
---------------|------------|------------------
< 5KB          | ~80%       | None (already small)
5-20KB         | ~15%       | Minimal
> 20KB         | ~5%        | Potential (but not critical)
```

**Largest document:** 47KB (~9,500 words)
- Still within LLM context windows (100K+ tokens)
- Embedding captures main themes well
- Can use grep for exact phrase search

---

### 4. Complexity vs Benefit

**Costs of chunking:**
- ❌ Chunk logic (where to split?)
- ❌ Chunk→document mapping
- ❌ Context loss (chunks lose surrounding context)
- ❌ Storage overhead (10x nodes for chunked docs)
- ❌ Search complexity (multiple chunks from same doc in results)
- ❌ UI complexity (show chunk vs full doc?)

**Benefits in this corpus:**
- ⚠️ Slightly better precision for 5% of large docs
- ⚠️ Granular retrieval (already achievable with grep)

**Verdict:** Costs > Benefits

---

## Search Architecture (Post-Deprecation)

### Two-Tier Search System

**1. Vector Search (Primary)**
- Purpose: Semantic similarity, concept discovery
- Accuracy: 85.2% average best match
- Speed: <10ms per query
- Handles: "Find documents about CSS patterns"

**2. Grep/Ripgrep (Secondary)**  
- Purpose: Exact phrase matches
- Accuracy: 100% (literal text)
- Speed: <1ms
- Handles: "Find exact phrase 'function fooBar'"

**No chunking needed:** This two-tier approach covers all search use cases.

---

## Decision Criteria

### When Chunking IS NOT Needed

✅ **Keep whole-document embeddings if:**
- Average doc size <5KB (most docs already chunk-sized)
- Vector search accuracy >70% (yours is 85%)
- Documents are well-structured (markdown with headers)
- Search is semantic (not keyword BM25)
- Source files are easily searchable with grep

**Polyvis meets ALL these criteria.**

---

### When Chunking WOULD Be Needed

Consider adding chunking if/when:

**1. External large documents**
- Research papers (30-50 pages)
- Books, manuals (100+ pages)
- API documentation (needs endpoint-level chunks)

**2. Accuracy degradation**
- Vector search drops below 70%
- Users report irrelevant results
- Long documents dominate search results

**3. Specific requirements**
- RAG system needs paragraph-level context
- Need to cite specific sections, not whole docs
- Document structure doesn't match search granularity

---

## Migration Notes

### What Changed

**Removed:**
- All Bento Boxing source code
- bento_ledger.sqlite database
- CLI tool (`bun run src/index.ts box`)
- Related briefs and playbooks

**Unchanged:**
- Vector search pipeline (always used whole docs)
- Ingestion pipeline
- Database schema
- Search accuracy (still 85%)

**No migration required:** Bento Boxing was never in production.

---

## Historical Context

### Development Timeline

**December 2025:**
- Bento Boxing designed and implemented
- CLI tool created for markdown chunking
- Deduplication ledger built (343 entries)
- Playbooks and briefs written

**January 2026:**
- Vector search testing revealed 85% accuracy without chunking
- Discovered Bento Boxing never integrated with main pipeline
- Analysis showed 80% of docs are already chunk-sized
- Decision: Deprecate and remove

**Lesson:** Test effectiveness before building infrastructure.

---

## Future Considerations

### If Chunking Becomes Necessary

**Approach to use:**
- **Hybrid chunking:** Only chunk large docs (>10KB)
- **By domain:** Research papers by section, API docs by endpoint
- **Lazy chunking:** Chunk at query time, not ingestion
- **Simpler logic:** Split by size, not complex AST traversal

**Don't repeat:**
- Building infrastructure before validating need
- Complex deduplication when unnecessary
- Orphaned code not integrated with main pipeline

---

## References

### Effectiveness Testing

See `scripts/test-embeddings.ts` for validation:
- 85.2% average best match
- 21.1% spread
- Tested across 5 query types (CSS, database, graph, debugging, tooling)

### Related Documentation

- `src/resonance/README.md` - Search Architecture section
- `.legacy-databases-README.md` - bento_ledger.sqlite removal
- `playbooks/README.md` - Updated to remove Bento Boxing references

---

## Summary

**Bento Boxing was well-designed but unnecessary:**
- Never integrated into production pipeline
- Whole-document embeddings achieve excellent results (85%)
- Most documents are already chunk-sized (<5KB)
- Two-tier search (vector + grep) covers all use cases

**Decision:** Remove to simplify codebase. Revisit chunking only if:
- Adding large external documents (books, long PDFs)
- Vector search accuracy drops significantly
- Specific use case emerges that requires granular retrieval

---

**Last updated:** 2026-01-05
