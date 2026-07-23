# .resonance/ Directory

**Purpose:** Local operational memory and tooling cache for the Resonance/PolyVis system.

**Status:** Actively used (DO NOT DELETE)  
**Git:** `.gitignore`'d (local state, not committed)

ref: [self organising daatbase post](https://medium.com/@dhilip.kumar/from-unstructured-chaos-to-queryable-knowledge-designing-ontology-backed-knowledge-graphs-for-9df031d97257)
---

## Structure

```
.resonance/
├── README.md              # This file
├── resonance.db           # SQLite database (operational graph)
├── resonance.db-shm       # SQLite shared memory (auto-generated)
├── resonance.db-wal       # SQLite write-ahead log (auto-generated)
├── artifacts/             # Ingestion artifacts (JSON)
├── cache/                 # Model cache (embeddings)
└── echoes/                # Super-grep pattern library
```

---

## Files Explained

### **resonance.db** (Primary Database)
**Type:** SQLite database  
**Purpose:** Stores the knowledge graph (nodes, edges, vectors)

**Schema:**
- `nodes` - Concepts, documents, entities
- `edges` - Relationships between nodes
- `nodes_fts` - Full-text search index (FTS5)
- `metadata` - System configuration

**Used by:**
- Resonance CLI (`resonance` commands)
- Ingestion scripts (`scripts/build_db.ts`)
- Graph viewer (sigma-explorer)

**Backup:** Should be backed up periodically (contains ingested knowledge)

**Why here:** Local operational state, rebuilt from source files if needed

---

### **resonance.db-shm** & **resonance.db-wal**
**Type:** SQLite temporary files  
**Purpose:** Write-ahead logging (WAL mode)

**Auto-generated:** Created/managed by SQLite  
**Safe to delete:** If database is closed (will regenerate on next open)  
**Why exists:** Performance (WAL mode is faster than default journal mode)

**Learn more:** https://www.sqlite.org/wal.html

---

### **artifacts/** (Ingestion Artifacts)
**Type:** Directory with JSON files  
**Purpose:** Intermediate data during ingestion pipeline

**Contains:**
```
artifacts/
├── cda-enriched.json      # CDA with extracted keywords
├── lexicon-enriched.json  # Lexicon with relationships
└── docs.json              # Document metadata
```

**Why keep:** Debugging, inspection, reprocessing without re-parsing

**Can delete:** Yes (will regenerate on next ingestion)

---

### **cache/** (Model Cache)
**Type:** Directory with model files  
**Purpose:** Downloaded embedding models (fastembed)

**Contains:**
```
cache/
└── fast-all-MiniLM-L6-v2/  # Sentence transformer model
    ├── model.onnx          # ONNX format model
    ├── tokenizer.json      # Tokenizer config
    └── ...                 # Other model files
```

**Size:** ~100MB per model  
**Why cache:** Avoid re-downloading on every run  
**Can delete:** Yes (will re-download automatically)

---

### **echoes/** (Super-Grep Patterns)
**Type:** Pattern library (Markdown documentation)  
**Purpose:** Reusable grep patterns for code quality

**Contains:**
```
echoes/
├── README.md                  # Concept guide
├── 2025-12-12-findings.md     # Scan results
├── hardcoded-paths.md         # Ripgrep pattern
├── console-patterns.md        # AST-grep pattern
└── empty-catch.md             # AST-grep pattern
```

**Used for:** Manual quality scans, future CLI integration

**Should backup:** Yes (custom patterns are valuable IP)

**See:** `echoes/README.md` for detailed usage

---

## Maintenance

### **What to Keep**
✅ `resonance.db` - Primary knowledge graph  
✅ `echoes/` - Custom patterns  
✅ `artifacts/` - Useful for debugging

### **What Can Delete (Will Regenerate)**
⚠️ `cache/` - Models re-download automatically  
⚠️ `*.db-shm`, `*.db-wal` - Auto-generated on next open  
⚠️ `artifacts/*.json` - Regenerates on next ingestion

### **Disaster Recovery**
If `.resonance/` is lost:

1. **Database:** Re-run ingestion
   ```bash
   bun run scripts/build_db.ts
   ```

2. **Echoes:** Lost permanently (should backup!)
   - Option: Future registry will allow re-pull

3. **Cache:** Auto-downloads on next use

4. **Artifacts:** Regenerates on next build

---

## Size Management

**Typical sizes:**
- `resonance.db` - 5-50MB (depends on ingestion)
- `cache/` - 100-500MB (models)
- `artifacts/` - 1-5MB (JSON)
- `echoes/` - <1MB (markdown)

**Total:** ~100-550MB

**If space-constrained:**
1. Delete `cache/` (will re-download)
2. Delete `artifacts/` (will regenerate)
3. Compress old `resonance.db` versions

---

## Git Ignore

**This directory should be `.gitignore`'d:**

```gitignore
# .gitignore
.resonance/*.db
.resonance/*.db-shm
.resonance/*.db-wal
.resonance/artifacts/
.resonance/cache/
# BUT: Keep echoes/ (versioned patterns)
!.resonance/echoes/
```

**Rationale:**
- Database is local state (rebuilt from source)
- Cache is downloadable (large, redundant)
- Echoes are custom IP (should version)

---

## Future: Resonance CLI

**Planned commands:**
```bash
resonance init          # Initialize .resonance/
resonance status        # Show database stats
resonance clean         # Remove cache/artifacts
resonance backup        # Export database
resonance echo <cmd>    # Run super-grep patterns
```

**Status:** Partially implemented  
**See:** `resonance/` source directory

---

## Related Documentation

- `resonance/README.md` - Resonance CLI tool
- `.resonance/echoes/README.md` - Super-grep patterns
- `briefs/pending/E-brief-resonance-registry.md` - Future registry design

---

**Last Updated:** 2025-12-12  
**Reason:** Initial documentation (Friday cleanup session)
