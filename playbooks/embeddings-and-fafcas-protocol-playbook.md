# Embeddings & The FAFCAS Protocol

**Status:** Active
**Context:** Resonance Engine / Hybrid-DB
**Principle:** [OH-029] Effective Low-Tech Defence / [OH-041] Optimal Simplicity

## 1. The Core Philosophy
We do not use external Vector Databases (Pinecone, Weaviate, Qdrant).
For the scale of a software project (< 100,000 nodes), the latency of a network request exceeds the compute time of a brute-force search in RAM.

**The Rule:** If it fits in RAM, it lives in RAM.

---

## 2. The FAFCAS Protocol
**Definition:** **F**ast **A**s **F***, **C**ool **A**s **S***.
A binary storage specification for semantic vectors optimized for zero-dependency environments.

### The Specification
1.  **Data Type:** `Float32` (Little Endian).
2.  **Constraint (Unity):** All vectors **MUST** be normalized to a Unit Length (L2 Norm = 1.0) *before* storage.
3.  **Storage (Raw):** Vectors are stored as raw byte streams (`BLOB`) in SQLite. No headers, no metadata.
4.  **Retrieval (Algebra):** Similarity is calculated via pure **Dot Product** ($A \cdot B$).
    * *Why?* Cosine Similarity is $\frac{A \cdot B}{\|A\| \|B\|}$. Since $\|A\|$ and $\|B\|$ are always $1$, the divisor is $1$. The formula simplifies to just $A \cdot B$.
    * *Benefit:* Removes expensive `sqrt()` and `div` operations from the hot loop.

---

## 3. Implementation Recipes (TypeScript)

### A. The Normalizer (Write-Side)
*Run this immediately after generating an embedding.*

```typescript
export function toFafcas(vector: Float32Array): Uint8Array {
  // 1. Calculate Magnitude (L2 Norm)
  let sum = 0;
  for (let i = 0; i < vector.length; i++) {
    sum += vector[i] * vector[i];
  }
  const magnitude = Math.sqrt(sum);

  // 2. Normalize (Divide by Magnitude)
  // Optimization: If magnitude is 0, return zero vector
  if (magnitude > 1e-6) {
    for (let i = 0; i < vector.length; i++) {
      vector[i] /= magnitude;
    }
  }

  // 3. Serialize to Raw Bytes (FAFCAS Blob)
  return new Uint8Array(vector.buffer, vector.byteOffset, vector.byteLength);
}
```

### B. The Search Engine (Read-Side)
Run this in the "Hot Loop" (In-Memory).

```typescript
export function dotProduct(a: Float32Array, b: Float32Array): number {
  let sum = 0;
  // Modern JS engines SIMD-optimize this loop automatically
  for (let i = 0; i < a.length; i++) {
    sum += a[i] * b[i];
  }
  return sum;
}

export function search(query: Float32Array, index: Array<{vec: Float32Array}>) {
  // query MUST be normalized first!
  return index
    .map(item => ({ score: dotProduct(query, item.vec), item }))
    .sort((a, b) => b.score - a.score); // Descending
}
``` 


