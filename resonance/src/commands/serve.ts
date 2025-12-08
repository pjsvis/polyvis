import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
	CallToolRequestSchema,
	ListResourcesRequestSchema,
	ListToolsRequestSchema,
	ReadResourceRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { ResonanceDB } from "../db.js";

// Define Tool Interface
const TOOLS = [
	{
		name: "query_graph",
		description:
			"Execute a READ-ONLY SQL query against the Resonance Knowledge Graph (SQLite). Tables: nodes(id, type, title, content, path), edges(source, target, type).",
		inputSchema: {
			type: "object",
			properties: {
				sql: {
					type: "string",
					description: "The SQL query to execute (SELECT only).",
				},
			},
			required: ["sql"],
		},
	},
];

export async function serveCommand() {
	const db = new ResonanceDB(process.cwd());

	const server = new Server(
		{
			name: "resonance-mcp",
			version: "1.0.0",
		},
		{
			capabilities: {
				resources: {},
				tools: {},
			},
		},
	);

	// --- Resources ---

	server.setRequestHandler(ListResourcesRequestSchema, async () => {
		const nodes = db.query(
			"SELECT id, title, type, path FROM nodes ORDER BY updated_at DESC LIMIT 100",
		) as any[];

		return {
			resources: nodes.map((node) => ({
				uri: `resonance://${node.type}/${node.id}`,
				name: node.title || node.id,
				mimeType: "text/markdown",
				description: `[${node.type}] ${node.path}`,
			})),
		};
	});

	server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
		const url = new URL(request.params.uri);
		const id = url.pathname.replace(/^\//, ""); // Remove leading slash

		const node = db.getObject(id) as any;

		if (!node) {
			throw new Error(`Node not found: ${id}`);
		}

		return {
			contents: [
				{
					uri: request.params.uri,
					mimeType: "text/markdown",
					text: `# ${node.title || node.id}\n\n${node.content}`,
				},
			],
		};
	});

	// --- Tools ---

	server.setRequestHandler(ListToolsRequestSchema, async () => {
		return {
			tools: TOOLS,
		};
	});

	server.setRequestHandler(CallToolRequestSchema, async (request) => {
		const { name, arguments: args } = request.params;

		if (name === "query_graph") {
			const sql = (args as any).sql;
			if (!sql || !sql.toLowerCase().startsWith("select")) {
				throw new Error("Only SELECT queries are allowed.");
			}

			try {
				const results = db.query(sql);
				return {
					content: [
						{
							type: "text",
							text: JSON.stringify(results, null, 2),
						},
					],
				};
			} catch (err) {
				return {
					content: [
						{
							type: "text",
							text: `Error: ${(err as Error).message}`,
						},
					],
					isError: true,
				};
			}
		}

		throw new Error(`Tool not found: ${name}`);
	});

	// --- Start Server ---
	const transport = new StdioServerTransport();
	await server.connect(transport);
	//console.error("Resonance MCP Server running on stdio...");
}
