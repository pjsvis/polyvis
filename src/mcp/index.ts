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

// 1. Initialize Server
const server = new Server(
    {
        name: "polyvis-mcp",
        version: "1.0.0",
    },
    {
        capabilities: {
            tools: {},
            resources: {},
        },
    }
);

// 2. Initialize Engines
// We lazily load these or init them globally?
// Since MCP is persistent, we can init them once.
const dbPath = "public/resonance.db"; // Should come from settings in production
const db = new ResonanceDB(dbPath);
const vectorEngine = new VectorEngine(dbPath);

console.error("🚀 PolyVis MCP Server Starting..."); // Stderr for logs

// 3. Define Tools
const TOOLS = {
    SEARCH: "search_documents",
    READ: "read_node_content",
    EXPLORE: "explore_links",
    LIST: "list_directory_structure",
    GARDEN: "inject_tags",
};

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
                    properties: {
                        id: { type: "string" },
                    },
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

// 4. Handle Tools
server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;

    try {
        if (name === TOOLS.SEARCH) {
            const query = String(args?.query);
            const limit = Number(args?.limit || 20);
            
            const candidates = new Map<string, { id: string, score: number, preview: string, source: string }>();
            const errors: string[] = [];

            // 1. Vector Search (Semantic)
            try {
                const vectorResults = await vectorEngine.search(query, limit);
                for (const r of vectorResults) {
                     candidates.set(r.id, {
                         id: r.id,
                         score: r.score,
                         preview: r.content.slice(0, 200).replace(/\n/g, " "),
                         source: "vector"
                     });
                }
            } catch (e: any) {
                const msg = `Vector Search Failed: ${e.message}`;
                console.error(msg);
                errors.push(msg);
            }

            // 2. FTS Search (Keyword)
            try {
                const ftsResults = db.searchText(query, limit);
                for (const r of ftsResults) {
                    const existing = candidates.get(r.id);
                    if (existing) {
                        existing.score += 0.2; // Boost on match
                        existing.source = "hybrid";
                    } else {
                        candidates.set(r.id, {
                            id: r.id,
                            score: 0.5,
                            preview: r.snippet || r.title,
                            source: "keyword"
                        });
                    }
                }
            } catch (e: any) {
                const msg = `FTS Search Failed: ${e.message}`;
                console.error(msg);
                errors.push(msg);
            }
            
            // 3. Sort & Format
            const results = Array.from(candidates.values())
                .sort((a, b) => b.score - a.score)
                .slice(0, limit)
                .map(r => ({
                    id: r.id,
                    score: r.score.toFixed(3),
                    source: r.source,
                    preview: r.preview
                }));

            if (results.length === 0 && errors.length > 0) {
                 return {
                    content: [{ type: "text", text: `Search returned no results. Errors encountered:\n${errors.join("\n")}` }],
                    isError: true, // Mark as error to highlight
                };
            }

            return {
                content: [{ type: "text", text: JSON.stringify(results, null, 2) }],
            };
        }

        if (name === TOOLS.READ) {
            const id = String(args?.id);
            // We need a method to get full node content. 
            // ResonanceDB.getNodesByType returns everything, but inefficient for one node?
            // Let's use raw query for speed
            const row = db.getRawDb().query("SELECT content, meta FROM nodes WHERE id = ?").get(id) as any;
            
            if (!row) return { content: [{ type: "text", text: "Node not found." }] };
            
            return {
                content: [{ type: "text", text: row.content }],
            };
        }

        if (name === TOOLS.EXPLORE) {
            const id = String(args?.id);
            const relation = args?.relation ? String(args.relation) : undefined;
            
            let sql = "SELECT target, type FROM edges WHERE source = ?";
            const params = [id];
            
            if (relation) {
                sql += " AND type = ?";
                params.push(relation);
            }
            
            const rows = db.getRawDb().query(sql).all(...params) as any[];
            return {
                 content: [{ type: "text", text: JSON.stringify(rows, null, 2) }],
            };
        }

        if (name === TOOLS.LIST) {
             // Quick scan of DB to find active domains? Or FS scan?
             // Since we have settings, let's list config
             // Actually, let's just return the directory tree of tracked sources?
             // Simpler: Scan DB for unique 'source' paths in meta?
             // Or just hardcode the high level folders for now based on settings.
             const structure = [
                 "briefs/",
                 "debriefs/",
                 "playbooks/",
                 "docs/",
                 "notes/"
             ];
             return {
                 content: [{ type: "text", text: JSON.stringify(structure, null, 2) }],
             };
        }

        if (name === TOOLS.GARDEN) {
            const filePath = String(args?.file_path);
            const tags = args?.tags as string[];
            
            // Reuse AutoTagger logic?
            // Actually, we just need to inject.
            const content = await Bun.file(filePath).text();
            
            // Simple Injection (Append)
            const tagBlock = `\n<!-- tags: ${tags.join(", ")} -->\n`;
            
            const newContent = content.endsWith("\n") 
                ? content + tagBlock 
                : content + "\n" + tagBlock;
                
            await Bun.write(filePath, newContent);
            
            return {
                content: [{ type: "text", text: `Successfully injected ${tags.length} tags into ${filePath}` }],
            };
        }

        return {
            content: [{ type: "text", text: `Tool ${name} not found.` }],
            isError: true,
        };
    } catch (error) {
        console.error("Tool execution failed:", error);
         return {
            content: [{ type: "text", text: `Error: ${error}` }],
            isError: true,
        };
    }
});

// 5. Handle Resources (Stats)
server.setRequestHandler(ListResourcesRequestSchema, async () => {
    return {
        resources: [
            {
                uri: "polyvis://stats/summary",
                name: "System Stats",
                mimeType: "text/plain",
            }
        ]
    };
});

server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
    if (request.params.uri === "polyvis://stats/summary") {
        const stats = db.getStats();
        const text = `
Nodes: ${stats.nodes}
Edges: ${stats.edges}
Vectors: ${stats.vectors}
Size: ${(stats.db_size_bytes / 1024 / 1024).toFixed(2)} MB
        `.trim();
        
        return {
            contents: [{ uri: request.params.uri, mimeType: "text/plain", text }]
        };
    }
    throw new Error("Resource not found");
});

// Run Server
async function run() {
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error("PolyVis MCP Server running on stdio");
}

run().catch(console.error);
