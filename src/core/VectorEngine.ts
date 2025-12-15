import { Database } from "bun:sqlite";
import { join } from "path";
import settings from "@/polyvis.settings.json";
import { FlagEmbedding, EmbeddingModel } from "fastembed";

// Types
export interface SearchResult {
	id: string;
	score: number;
	content: string;
}

/**
 * FAFCAS Protocol: Normalizer
 * Calculates L2 Norm, normalizes to Unit Length, and returns Raw Bytes.
 */
function toFafcas(vector: Float32Array): Uint8Array {
	// 1. Calculate Magnitude (L2 Norm)
	let sum = 0;
	for (let i = 0; i < vector.length; i++) {
		sum += vector[i]! * vector[i]!;
	}
	const magnitude = Math.sqrt(sum);

	// 2. Normalize (Divide by Magnitude)
	// Optimization: If magnitude is 0, return zero vector (avoids NaN)
	if (magnitude > 1e-6) {
		for (let i = 0; i < vector.length; i++) {
			vector[i]! /= magnitude;
		}
	}

	// 3. Serialize to Raw Bytes (FAFCAS Blob)
	// We return a view on the same buffer
	return new Uint8Array(vector.buffer, vector.byteOffset, vector.byteLength);
}

/**
 * FAFCAS Protocol: Search Engine
 * Pure Dot Product (since vectors are unit-length).
 */
function dotProduct(a: Float32Array, b: Float32Array): number {
	let sum = 0;
	// Modern JS engines SIMD-optimize this loop automatically
	for (let i = 0; i < a.length; i++) {
		sum += a[i]! * b[i]!;
	}
	return sum;
}

export class VectorEngine {
	private db: Database;
	private modelPromise: Promise<FlagEmbedding>;

	constructor(dbPath?: string) {
		const path =
			dbPath || join(process.cwd(), settings.paths.database.resonance);
		this.db = new Database(path);
		
        // Lazy load the model
        this.modelPromise = FlagEmbedding.init({
            model: EmbeddingModel.AllMiniLML6V2
        });
	}

	/**
	 * Generate embedding using FastEmbed (In-Process)
	 * Returns FAFCAS-compliant Raw Bytes (Uint8Array)
	 */
	async embed(text: string): Promise<Uint8Array | null> {
		try {
            const model = await this.modelPromise;
            // fastembed returns a generator, we take the first item
            const embeddings = model.embed([text]);
            let vector: Float32Array | undefined;
            
            for await (const batch of embeddings) {
                if (batch && batch.length > 0) {
                    vector = new Float32Array(batch[0]!);
                }
                break; 
            }

            if (!vector) return null;

			// Normalize to FAFCAS (Unit Length) -> Blob
            // FastEmbed output is usually normalized, but FAFCAS requires strict adherence
			return toFafcas(vector);
		} catch (e) {
			console.error("Failed to generate embedding:", e);
			return null;
		}
	}

	/**
	 * Save embedding to DB as BLOB
	 */
	saveEmbedding(id: string, embedding: Uint8Array) {
		// Bun SQLite stores TypedArrays as BLOBs automatically
		this.db
			.prepare("UPDATE nodes SET embedding = ? WHERE id = ?")
			.run(embedding, id);
	}

	/**
	 * FAFCAS Optimized Search
	 * Uses raw BLOBs and dot product for high-speed retrieval.
	 */
	async search(query: string, limit = 5): Promise<SearchResult[]> {
		// 1. Get Normalized Query Vector (Blob)
		const queryBlob = await this.embed(query);
		if (!queryBlob) return [];

		// Create Float32 view for calculation
		const queryFloats = new Float32Array(
			queryBlob.buffer,
			queryBlob.byteOffset,
			queryBlob.byteLength / 4,
		);

		// 2. Load all embeddings (Raw BLOBs)
		const candidates = this.db
			.query(
				"SELECT id, content, embedding FROM nodes WHERE embedding IS NOT NULL",
			)
			.all() as { id: string; content: string; embedding: Uint8Array }[];

		// 3. Compute Scores (Hot Loop)
		const results: SearchResult[] = [];

		for (const candidate of candidates) {
			// Zero-copy view on the candidate blob
			const candidateFloats = new Float32Array(
				candidate.embedding.buffer,
				candidate.embedding.byteOffset,
				candidate.embedding.byteLength / 4,
			);

			// FAFCAS: Dot Product is Cosine Similarity for Unit Vectors
			const score = dotProduct(queryFloats, candidateFloats);

			// Arbitrary threshold filter
			if (score > 0.0) {
				results.push({
					id: candidate.id,
					score,
					content: candidate.content,
				});
			}
		}

		// 4. Sort & Limit
		return results.sort((a, b) => b.score - a.score).slice(0, limit);
	}
}
