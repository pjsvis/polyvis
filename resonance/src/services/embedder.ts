import { EmbeddingModel, FlagEmbedding } from "fastembed";
import { join } from "path";

export class Embedder {
	private static instance: Embedder;
	private nativeEmbedder: FlagEmbedding | null = null;

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

	public async embed(text: string): Promise<Float32Array> {
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
