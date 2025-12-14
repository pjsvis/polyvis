import { Embedder } from "@resonance/src/services/embedder";
import { ResonanceDB } from "@resonance/src/db";
import { LLMClient } from "@src/core/LLMClient";
import settings from "@/polyvis.settings.json";
import { join } from "path";
import { parseArgs } from "util";

async function main() {
    const { positionals } = parseArgs({
        args: Bun.argv,
        options: {},
        strict: false,
        allowPositionals: true,
    });

    const query = positionals[2];
    if (!query) {
        console.log("Usage: bun run scripts/query/ask_graph.ts \"Question\"");
        process.exit(1);
    }

    console.log(`🔎 Asking Graph: "${query}"`);

    // 1. Initialize
    const dbPath = join(process.cwd(), settings.paths.database.resonance);
    const db = new ResonanceDB(dbPath);
    const embedder = Embedder.getInstance();
    const llm = await LLMClient.getInstance();

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
    console.log(`... Thinking (LLMClient)`);
    
    const systemPrompt = `You are an expert on the PolyVis project. Answer the user's question using ONLY the provided context. If the context is insufficient, admit you don't know.`;
    const userPrompt = `CONTEXT:\n${contextStr}\n\nQUESTION:\n${query}`;

    try {
        const answer = await llm.generate(userPrompt, systemPrompt);
        console.log("\n🤖 GRAPH ANSWER:\n");
        console.log(answer);
    } catch (error) {
        console.error("Error generating answer:", error);
    }

    db.close();
}

main();
