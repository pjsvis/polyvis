# Database Baseline

**Last Updated:** 2025-12-17 20:34

---

## Current State (RESTORED)

**Location:** `public/resonance.db`

| Metric | Count |
|--------|-------|
| **Nodes** | 434 |
| **Edges** | 634 |
| **Vectors** | 247 |
| **DB Size** | 8.5 MB |
| **Status** | ✅ **CLEAN** - Restored from backup |

---

## Known Good Backup

**Location:** `backups/db/benchmarks/resonance.db.pre-benchmark-20251217-184046`

| Metric | Count |
|--------|-------|
| **Nodes** | 434 |
| **Edges** | 634 |
| **Vectors** | 247 |
| **DB Size** | 8.5 MB |
| **Status** | ✅ **CLEAN** - Backup from 18:40 before tonight's work |

---

## History

### 2025-12-17 20:34
**FUCKED-ADJACENT STATE RECORDED**
- Current DB: 445 nodes, 492 edges (CORRUPTED)
- Good backup: 434 nodes, 634 edges (CLEAN)
- Cause: Interrupted ingestion after deleting database
- Action needed: Restore from backup

### 2025-12-17 20:27
**Interrupted ingestion**
- Started full rebuild after deleting database
- Ingestion killed mid-process
- Result: Partial data, inconsistent state

### 2025-12-17 20:19
**Initial baseline** after restore from pre-benchmark backup
- Restored from: `backups/db/benchmarks/resonance.db.pre-benchmark-20251217-184046`
- Reason: Data loss during benchmark prep (434 nodes → 1 node)
- Recovery: Successful
