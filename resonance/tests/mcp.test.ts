import { describe, test, expect } from "bun:test";
import { spawn } from "bun";
import path from "path";

// Helper to communicate with MCP Server process
async function runMcpQuery(request: any): Promise<any> {
    const serverPath = path.join(import.meta.dir, "../src/index.ts");
    
    // Spawn a fresh process for each request to avoid state/stream complexity in simple tests
    // In a real scenario, we'd keep the connection open.
    const proc = spawn(["bun", "run", serverPath, "serve"], {
        stdin: "pipe",
        stdout: "pipe",
        cwd: path.join(import.meta.dir, "..")
    });

    const reader = proc.stdout.getReader();
    
    // Send Request
    const str = JSON.stringify(request) + "\n";
    proc.stdin.write(str);
    proc.stdin.flush();

    // Read Response
    // We expect the server to respond fairly quickly.
    // We'll read loop until we find a response with the same ID.
    const startTime = Date.now();
    
    try {
        while (Date.now() - startTime < 3000) { // 3s timeout
            const { value, done } = await reader.read();
            if (done) break;
            if (value) {
                const text = new TextDecoder().decode(value);
                const lines = text.trim().split("\n");
                for (const line of lines) {
                    try {
                        const json = JSON.parse(line);
                        // If it matches our ID, return it
                        if (json.id === request.id) {
                            proc.kill();
                            return json;
                        }
                    } catch (e) {
                        // ignore partials
                    }
                }
            }
        }
    } finally {
        proc.kill();
    }
    return null;
}

describe("Resonance MCP Server", () => {
    
    test("Initialize Handshake", async () => {
        const response = await runMcpQuery({
            jsonrpc: "2.0",
            id: 1,
            method: "initialize",
            params: {
                protocolVersion: "2024-11-05",
                capabilities: {},
                clientInfo: { name: "test", version: "1.0" }
            }
        });
        
        expect(response).not.toBeNull();
        expect(response.result).toBeDefined();
        expect(response.result.serverInfo.name).toBe("resonance-mcp");
    });

    test("List Tools (expect query_graph)", async () => {
        // We need to initialize first usually, but the stateless spawn might let us get away 
        // with just sending the request if the server doesn't enforce strict state (sdk usually creates fresh server).
        // However, the MCP SDK might require initialize first.
        // Let's try sending init then list in one go if needed. 
        // But for "spawn fresh process", we can't easily chain without keeping process.
        // Let's refactor runMcpQuery to take a sequence if needed, OR just implementing a slightly smarter client.
        
        // Actually, let's keep it simple: The server usually needs an 'initialize' request first.
        // So we will implement a mini-session usage in this test.
        
        const serverPath = path.join(import.meta.dir, "../src/index.ts");
        const proc = spawn(["bun", "run", serverPath, "serve"], {
            stdin: "pipe",
            stdout: "pipe",
            cwd: path.join(import.meta.dir, "..")
        });
        
        const reader = proc.stdout.getReader();
        const send = (msg: any) => {
             proc.stdin.write(JSON.stringify(msg) + "\n");
             proc.stdin.flush();
        };
        
        let buffer = "";
        const readMsg = async (): Promise<any> => {
            while (true) {
                const { value, done } = await reader.read();
                if (done) return null;
                buffer += new TextDecoder().decode(value);
                
                const newlineIdx = buffer.indexOf("\n");
                if (newlineIdx !== -1) {
                    const line = buffer.slice(0, newlineIdx);
                    buffer = buffer.slice(newlineIdx + 1);
                    try {
                        if (line.trim()) return JSON.parse(line);
                    } catch(e) {}
                }
            }
        };

        // 1. Init
        send({
            jsonrpc: "2.0",
            id: 1,
            method: "initialize",
            params: { protocolVersion: "2024-11-05", capabilities: {}, clientInfo: { name: "test", version: "1.0" } }
        });
        // Read until we get response 1
        let res;
        while((res = await readMsg()) && res.id !== 1);
        expect(res.result.serverInfo.name).toBe("resonance-mcp");
        
        // 2. Notification
        send({ jsonrpc: "2.0", method: "notifications/initialized" });

        // 3. List Tools
        send({ jsonrpc: "2.0", id: 2, method: "tools/list" });
        while((res = await readMsg()) && res.id !== 2);
        
        expect(res.result.tools).toBeArray();
        const toolNames = res.result.tools.map((t: any) => t.name);
        expect(toolNames).toContain("query_graph");

        proc.kill();
    });
});
