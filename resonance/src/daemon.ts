
import { Embedder } from "./services/embedder";

const PORT = parseInt(process.env.VECTOR_PORT || "3010");

console.log(`🔌 Vector Daemon starting on port ${PORT}...`);
console.log(`   Initializing Embedder (this may take a few seconds)...`);

// Pre-warm the embedder
try {
    const embedder = Embedder.getInstance();
    // Force local initialization by bypassing the remote check 
    // (since we ARE the remote service)
    // Actually, Embedder.getInstance() is just the singleton.
    // We need to call embed() to trigger the init, but embed() now might try to hit the network loopback if we are not careful.
    // Wait, if I change embedder.ts to hit localhost:3010, and this daemon USES embedder.ts, 
    // infinite loop risk if not careful?
    
    // Ah, `embedder.ts` logic will be:
    // check remote -> if fail -> load local.
    // If I start this daemon, the first check to remote might fail (connection refused) OR it might hang if we are already listening?
    // Actually, the Daemon should instantiate the underlying model directly or control the Embedder to force local mode.
    
    // Let's look at `embedder.ts` design again.
    // To simplify, let's just use `embedder.getInstance().embed("warmup")`. 
    // If it tries to hit localhost:3010, it will fail (since we haven't started serving yet), so it will fall back to local load.
    // Which is exactly what we want!
    
    await embedder.embed("warmup");
    console.log(`   ✅ Embedder Ready.`);
} catch (e) {
    console.error("   ❌ Failed to initialize embedder:", e);
    process.exit(1);
}

const server = Bun.serve({
    port: PORT,
    async fetch(req) {
        const url = new URL(req.url);
        
        // GET /health
        if (req.method === "GET" && url.pathname === "/health") {
            return new Response(JSON.stringify({ status: "ok" }), {
                headers: { "Content-Type": "application/json" },
            });
        }

        // POST /embed
        if (req.method === "POST" && url.pathname === "/embed") {
            try {
                const body = await req.json() as { text: string };
                if (!body.text || typeof body.text !== "string") {
                     return new Response("Bad Request: 'text' field required", { status: 400 });
                }
                
                // Get embedding
                // Note: The Embedder class will try to hit localhost:3010 again?
                // We need to ensure the Daemon uses the 'native' embedder always.
                // We can do this by inspecting the request or just making Embedder aware it is in daemon mode?
                // Or simply: If the request fails, it falls back to local.
                // But inside the daemon, we WANT it to be local. 
                // We don't want the overhead of a failed HTTP call for every request handled BY the server.
                
                // Solution: We will add a `forceLocal` flag to Embedder.
                const vector = await Embedder.getInstance().embed(body.text, true); 
                
                // Convert Float32Array to regular array for JSON serialization
                return new Response(JSON.stringify({ vector: Array.from(vector) }), {
                     headers: { "Content-Type": "application/json" },
                });
            } catch (e) {
                console.error(e);
                return new Response("Internal Server Error", { status: 500 });
            }
        }

        return new Response("Not Found", { status: 404 });
    },
});

console.log(`🚀 Vector Daemon listening on http://localhost:${PORT}`);
