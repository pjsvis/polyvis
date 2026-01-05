# 🔮 Resonance Engine

The vector database and semantic core of Polyvis.

## Contents
- **`daemon.ts`**: The Vector Service (HTTP) and Lifecycle Manager.
- **`db.ts`**: Database interface (SQLite + Vectors).
- **`config.ts`**: Configuration loader.
- **`schema.ts`**: Database schema definitions.
- **`cli/`**: CLI entry points (e.g., `ingest.ts`).
- **`services/`**: Internal services (e.g., `Embedder`).
- **`transform/`**: Transformation pipelines (e.g., `cda.ts`).
- **`pipeline/`**: Data processing steps (e.g., `extract.ts`).

## Embedding Model

### Current Model: BGE Small EN v1.5

**Specifications:**
- **Dimensions:** 384
- **Model Size:** ~120 MB
- **Speed:** Fast (<10ms per query)
- **Accuracy:** High (51-52% on MTEB retrieval benchmarks)
- **Training:** Optimized for retrieval tasks on 1B+ text pairs

**Performance on Polyvis corpus:**
- 85.2% average best match (excellent semantic understanding)
- 21.1% average spread (clear differentiation)
- 76.3% average corpus score (cohesive knowledge base)
- Consistent across query types (CSS, databases, graphs, debugging, tooling)

### Alternative: all-MiniLM-L6-v2

**Specifications:**
- **Dimensions:** 384 (same as BGE)
- **Model Size:** ~80 MB (35% smaller)
- **Speed:** Very Fast (20-30% faster than BGE)
- **Accuracy:** Good (42-43% on MTEB retrieval benchmarks)
- **Training:** General-purpose sentence embeddings

**Expected impact if switched:**
- ↓ Accuracy: 76-80% best match (5-10% reduction)
- ↑ Speed: 20-30% faster inference
- ↓ Storage: 35% smaller model
- ↓ Domain retrieval: Less effective for specialized queries

### Model Selection Guidance

**Keep BGE Small EN v1.5 (current) if:**
- Accuracy is priority (semantic search quality matters)
- Storage is not constrained (desktop/server deployment)
- Current speed is acceptable (<10ms is already fast)
- Domain-specific retrieval is important

**Consider all-MiniLM-L6-v2 if:**
- Speed is critical (real-time search on every keystroke)
- Storage is constrained (mobile/edge deployment)
- General similarity is sufficient (not retrieval-focused)
- 76-80% accuracy is acceptable

**Recommendation:** ✅ **Keep BGE Small EN v1.5**
- Current 85% accuracy is excellent
- Purpose-built for retrieval (our use case)
- Speed is already sufficient
- Model size is negligible for target deployment

### Switching Models

To change the embedding model, set the `EMBEDDING_MODEL` environment variable:

```bash
# Use BGE Small (default, recommended)
export EMBEDDING_MODEL=BGESmallENV15

# Use all-MiniLM (faster, less accurate)
export EMBEDDING_MODEL=AllMiniLML6V2
```

**Note:** Changing models requires re-embedding the entire corpus. Embeddings from different models are not compatible.

### Testing Embedding Effectiveness

To test embedding quality on your corpus:

```bash
# Run semantic search effectiveness test
bun run scripts/test-embeddings.ts

# Compare models (requires both models downloaded)
bun run scripts/compare-embedding-models.ts

# Inspect database statistics
bun run inspect-db public/resonance.db
```
