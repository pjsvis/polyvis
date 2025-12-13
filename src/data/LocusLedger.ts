import { Database } from "bun:sqlite";
import { randomUUID } from "crypto";
import { DB_PATHS } from "../config/constants";

export class LocusLedger {
	private db: Database;

	constructor(dbPath: string = DB_PATHS.LEDGER) {
		this.db = new Database(dbPath, { create: true });
		this.initialize();
	}

	/**
	 * Initialize the schema.
	 * We index by canon_hash to ensure O(1) lookups during the boxing phase.
	 */
	private initialize() {
		this.db
			.query(`
      CREATE TABLE IF NOT EXISTS bento_map (
        canon_hash TEXT PRIMARY KEY,
        locus_id TEXT NOT NULL,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
      );
    `)
			.run();
	}

	/**
	 * The core idempotent operation.
	 * If the content hash exists, return the existing ID.
	 * If not, mint a new one, persist it, and return it.
	 */
	public getOrMintId(contentHash: string): string {
		const query = this.db.query(
			"SELECT locus_id FROM bento_map WHERE canon_hash = $hash",
		);
		const result = query.get({ $hash: contentHash }) as {
			locus_id: string;
		} | null;

		if (result) {
			return result.locus_id;
		}

		const newId = randomUUID();
		this.db
			.query("INSERT INTO bento_map (canon_hash, locus_id) VALUES ($hash, $id)")
			.run({ $hash: contentHash, $id: newId });

		return newId;
	}

	/**
	 * Utility: Generate a simple hash for text content.
	 * Uses Bun's native hashing capabilities for speed.
	 */
	public static hashContent(text: string): string {
		const hasher = new Bun.CryptoHasher("md5"); // MD5 is sufficient for local content collision detection
		hasher.update(text.trim());
		return hasher.digest("hex");
	}
}
