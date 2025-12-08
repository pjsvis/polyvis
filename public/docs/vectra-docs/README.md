# Vectra and Embeddings Documentation

This directory contains documentation and scripts related to vector databases, embeddings, and local LLM interaction. These files were collected to provide context for the development of the Resonance MCP server.

## Files

### Documentation

-   **`gemini-cli-guide.md`**: This guide mentions that full vector search integration requires `Vectra` setup and pointed to the deleted file.
-   **`hybrid-query-protocols.md`**: This architecture document describes a query system with a semantic search layer that includes vector embeddings, a vector database, and similarity ranking. It also specifically named `Vectra`.
-   **`IMPLEMENTATION.md`**: This implementation plan mentioned "Full Vectra integration" as a future goal.
-   **`proposal.md`**: The proposal also listed "Full vector search implementation (requires Vectra setup)" as a future enhancement.
-   **`embeddings-README.md`**: This README provides guidance on storing embeddings and mentions several vector-capable stores, including `Vectra`, `Milvus`, `FAISS`, and others.
-   **`topic-modelling-README.md`**: This file contains a basic guide and code example for performing topic modeling in TypeScript using the `lda` package.

### Scripts

-   **`vector-commands.ts`**: This CLI command currently returns an error stating that vector search is not yet integrated and that the `Vectra` implementation requires additional setup.
-   **`ollama-client.ts`**: A standalone, dependency-light client for interacting with a local Ollama server. It supports both text generation and chat.
-   **`embeddings.ts`**: A portable client for generating embeddings with OpenAI and for reranking with a local Ollama model. It is designed to be easily moved between projects.