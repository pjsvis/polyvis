import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
    CallToolRequestSchema,
    ListToolsRequestSchema,
    ListResourcesRequestSchema,
    ReadResourceRequestSchema
} from "@modelcontextprotocol/sdk/types.js";
import { ResonanceDB } from "@src/resonance/db";
import { VectorEngine } from "@src/core/VectorEngine";
import { join } from "path";
import { ServiceLifecycle } from "../utils/ServiceLifecycle";

const args = process.argv.slice(2);
const command = args[0] || "serve"; 

// --- Service Lifecycle ---

const lifecycle = new ServiceLifecycle({
    name: "MCP",
    pidFile: ".mcp.pid",
    logFile: ".mcp.log",
    entryPoint: "src/mcp/index.ts"
});

// --- Server Logic ---

async function runServer() {
    // console.error("🚀 PolyVis MCP Server Initializing..."); // Silenced to prevent MCP protocol pollution
    
    // 1. Initialize DB & Engines
    // This will now use the ROBUST configuration from db.ts (WAL + 5s Timeout)
    // FIX: Use absolute path relative to this script to prevent CWD drift in MCP Client
    const dbPath = join(import.meta.dir, "../../public/resonance.db"); 

    // STABILITY: Use standard ReadWrite connection for WAL support
    const db = new ResonanceDB(dbPath);
    // SHARED CONNECTION: Pass the raw DB instance from ResonanceDB to VectorEngine
    const vectorEngine = new VectorEngine(db.getRawDb());

    // 2. Setup Server
    const server = new Server(
        { name: "polyvis-mcp", version: "1.0.0" },
        { capabilities: { tools: {}, resources: {} } }
    );

    // 3. Define Constants
    const TOOLS = {
        SEARCH: "search_documents",
        READ: "read_node_content",
        EXPLORE: "explore_links",
        LIST: "list_directory_structure",
        GARDEN: "inject_tags",
    };

    // 4. Register Handlers
    server.setRequestHandler(ListToolsRequestSchema, async () => {
        return {
            tools: [
                {
                    name: TOOLS.SEARCH,
                    description: "Search the Knowledge Graph using Hybrid (Vector + Keyword) search.",
                    inputSchema: {
                        type: "object",
                        properties: {
                            query: { type: "string" },
                            limit: { type: "number", default: 20 },
                        },
                        required: ["query"],
                    },
                },
                {
                    name: TOOLS.READ,
                    description: "Read the full markdown content of a specific node.",
                    inputSchema: {
                        type: "object",
                        properties: { id: { type: "string" } },
                        required: ["id"],
                    },
                },
                {
                    name: TOOLS.EXPLORE,
                    description: "Find related nodes (Graph Traversal).",
                    inputSchema: {
                        type: "object",
                        properties: {
                            id: { type: "string" },
                            relation: { type: "string" },
                        },
                        required: ["id"],
                    },
                },
                {
                    name: TOOLS.LIST,
                    description: "List the directory structure of the document set.",
                    inputSchema: { type: "object", properties: {} },
                },
                {
                    name: TOOLS.GARDEN,
                    description: "Inject semantic tags into a source file (Gardener Agent).",
                    inputSchema: {
                        type: "object",
                        properties: {
                            file_path: { type: "string" },
                            tags: { type: "array", items: { type: "string" } },
                        },
                        required: ["file_path", "tags"],
                    },
                },
            ],
        };
    });

    server.setRequestHandler(CallToolRequestSchema, async (request) => {
        const { name, arguments: args } = request.params;
        try {
            if (name === TOOLS.SEARCH) {
                const query = String(args?.query);
                const limit = Number(args?.limit || 20);
                const candidates = new Map<string, { id: string, score: number, preview: string, source: string }>();
                const errors: string[] = [];

                // Vector Search
                try {
                    const vectorResults = await vectorEngine.search(query, limit);
                    for (const r of vectorResults) {
                        candidates.set(r.id, {
                            id: r.id, score: r.score, preview: r.content.slice(0, 200).replace(/\n/g, " "), source: "vector"
                        });
                    }
                } catch (e: any) {
                    console.error(`Vector Search Error: ${e.message}`);
                    errors.push(e.message);
                }

                // FTS Search
                try {
                    const ftsResults = db.searchText(query, limit);
                    for (const r of ftsResults) {
                        const existing = candidates.get(r.id);
                        if (existing) {
                            existing.score += 0.2; 
                            existing.source = "hybrid";
                        } else {
                            candidates.set(r.id, {
                                id: r.id, score: 0.5, preview: r.snippet || r.title, source: "keyword"
                            });
                        }
                    }
                } catch (e: any) {
                    console.error(`FTS Search Error: ${e.message}`);
                    errors.push(e.message);
                }

                const results = Array.from(candidates.values())
                    .sort((a, b) => b.score - a.score)
                    .slice(0, limit)
                    .map(r => ({ ...r, score: r.score.toFixed(3) }));

                if (results.length === 0 && errors.length > 0) {
                     return { content: [{ type: "text", text: `Search Error: ${errors.join(", ")}` }], isError: true };
                }
                return { content: [{ type: "text", text: JSON.stringify(results, null, 2) }] };
            }

            if (name === TOOLS.READ) {
                const id = String(args?.id);
                const row = db.getRawDb().query("SELECT content FROM nodes WHERE id = ?").get(id) as any;
                if (!row) return { content: [{ type: "text", text: "Node not found." }] };
                return { content: [{ type: "text", text: row.content }] };
            }

            if (name === TOOLS.EXPLORE) {
                const id = String(args?.id);
                const relation = args?.relation ? String(args.relation) : undefined;
                let sql = "SELECT target, type FROM edges WHERE source = ?";
                const params = [id];
                if (relation) { sql += " AND type = ?"; params.push(relation); }
                const rows = db.getRawDb().query(sql).all(...params) as any[];
                return { content: [{ type: "text", text: JSON.stringify(rows, null, 2) }] };
            }

            if (name === TOOLS.LIST) {
                const structure = ["briefs/", "debriefs/", "playbooks/", "docs/", "notes/"];
                return { content: [{ type: "text", text: JSON.stringify(structure, null, 2) }] };
            }

            if (name === TOOLS.GARDEN) {
                const filePath = String(args?.file_path);
                const tags = args?.tags as string[];
                const content = await Bun.file(filePath).text();
                const tagBlock = `\n<!-- tags: ${tags.join(", ")} -->\n`;
                const newContent = content.endsWith("\n") ? content + tagBlock : content + "\n" + tagBlock;
                await Bun.write(filePath, newContent);
                return { content: [{ type: "text", text: `Injected ${tags.length} tags into ${filePath}` }] };
            }

            return { content: [{ type: "text", text: `Tool ${name} not found.` }], isError: true };

        } catch (error) {
            console.error("Tool execution failed:", error);
            return { content: [{ type: "text", text: `Error: ${error}` }], isError: true };
        }
    });

    server.setRequestHandler(ListResourcesRequestSchema, async () => {
        return {
            resources: [{ uri: "polyvis://stats/summary", name: "System Stats", mimeType: "text/plain" }]
        };
    });

    server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
        if (request.params.uri === "polyvis://stats/summary") {
            const stats = db.getStats();
            const text = `Nodes: ${stats.nodes}\nEdges: ${stats.edges}\nVectors: ${stats.vectors}\nSize: ${(stats.db_size_bytes / 1024 / 1024).toFixed(2)} MB`;
            return { contents: [{ uri: request.params.uri, mimeType: "text/plain", text }] };
        }
        throw new Error("Resource not found");
    });

    // 5. Connect Transport
    const transport = new StdioServerTransport();
    await server.connect(transport);
    // console.error("✅ PolyVis MCP Server Running (Concurrency Mode: WAL+Timeout)"); // Silenced
}

// --- Dispatch ---

await lifecycle.run(command, runServer);
