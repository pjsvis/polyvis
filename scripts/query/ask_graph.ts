import { Embedder } from "@resonance/src/services/embedder";
import { ResonanceDB } from "@resonance/src/db";
import settings from "@/polyvis.settings.json";
import { join } from "path";

import { parseArgs } from "util";

async function main() {
    const { values, positionals } = parseArgs({
        args: Bun.argv,
        options: {
            provider: { type: "string", default: "ollama" }, // 'ollama' or 'openai'
            model: { type: "string" },
            endpoint: { type: "string" },
        },
        strict: false,
        allowPositionals: true,
    });

    const query = positionals[2];
    if (!query) {
        console.log("Usage: bun run scripts/query/ask_graph.ts \"Question\" [--provider openai] [--model name] [--endpoint url]");
        process.exit(1);
    }

    const provider = String(values.provider || "ollama");
    // Default models/endpoints
    const model = String(values.model || (provider === "openai" ? "local-model" : "llama3.2"));
    const endpoint = String(values.endpoint || (provider === "openai" ? "http://localhost:1234/v1/chat/completions" : "http://localhost:11434/api/generate"));

    console.log(`🔎 Asking Graph: "${query}"`);
    console.log(`⚙️  Provider: ${provider} | Model: ${model} | URL: ${endpoint}`);

    // 1. Initialize
    const dbPath = join(process.cwd(), settings.paths.database.resonance);
    const db = new ResonanceDB(dbPath);
    const embedder = Embedder.getInstance();

    // 2. Vector Search (Retrieval)
    console.log("... Embedding Query");
    const vector = await embedder.embed(query);
    
    console.log("... Searching Vector Space");
    const similarNodes = db.findSimilar(vector, 3); // Top 3

    if (similarNodes.length === 0) {
        console.log("❌ No relevant information found in the graph.");
        process.exit(0);
    }

    // 3. Graph Expansion (Context)
    let contextStr = "";
    
    for (const node of similarNodes) {
        // Fetch Content manually
        const nodeData = db['db'].query("SELECT content, type FROM nodes WHERE id = ?").get(node.id) as any;
        const content = nodeData?.content || "";
        const type = nodeData?.type || "unknown";

        contextStr += `\n---\nSOURCE NODE: ${node.label} (${type}) (Score: ${node.score.toFixed(2)})\n`;
        contextStr += `CONTENT: ${content.slice(0, 500)}...\n`; 

        // Fetch Neighbors (Manual SQL)
        const incoming = db['db'].query("SELECT source as id, type FROM edges WHERE target = ?").all(node.id) as any[];
        const outgoing = db['db'].query("SELECT target as id, type FROM edges WHERE source = ?").all(node.id) as any[];

        const inStr = incoming.map(n => `${n.type}<-${n.id}`).join(", ");
        const outStr = outgoing.map(n => `${n.type}->${n.id}`).join(", ");
        
        if (inStr) contextStr += `INCOMING: ${inStr}\n`;
        if (outStr) contextStr += `OUTGOING: ${outStr}\n`;
    }

    // 4. Generation
    console.log(`... Retrieved Context:\n${contextStr}\n`);
    console.log(`... Thinking (${provider})`);
    
    const systemPrompt = `You are an expert on the PolyVis project. Answer the user's question using ONLY the provided context. If the context is insufficient, admit you don't know.`;
    const userPrompt = `CONTEXT:\n${contextStr}\n\nQUESTION:\n${query}`;

    let answer = "";
    if (provider === "openai") {
        answer = await queryOpenAI(endpoint, model, systemPrompt, userPrompt);
    } else {
        answer = await queryOllama(endpoint, model, systemPrompt + "\n\n" + userPrompt);
    }
    
    console.log("\n🤖 GRAPH ANSWER:\n");
    console.log(answer);

    db.close();
}

async function queryOllama(endpoint: string, model: string, prompt: string): Promise<string> {
    try {
        const response = await fetch(endpoint, {
            method: "POST",
            body: JSON.stringify({
                model: model,
                prompt: prompt,
                stream: false
            })
        });

        const data = await response.json() as any;
        if (data.error) return `Ollama Error: ${data.error}`;
        return data.response;
    } catch (e) {
        return `Error querying Ollama: ${e}`;
    }
}

async function queryOpenAI(endpoint: string, model: string, system: string, user: string): Promise<string> {
    try {
        const response = await fetch(endpoint, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                model: model,
                messages: [
                    { role: "system", content: system },
                    { role: "user", content: user }
                ],
                temperature: 0.7
            })
        });

        const data = await response.json() as any;
        if (data.error) return `OpenAI/LMS Error: ${JSON.stringify(data.error)}`;
        return data.choices?.[0]?.message?.content || "No response content";
    } catch (e) {
        return `Error querying OpenAI/LMS: ${e}`;
    }
}

main();
