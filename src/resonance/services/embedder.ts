import { join } from "node:path";
import { EmbeddingModel, FlagEmbedding } from "fastembed";
import { toFafcas } from "@src/resonance/db";

export class Embedder {
	private static instance: Embedder;
	private nativeEmbedder: FlagEmbedding | null = null;
	private daemonUrl = `http://localhost:${process.env.VECTOR_PORT || "3010"}`;
	private useRemote = true;

	private constructor() {}

	public static getInstance(): Embedder {
		if (!Embedder.instance) {
			Embedder.instance = new Embedder();
		}
		return Embedder.instance;
	}

	private async init() {
		if (!this.nativeEmbedder) {
			const cacheDir = join(process.cwd(), ".resonance/cache");
			this.nativeEmbedder = await FlagEmbedding.init({
				model: EmbeddingModel.AllMiniLML6V2,
				cacheDir: cacheDir,
				showDownloadProgress: true,
			});
		}
	}

	public async embed(text: string, forceLocal = false): Promise<Float32Array> {
		// 1. Try Remote
		if (this.useRemote && !forceLocal) {
			try {
				const response = await fetch(`${this.daemonUrl}/embed`, {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ text }),
					signal: AbortSignal.timeout(200), // Fast timeout: 200ms
				});

			if (response.ok) {
				const data = (await response.json()) as { vector: number[] };
				if (data.vector) {
					// FAFCAS Protocol: Normalize at generation boundary
					const raw = new Float32Array(data.vector);
					return new Float32Array(toFafcas(raw).buffer);
				}
			}
			} catch (_e) {
				// Daemon unreachable or timeout
				// console.warn("Vector Daemon unreachable, falling back to local.");
			}
		}

		// 2. Fallback to Local
		if (!this.nativeEmbedder) await this.init();

		const gen = this.nativeEmbedder?.embed([text]);
		if (!gen) throw new Error("Failed to initialize embedder");
		const result = await gen.next();

	const val = result.value?.[0];
	if (!val || val.length === 0) {
		throw new Error("Failed to generate embedding");
	}

	// FAFCAS Protocol: Normalize at generation boundary
	// Note: FastEmbed usually returns normalized vectors, but we enforce it here
	const raw = new Float32Array(val);
	return new Float32Array(toFafcas(raw).buffer);
	}
}
