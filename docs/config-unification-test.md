# Configuration Unification Test Document

**Date**: 2026-01-07  
**Purpose**: Validate unified config system end-to-end

## System Overview

AMALFA now uses a unified configuration system with `amalfa.config.json` as the single source of truth. The legacy `polyvis.settings.json` has been deprecated and removed.

## Key Features

### Clean-Slate Migration Strategy
The migration used a "break everything at once" approach:
- Rename config to `.bak` to force all imports to break
- Let TypeScript compiler find every reference
- Fix systematically with TODO tracking
- Archive legacy code rather than deleting

### Configuration Loading
The system lazy-loads configuration from `amalfa.config.json`:
- Database path: `.amalfa/multi-source-test.db`
- Source directories: `../polyvis/docs`, `../polyvis/playbooks`
- Embedding model: BAAI/bge-small-en-v1.5 (384 dimensions)

### Validation Tooling
Created `scripts/validate-config.ts` for automated conflict detection:
- Checks database path conflicts
- Validates source directory existence
- Verifies embedding model configuration
- Reports warnings and info messages

## Technical Insights

The unified config approach eliminates confusion about:
- Which config file to edit
- Where settings are defined
- How to override defaults

This test document should be indexed and searchable via semantic queries related to:
- Configuration management
- Migration strategies
- TypeScript compilation
- Database paths
- Unified systems

## Tags

#configuration #migration #typescript #amalfa #testing
