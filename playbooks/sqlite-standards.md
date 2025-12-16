# SQLite Configuration & Best Practices (Canon)

> [!IMPORTANT]
> This document is the **Single Source of Truth** for all SQLite operations in PolyVis.
> Deviating from these standards causes "Disk I/O Errors" and locking issues in our concurrent environment (Daemon + MCP).

## 1. The "Resonance" Standard
All database connections MUST use the following configuration to ensure stability under concurrency.

### Required Pragmas
Every connection (Writer or Reader) must execute these immediately upon opening:

```sql
-- 1. Busy Timeout (Startup Safety)
-- CRITICAL: Must be executed FIRST to survive startup contention/recovery.
PRAGMA busy_timeout = 5000;

-- 2. Write-Ahead Logging (Concurrency)
-- "Smart WAL": Only set if not already 'wal' to avoid write locks on readers.
-- WARNING: Readers must NOT use "readonly" connection flags in WAL mode.
PRAGMA journal_mode = WAL;

-- 3. Synchronous Mode (Performance)
PRAGMA synchronous = NORMAL;

-- 4. Memory Mapping (Stability)
-- CRITICAL: Disabled to prevent "Disk I/O Error" in multi-process environments (macOS/Bun).
PRAGMA mmap_size = 0; 

-- 5. Integrity
PRAGMA foreign_keys = ON;

-- 6. Temporary Store (Speed)
PRAGMA temp_store = memory;
```

## 2. Architecture Patterns

### ✅ Protocol A: The `ResonanceDB` Class
Use the `ResonanceDB` class for all standard graph operations. It encapsulates the config above.

```typescript
// Correct
const db = new ResonanceDB("public/resonance.db");
```

### ✅ Protocol B: Dependency Injection (Services)
Services (like `VectorEngine`) should NOT open their own connections. Pass the existing `ResonanceDB` instance or its raw connection.

```typescript
// Correct
const vectorEngine = new VectorEngine(db.getRawDb());
```

### ❌ Anti-Pattern: Raw Connections
Do not instantiate `new Database()` directly in business logic unless properly configured with ALL pragmas above.
-   **Risk:** Missing `busy_timeout` causes immediate crashes when the Daemon is writing.

## 3. Maintenance
-   **Vacuum:** Run `VACUUM;` weekly.
-   **Optimize:** Run `PRAGMA optimize;` before closing.` tracking.
-   **Drizzle:** Available for reference/type generation, but runtime is Pure Bun.

### 3. File Extensions
-   **Primary:** `resonance.db`

## 4. Connection Lifecycle
-   **Singletons:** In long-running processes (Daemon), keep one connection open.
-   **Ephemeral:** CLI tools can open/close on demand.
-   **Shutdown:** Always `db.close()` to checkpoint WAL (optional but polite).
