# Scripts: Pipeline

This directory contains the ingestion and synchronization pipelines that move data from the file system to the Resonance Knowledge Graph.

## Contents

- **`sync_resonance.ts`:** The master script for syncing FS -> DB.
- **`ingest_experience_graph.ts`:** Logic for ingesting "Experience" data (Briefs, etc.).
- **`migrate_db.ts`:** Database migration utilities.
- **`load_db.ts`:** Utility to load initial data.
- **`extract_terms.ts`:** Legacy/Helper to extract terms during build.
- **`transform_docs.ts`:** Experimental transformation logic.
