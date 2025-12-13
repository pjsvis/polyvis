import { Database } from "bun:sqlite";
import { join } from "path";
import settings from "@/polyvis.settings.json";

// Types matching Schema
export interface Node {
	id: string;
	type: string;
	label?: string; // stored as 'title'
	content?: string;
	domain?: string;
	layer?: string;
	embedding?: Float32Array;
	hash?: string;
	meta?: any; // JSON object for flexible metadata
}

export class ResonanceDB {
	private db: Database;

	constructor(dbPath?: string) {
		const target =
			dbPath || join(process.cwd(), settings.paths.database.resonance);
		this.db = new Database(target);
		this.db.run("PRAGMA journal_mode = WAL;");

		// GENESIS Schema
		this.db.run(`
            CREATE TABLE IF NOT EXISTS nodes (
                id TEXT PRIMARY KEY,
                type TEXT,
                title TEXT,
                content TEXT,
                domain TEXT,
                layer TEXT,
                embedding BLOB,
                hash TEXT,
                meta TEXT
            );
            
            CREATE TABLE IF NOT EXISTS edges (
                source TEXT,
                target TEXT,
                type TEXT,
                PRIMARY KEY (source, target, type)
            );
            
            CREATE INDEX IF NOT EXISTS idx_edges_source ON edges(source);
            CREATE INDEX IF NOT EXISTS idx_edges_target ON edges(target);
        `);
	}

	insertNode(node: Node) {
		// Ensure columns exist (migrations)
		try {
			this.db.run("ALTER TABLE nodes ADD COLUMN hash TEXT");
		} catch (e) {}
		try {
			this.db.run("ALTER TABLE nodes ADD COLUMN meta TEXT");
		} catch (e) {}

		const stmt = this.db.prepare(`
            INSERT OR REPLACE INTO nodes (id, type, title, content, domain, layer, embedding, hash, meta)
            VALUES ($id, $type, $title, $content, $domain, $layer, $embedding, $hash, $meta)
        `);

		try {
			const blob = node.embedding ? toFafcas(node.embedding) : null;

			stmt.run({
				$id: String(node.id),
				$type: String(node.type),
				$title: node.label ? String(node.label) : null,
				$content: node.content ? String(node.content) : null,
				$domain: String(node.domain || "knowledge"),
				$layer: String(node.layer || "experience"),
				$embedding: blob,
				$hash: node.hash ? String(node.hash) : null,
				$meta: node.meta ? JSON.stringify(node.meta) : null,
			});
		} catch (err) {
			console.error("❌ Failed to insert node:", {
				id: node.id,
				blobSize: node.embedding ? node.embedding.byteLength : 0,
				blobType: node.embedding
					? node.embedding instanceof Float32Array
						? "F32"
						: "Other"
					: "Null",
			});
			throw err;
		}
	}

	insertEdge(source: string, target: string, type: string = "related_to") {
		this.db.run(
			`
            INSERT OR IGNORE INTO edges (source, target, type)
            VALUES (?, ?, ?)
        `,
			[source, target, type],
		);
	}

	findSimilar(
		queryVec: Float32Array,
		limit = 5,
		domain?: string,
	): Array<{ id: string; score: number; label: string }> {
		let sql =
			"SELECT id, title, embedding FROM nodes WHERE embedding IS NOT NULL";
		const params: any[] = [];

		if (domain) {
			sql += " AND domain = ?";
			params.push(domain);
		}

		const rows = this.db.query(sql).all(...params) as any[];
		const results = [];

		for (const row of rows) {
			const raw = row.embedding;
			if (!raw) continue;

			// Cast Uint8Array/Buffer to Float32Array view
			const vec = new Float32Array(
				raw.buffer,
				raw.byteOffset,
				raw.byteLength / 4,
			);

			const score = dotProduct(queryVec, vec);
			results.push({
				id: row.id,
				label: row.title || row.id,
				score,
			});
		}

		return results.sort((a, b) => b.score - a.score).slice(0, limit);
	}

	getNodeHash(id: string): string | null {
		const row = this.db
			.prepare("SELECT hash FROM nodes WHERE id = ?")
			.get(id) as any;
		return row ? row.hash : null;
	}

	getStats() {
		const nodesCount = (
			this.db.query("SELECT COUNT(*) as c FROM nodes").get() as any
		).c;
		const edgesCount = (
			this.db.query("SELECT COUNT(*) as c FROM edges").get() as any
		).c;
		const vectorsCount = (
			this.db
				.query("SELECT COUNT(*) as c FROM nodes WHERE embedding IS NOT NULL")
				.get() as any
		).c;
		const semanticTokensCount = (
			this.db
				.query(
					"SELECT COUNT(*) as c FROM nodes WHERE meta LIKE '%semantic_tokens%'",
				)
				.get() as any
		).c;

		return {
			nodes: nodesCount,
			edges: edgesCount,
			vectors: vectorsCount,
			semantic_tokens: semanticTokensCount,
		};
	}

	/**
	 * Full-Text Search using FTS5
	 * @param query - Search query (supports FTS5 syntax: AND, OR, NOT, phrases)
	 * @param limit - Maximum number of results
	 * @returns Array of matching nodes with BM25 ranking
	 */
	searchText(
		query: string,
		limit = 10,
	): Array<{ id: string; title: string; snippet: string; rank: number }> {
		try {
			const sql = `
				SELECT 
					n.id,
					n.title,
					snippet(nodes_fts, 2, '<mark>', '</mark>', '...', 32) as snippet,
					bm25(nodes_fts) as rank
				FROM nodes_fts
				JOIN nodes n ON nodes_fts.rowid = n.rowid
				WHERE nodes_fts MATCH ?
				ORDER BY rank
				LIMIT ?
			`;

			const rows = this.db.query(sql).all(query, limit) as any[];
			return rows.map((row) => ({
				id: row.id,
				title: row.title || row.id,
				snippet: row.snippet || "",
				rank: row.rank,
			}));
		} catch (error) {
			console.warn("⚠️ FTS search failed. Is FTS5 enabled?", error);
			return [];
		}
	}

	close() {
		this.db.close();
	}
}

// FAFCAS Protocol: use Dot Product for normalized vectors
// Source: playbooks/embeddings-and-fafcas-protocol-playbook.md
export function dotProduct(a: Float32Array, b: Float32Array): number {
	let sum = 0;
	// Modern JS engines SIMD-optimize this loop automatically
	for (let i = 0; i < a.length; i++) {
		sum += (a[i] || 0) * (b[i] || 0);
	}
	return sum;
}

// Source: playbooks/embeddings-and-fafcas-protocol-playbook.md
export function toFafcas(vector: Float32Array): Uint8Array {
	// 1. Calculate Magnitude (L2 Norm)
	let sum = 0;
	for (let i = 0; i < vector.length; i++) {
		const val = vector[i] || 0;
		sum += val * val;
	}
	const magnitude = Math.sqrt(sum);

	// 2. Normalize (Divide by Magnitude)
	// Optimization: If magnitude is 0, return zero vector
	if (magnitude > 1e-6) {
		for (let i = 0; i < vector.length; i++) {
			const val = vector[i] || 0;
			vector[i] = val / magnitude;
		}
	}

	// 3. Serialize to Raw Bytes (FAFCAS Blob)
	return new Uint8Array(vector.buffer, vector.byteOffset, vector.byteLength);
}
