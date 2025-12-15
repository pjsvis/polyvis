# Resonance Engine `[OH-075]`

**Status:** Active Core Module
**Context:** Polyvis / AntiGravity
**Role:** The "Brain" of the application (Vector Storage, Embeddings, Graph Topology).

## Overview
The `resonance/` directory contains the core logic for the **Sovereign Knowledge Engine**. It allows the application to be:
1.  **Local-First:** No reliance on external APIs for vector search (after model download).
2.  **Zero-Magic:** Uses standard SQLite + TypedArrays for vector storage (FAFCAS Protocol).
3.  **Portable:** The database (`resonance.db`) is a single artifact that can be moved or published.

## Directory Structure

```text
resonance/
├── src/
│   ├── config.ts       # Configuration schema (Zod) and loader
│   ├── db.ts           # ResonanceDB wrapper (SQLite + FAFCAS logic)
│   ├── daemon.ts       # (Optional) Standalone vector service
│   └── services/
│       └── embedder.ts # FastEmbed wrapper (AllMiniLML6V2)
└── resonance.db        # (Generated) The SQLite artifact
```

## Key Components

### 1. ResonanceDB (`src/db.ts`)
The simplified database wrapper.
-   **Nodes:** Stores content + vectors.
-   **Edges:** Stores relationships.
-   **FAFCAS:** Implements "Fast As F***, Cool As S***" protocol for `BLOB` vector storage and `Dot Product` similarity.

### 2. Embedder (`src/services/embedder.ts`)
A wrapper around `fastembed` (ONNX runtime).
-   **Model:** `BAAI/bge-small-en-v1.5` (or `AllMiniLML6V2`).
-   **Cache:** Models are downloaded to `.resonance/cache` to ensure offline capability.

### 3. Config (`src/config.ts`)
Defines the project structure and source directories via `resonance.settings.json`.

## Usage

### Ingestion
The ingestion pipeline (in `src/core` and `scripts/`) utilizes `ResonanceDB` to populate the graph from Markdown files.

```typescript
import { ResonanceDB } from "@resonance/src/db";
const db = new ResonanceDB();
db.insertNode({ id: "foo", embedding: new Float32Array(...) });
```

### Search
```typescript
const results = db.findSimilar(queryVector, 5);
```

## Related Documentation
-   **Analysis:** [`docs/webdocs/compare-src-and-resonance-folders.md`](../../docs/webdocs/compare-src-and-resonance-folders.md)
-   **Architecture:** [`briefs/brief-polyvis-engine.md`](../../briefs/brief-polyvis-engine.md)
