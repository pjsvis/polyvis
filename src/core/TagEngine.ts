export interface TagResult {
	hardTags: string[]; // High confidence / Existing CL terms
	softTokens: string[]; // Exploratory / New terms
}

export class TagEngine {
	private model: string;
	private endpoint: string;

	constructor(
		model = "llama3.2",
		endpoint = "http://localhost:11434/api/generate",
	) {
		this.model = model;
		this.endpoint = endpoint;
	}

	public async generateTags(content: string): Promise<TagResult> {
		const prompt = `
      Analyze the text below. Extract 3-5 key entities (Proper Nouns) and 3-5 key abstract concepts.
      Output ONLY a JSON object: { "entities": [], "concepts": [] }.
      
      TEXT: "${content.replace(/"/g, '\\"').slice(0, 1000)}" 
    `;

		try {
			const response = await fetch(this.endpoint, {
				method: "POST",
				body: JSON.stringify({
					model: this.model,
					prompt: prompt,
					format: "json", // Ollama native JSON mode
					stream: false,
				}),
			});

			const data = (await response.json()) as any;

			// Ollama's response format might vary or fail.
			if (!data || !data.response) {
				throw new Error(`Ollama response empty: ${JSON.stringify(data)}`);
			}

			const json = JSON.parse(data.response);
			return this.processRawTags(json);
		} catch (_) {
			// Fail silently for now, as TagEngine assumes a local LLM which might not be running
			console.warn("TagEngine Offline/Fail (make sure ollama is running):", _);
			return { hardTags: [], softTokens: [] };
		}
	}

	private processRawTags(raw: {
		entities: string[];
		concepts: string[];
	}): TagResult {
		const normalize = (s: string) =>
			`tag-${s.trim().toLowerCase().replace(/\s+/g, "-")}`;

		return {
			hardTags: (raw.entities || []).map(normalize),
			softTokens: (raw.concepts || []).map(normalize),
		};
	}
}
