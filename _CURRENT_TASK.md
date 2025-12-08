
# Current Task: Schema Migration (Resonance Engine)

**Status:** In Progress
**Objective:** Migrate existing Drizzle schema to support Resonance (Vector) capabilities.

**Components:**
- **DB Engine:** Pure Bun + BLOBs (Validated).
- **Core:** FastEmbed (Validated) - Solved native dep issues.
- **Migration:** Add `embedding` (BLOB) and `content` (TEXT) to `nodes`.

**Plan:**
1.  **Analyze:** `src/db/schema.ts` (Done).
2.  **Draft Migration:** Create `src/db/migrations/0001_add_resonance_vectors.sql` (or similar Drizzle migration).
3.  **Sync Command:** Implement `resonance sync` using the updated schema.

**Links:**
- [Deep Research: Bun SQLite](docs/Bun-SQLite-and-Local-Embeddings.md)
- [Brief: Resonance Hybrid Engine](briefs/F-resonance-hybrid-db-engine.md)
