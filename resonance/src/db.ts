import { Database } from "bun:sqlite";
import path from "path";
import fs from "fs";

export class ResonanceDB {
	private db: Database;

	constructor(root: string) {
		const dbPath = path.join(root, ".resonance", "resonance.db");
		// Ensure directory exists (init command usually does this)
		const dir = path.dirname(dbPath);
		if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

		this.db = new Database(dbPath);
		this.initSchema();
	}

	private initSchema() {
		this.db.exec(`
            CREATE TABLE IF NOT EXISTS nodes (
                id TEXT PRIMARY KEY,
                type TEXT NOT NULL,
                title TEXT,
                content TEXT,
                path TEXT,
                metadata TEXT, -- JSON
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS edges (
                source TEXT,
                target TEXT,
                type TEXT,
                metadata TEXT, -- JSON
                PRIMARY KEY (source, target, type)
            );
        `);
	}

	upsertNode(node: {
		id: string;
		type: string;
		title: string;
		content: string;
		path: string;
		metadata?: any;
	}) {
		const query = this.db.prepare(`
            INSERT INTO nodes (id, type, title, content, path, metadata, updated_at)
            VALUES ($id, $type, $title, $content, $path, $metadata, CURRENT_TIMESTAMP)
            ON CONFLICT(id) DO UPDATE SET
                title = excluded.title,
                content = excluded.content,
                metadata = excluded.metadata,
                updated_at = CURRENT_TIMESTAMP
        `);

		query.run({
			$id: node.id,
			$type: node.type,
			$title: node.title,
			$content: node.content,
			$path: node.path,
			$metadata: JSON.stringify(node.metadata || {}),
		});
	}

	createEdge(edge: { source: string; target: string; type: string }) {
		const query = this.db.prepare(`
            INSERT OR IGNORE INTO edges (source, target, type)
            VALUES ($source, $target, $type)
        `);
		query.run({
			$source: edge.source,
			$target: edge.target,
			$type: edge.type,
		});
	}

	updateNodeContent(id: string, content: string) {
		const query = this.db.prepare(`
            UPDATE nodes SET content = $content, updated_at = CURRENT_TIMESTAMP WHERE id = $id
        `);
		query.run({ $id: id, $content: content });
	}

    query(sql: string, params: any = {}) {
        return this.db.query(sql).all(params);
    }

    getObject(id: string) {
        return this.db.query("SELECT * FROM nodes WHERE id = $id").get({ $id: id });
    }

	close() {
		this.db.close();
	}
}
