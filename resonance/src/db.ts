import { Database } from "bun:sqlite";
import { join } from "path";

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
}

export class ResonanceDB {
    private db: Database;

    constructor(dbPath?: string) {
        const target = dbPath || join(process.cwd(), ".resonance/resonance.db");
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
                hash TEXT
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
        // Ensure hash column exists (migration for existing DB)
        try {
            this.db.run("ALTER TABLE nodes ADD COLUMN hash TEXT");
        } catch (e) {
            // Column likely exists
        }

        const stmt = this.db.prepare(`
            INSERT OR REPLACE INTO nodes (id, type, title, content, domain, layer, embedding, hash)
            VALUES ($id, $type, $title, $content, $domain, $layer, $embedding, $hash)
        `);
        
        stmt.run({
            $id: node.id,
            $type: node.type,
            $title: node.label || null,
            $content: node.content || null,
            $domain: node.domain || "knowledge",
            $layer: node.layer || "experience",
            $embedding: node.embedding ? toFafcas(node.embedding) : null,
            $hash: node.hash || null
        });
    }

    insertEdge(source: string, target: string, type: string = "related_to") {
        this.db.run(`
            INSERT OR IGNORE INTO edges (source, target, type)
            VALUES (?, ?, ?)
        `, [source, target, type]);
    }

    findSimilar(queryVec: Float32Array, limit = 5, domain?: string): Array<{ id: string; score: number; label: string }> {
        let sql = "SELECT id, title, embedding FROM nodes WHERE embedding IS NOT NULL";
        let params: any[] = [];
        
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
            const vec = new Float32Array(raw.buffer, raw.byteOffset, raw.byteLength / 4);
            
            const score = dotProduct(queryVec, vec);
            results.push({ 
                id: row.id, 
                label: row.title || row.id, 
                score 
            });
        }
        
        return results.sort((a, b) => b.score - a.score).slice(0, limit);
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
        sum += a[i] * b[i];
    }
    return sum;
}

// Source: playbooks/embeddings-and-fafcas-protocol-playbook.md
export function toFafcas(vector: Float32Array): Uint8Array {
    // 1. Calculate Magnitude (L2 Norm)
    let sum = 0;
    for (let i = 0; i < vector.length; i++) {
        sum += vector[i] * vector[i];
    }
    const magnitude = Math.sqrt(sum);

    // 2. Normalize (Divide by Magnitude)
    // Optimization: If magnitude is 0, return zero vector
    if (magnitude > 1e-6) {
        for (let i = 0; i < vector.length; i++) {
            vector[i] /= magnitude;
        }
    }

    // 3. Serialize to Raw Bytes (FAFCAS Blob)
    return new Uint8Array(vector.buffer, vector.byteOffset, vector.byteLength);
}
