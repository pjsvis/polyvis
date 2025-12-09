import { FlagEmbedding, EmbeddingModel } from "fastembed";
import { join } from "path";

let embedder: FlagEmbedding | null = null;

export class Embedder {
    static async init() {
        if (!embedder) {
            // Default cache dir: .resonance/cache
            const cacheDir = join(process.cwd(), ".resonance/cache");
            
            console.log("🧠 Loading Embedding Model (FastEmbed)...");
            console.log(`   Cache: ${cacheDir}`);
            
            embedder = await FlagEmbedding.init({
                model: EmbeddingModel.AllMiniLML6V2,
                cacheDir: cacheDir,
                showDownloadProgress: true
            });
        }
    }

    static async embed(text: string): Promise<Float32Array> {
        if (!embedder) await this.init();
        
        // FastEmbed returns generator of batch arrays
        const gen = embedder!.embed([text]);
        const result = await gen.next();
        
        if (!result.value || result.value.length === 0) {
            throw new Error("Failed to generate embedding");
        }
        
        return result.value[0];
    }
}
