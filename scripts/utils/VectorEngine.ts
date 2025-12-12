import { Database, type SQLQueryBindings } from "bun:sqlite";
import settings from "@/polyvis.settings.json";
import { join } from "path";

// Types
export interface SearchResult {
	id: string;
	score: number;
	content: string;
}

export class VectorEngine {
	private db: Database;
	private modelName: string;

	constructor(dbPath?: string, model = "nomic-embed-text") {
		const path = dbPath || join(process.cwd(), settings.paths.database.resonance);
		this.db = new Database(path);
		this.modelName = model;
	}

	/**
	 * Generate embedding using local Ollama instance
	 */
	async embed(text: string): Promise<Float32Array | null> {
		try {
			const response = await fetch("http://localhost:11434/api/embeddings", {
				method: "POST",
				body: JSON.stringify({
					model: this.modelName,
					prompt: text,
				}),
			});

			if (!response.ok) {
				console.error(`Ollama Error: ${response.statusText}`);
				return null;
			}

			const data = (await response.json()) as { embedding: number[] };
			return new Float32Array(data.embedding);
		} catch (e) {
			console.error("Failed to connect to Ollama:", e);
			return null;
		}
	}

	/**
	 * Save embedding to DB as BLOB
	 */
	saveEmbedding(id: string, embedding: Float32Array) {
        // Bun SQLite stores TypedArrays as BLOBs automatically
		this.db
			.prepare("UPDATE nodes SET embedding = ? WHERE id = ?")
			.run(embedding, id);
	}

	/**
	 * Brute-force Cosine Similarity search in JS
	 * (Fast enough for < 10k nodes)
	 */
	async search(query: string, limit = 5): Promise<SearchResult[]> {
		const queryVec = await this.embed(query);
		if (!queryVec) return [];

		// 1. Load all embeddings
		const candidates = this.db
			.query(
				"SELECT id, content, embedding FROM nodes WHERE embedding IS NOT NULL",
			)
			.all() as { id: string; content: string; embedding: Uint8Array }[];

        console.log(`[DEBUG] Found ${candidates.length} candidates with embeddings.`);

		// 2. Compute Scores
		const results: SearchResult[] = [];
        
		for (const candidate of candidates) {
            // Convert BLOB (Uint8Array) back to Float32Array
            const vec = new Float32Array(candidate.embedding.buffer, candidate.embedding.byteOffset, candidate.embedding.byteLength / 4);

			const score = this.cosineSimilarity(queryVec, vec);
            // console.log(`[DEBUG] ${candidate.id} score: ${score}`);
            
			if (score > 0.0) { // arbitrary threshold filter
				results.push({
					id: candidate.id,
					score,
					content: candidate.content,
				});
			}
		}

		// 3. Sort & Limit
		return results.sort((a, b) => b.score - a.score).slice(0, limit);
	}

	private cosineSimilarity(a: Float32Array, b: Float32Array): number {
		if (a.length !== b.length) return 0;
		let dot = 0;
		let normA = 0;
		let normB = 0;
		for (let i = 0; i < a.length; i++) {
			const aVal = a[i] ?? 0;
			const bVal = b[i] ?? 0;
			dot += aVal * bVal;
			normA += aVal * aVal;
			normB += bVal * bVal;
		}
		return dot / (Math.sqrt(normA) * Math.sqrt(normB));
	}
}
