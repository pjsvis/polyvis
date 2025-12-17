import type { Database } from "bun:sqlite";
import settings from "@/polyvis.settings.json";
import { DatabaseFactory } from "./DatabaseFactory";
import { CURRENT_SCHEMA_VERSION, MIGRATIONS } from "./schema";

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
	// biome-ignore lint/correctness/noUnusedPrivateClassMembers: May be used for debugging/diagnostics
	private dbPath: string;
	// biome-ignore lint/correctness/noUnusedPrivateClassMembers: May be used for debugging/diagnostics
	private options: { readonly?: boolean };

	/**
	 * Factory method to load the default Resonance Graph based on settings.
	 */
	static init(options: { readonly?: boolean } = {}): ResonanceDB {
		return new ResonanceDB(settings.paths.database.resonance, options);
	}

	constructor(dbPath: string, options: { readonly?: boolean } = {}) {
		// Ensure directory exists if we are creating it?
		// Database constructor usually handles file creation, but not directory.
		// Assuming directory exists for now as it usually does.
		this.dbPath = dbPath;
		this.options = options;
		// Use Factory to ensure compliant configuration
		// STABILITY FIX: Always force ReadWrite (ignore options.readonly if passed)
		// WAL mode requires all readers to have write access to -shm file.
		this.db = DatabaseFactory.connect(dbPath, { ...options, readonly: false });

		// Always check migration (it's safe now with locking)
		this.migrate();
	}

	private migrate() {
		const row = this.db.query("PRAGMA user_version").get() as {
			user_version: number;
		};
		let currentVersion = row.user_version;

		// Backward Compatibility for existing unversioned DBs
		if (currentVersion === 0) {
			const tables = this.db
				.query(
					"SELECT name FROM sqlite_master WHERE type='table' AND name='nodes'",
				)
				.get();
			if (tables) {
				// DB exists but has version 0. Detect schema state.
				const cols = this.db.query("PRAGMA table_info(nodes)").all() as any[];
				const hasHash = cols.some((c) => c.name === "hash");
				const hasMeta = cols.some((c) => c.name === "meta");

				if (hasHash && hasMeta) {
					currentVersion = 3;
				} else if (hasHash) {
					currentVersion = 2;
				} else {
					currentVersion = 1;
				}
				// Update the version on the file so we don't guess next time
				this.db.run(`PRAGMA user_version = ${currentVersion}`);
			}
		}

		if (currentVersion >= CURRENT_SCHEMA_VERSION) return;

		console.log(
			`📦 ResonanceDB: Migrating from v${currentVersion} to v${CURRENT_SCHEMA_VERSION}...`,
		);

		for (const migration of MIGRATIONS) {
			if (migration.version > currentVersion) {
				// console.log(`   Running Migration v${migration.version}: ${migration.description}`);
				if (migration.sql) {
					this.db.run(migration.sql);
				}
				if (migration.up) {
					migration.up(this.db);
				}
				this.db.run(`PRAGMA user_version = ${migration.version}`);
				currentVersion = migration.version;
			}
		}
	}

	insertNode(node: Node) {
		// No inline migrations here anymore!

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

	getRawDb(): Database {
		return this.db;
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

	// Typed Data Accessors

	// Typed Data Accessors

	/**
	 * Fetch nodes with Safe Limits.
	 * @param options.excludeContent If true, skips 'content' and 'embedding' columns (Large BLOBs).
	 */
	getNodes(
		options: {
			domain?: string;
			type?: string;
			limit?: number;
			offset?: number;
			excludeContent?: boolean; // FAFCAS: Optimization for metadata scans
		} = {},
	): Node[] {
		// Safe Default Limit? User specifically asked to fix unbounded.
		// But for backward compatibility with scripts that expect everything, we might need a high limit or explicit 'unlimited' flag.
		// Let's default to unlimited IF not specified, but strongly encourage limits in docs.
		// Actually, 'sloppy code' implies implicit SELECT * is bad.
		// Let's implement options but keep default behavior 'all' to avoid breaking existing logic silently,
		// BUT we will log a warning if count > 1000 and no limit?
		// No, let's just implement the capabilities first. callers must opt-in to limits.

		const cols = options.excludeContent
			? "id, type, title, domain, layer, hash, meta" // No content, No embedding
			: "*";

		let sql = `SELECT ${cols} FROM nodes WHERE 1=1`;
		const params: any[] = [];

		if (options.domain) {
			sql += " AND domain = ?";
			params.push(options.domain);
		}
		if (options.type) {
			sql += " AND type = ?";
			params.push(options.type);
		}

		if (options.limit) {
			sql += " LIMIT ?";
			params.push(options.limit);
		}
		if (options.offset) {
			sql += " OFFSET ?";
			params.push(options.offset);
		}

		const rows = this.db.query(sql).all(...params) as any[];
		return rows.map((row) => this.mapRowToNode(row));
	}

	getLexicon(): any[] {
		// Optimized: Exclude content/embedding since we only need ID, Title, Aliases
		const _sql =
			"SELECT id, title, meta, content FROM nodes WHERE domain = 'lexicon' AND type = 'concept'";
		// Note: content is 'definition', usually small. Keep it. Embedding is big.
		// Actually, let's select specific columns to avoid embedding blob

		const rows = this.db
			.query(
				"SELECT id, title, meta, content FROM nodes WHERE domain = 'lexicon' AND type = 'concept'",
			)
			.all() as any[];

		return rows.map((row) => {
			const meta = row.meta ? JSON.parse(row.meta) : {};
			return {
				id: row.id,
				label: row.title,
				aliases: meta.aliases || [],
				definition: row.content,
				...meta,
			};
		});
	}

	private mapRowToNode(row: any): Node {
		return {
			id: row.id,
			type: row.type,
			label: row.title,
			content: row.content, // May be undefined if excluded
			domain: row.domain,
			layer: row.layer,
			// Only hydrate embedding if it exists (was selected)
			embedding: row.embedding
				? new Float32Array(
						row.embedding.buffer,
						row.embedding.byteOffset,
						row.embedding.byteLength / 4,
					)
				: undefined,
			hash: row.hash,
			meta: row.meta ? JSON.parse(row.meta) : {},
		};
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
			db_size_bytes:
				(this.db.query("PRAGMA page_count").get() as any).page_count *
				(this.db.query("PRAGMA page_size").get() as any).page_size,
		};
	}

	getNodesByType(type: string): Node[] {
		// Forward to new method
		return this.getNodes({ type });
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

	checkpoint() {
		this.db.run("PRAGMA wal_checkpoint(TRUNCATE);");
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
