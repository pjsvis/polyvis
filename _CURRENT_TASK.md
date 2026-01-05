# Current Task

**Status**: Active 🟢  
**Started**: 2026-01-03
**Objective**: Refactor Embedder for Dynamic Model Selection

## Task: Refactor Embedder for Dynamic Model Selection

**Objective**: Decouple the embedding model selection from the `Embedder` class logic to allow environment-driven configuration and upgrade the default model to `bge-small-en-v1.5` for improved semantic retrieval.

### Key Results Achieved

✅ **Configurability**: Model can now be set via `EMBEDDING_MODEL=allminilml6v2` environment variable  
✅ **Modernization**: Default upgraded from AllMiniLML6V2 to BGE_SMALL_EN_V1_5 (better semantic quality)  
✅ **Resilience**: "Daemon First → Local Fallback" reliability pattern maintained  
✅ **Backward Compatibility**: Existing API calls remain unchanged  

### Verification Results

- **Default Model**: BGE_SMALL_EN_V1_5 → 384 dimensions, 312ms generation
- **Legacy Override**: AllMiniLML6V2 → 384 dimensions, functional fallback  
- **Daemon**: Fully compatible, no changes required to daemon.ts

### Files Modified

1. `src/resonance/services/embedder.ts` - Core refactor with dynamic model selection
2. `verify-embedder.ts` - Verification script for testing configurations

### Configuration Logic

Priority order for model selection:
1. Runtime arguments (future enhancement)
2. `process.env.EMBEDDING_MODEL` 
3. Class default (`EmbeddingModel.BGESmallENV15`)

The system now supports environment-driven model configuration while maintaining full backward compatibility and improved semantic retrieval quality through the modern BGE model.