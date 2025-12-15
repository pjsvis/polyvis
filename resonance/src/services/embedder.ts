import { EmbeddingModel, FlagEmbedding } from "fastembed";
import { join } from "path";

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
                    signal: AbortSignal.timeout(200) // Fast timeout: 200ms
                });
                
                if (response.ok) {
                    const data = await response.json() as { vector: number[] };
                    if (data.vector) {
                        return new Float32Array(data.vector);
                    }
                }
            } catch (e) {
                // Daemon unreachable or timeout
                // console.warn("Vector Daemon unreachable, falling back to local.");
            }
        }

        // 2. Fallback to Local
		if (!this.nativeEmbedder) await this.init();

		const gen = this.nativeEmbedder!.embed([text]);
		const result = await gen.next();

		const val = result.value?.[0];
		if (!val || val.length === 0) {
			throw new Error("Failed to generate embedding");
		}

		return new Float32Array(val);
	}
}
