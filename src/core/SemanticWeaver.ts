import { ResonanceDB } from "@src/resonance/db";

export class SemanticWeaver {
	static weave(db: ResonanceDB) {
		console.log("🧠 SemanticWeaver: Initializing Orphan Rescue...");

		// 1. Identify Orphans (Nodes with no edges AND available embedding)
		// Query: ID not in source AND not in target
		// Note: This matches the verification script logic but optimized for DB operation
		const orphans = db.getRawDb().query(`
            SELECT n.id, n.embedding, n.title
            FROM nodes n
            LEFT JOIN edges e1 ON n.id = e1.source
            LEFT JOIN edges e2 ON n.id = e2.target
            WHERE e1.source IS NULL 
              AND e2.target IS NULL
              AND n.embedding IS NOT NULL -- Must have vector
              AND n.type != 'root'
              AND n.type != 'domain'
        `).all() as any[];

		if (orphans.length === 0) {
			console.log("🧠 SemanticWeaver: No orphans found to rescue.");
			return;
		}

		console.log(`🧠 SemanticWeaver: Found ${orphans.length} orphans with embeddings.`);

		let rescuedCount = 0;

		// 2. Rescue Mission
		for (const orphan of orphans) {
			// Convert BLOB to Float32Array (ResonanceDB already has logic, but we need raw access or re-use findSimilar)
			// Problem: db.findSimilar expects Float32Array query.
			// orphan.embedding is returned as a Buffer/Uint8Array from SQLite.
			
			const raw = orphan.embedding;
			const vec = new Float32Array(
				raw.buffer,
				raw.byteOffset,
				raw.byteLength / 4,
			);

			// Search for "Experience" (Content Clustering)
			// Pivot: Concepts have no vectors, so we cluster related content instead.
			const matches = db.findSimilar(vec, 3, "experience");
			
			// Filter matches
			const validMatches = matches.filter(m => m.score > 0.85 && m.id !== orphan.id);

			if (validMatches.length > 0) {
				// Link to the best match (Top 1)
				const best = validMatches[0];
				
				if (best) {
					// Edge: Orphan RELATED_TO Concept
					db.insertEdge(orphan.id, best.id, "RELATED_TO");
					rescuedCount++;
				}
			} else if (matches.length > 0) {
				// Debug: Log near misses
				// console.log(`   - Missed '${orphan.title}': Top match ${matches[0].score.toFixed(2)}`);
			}
		}

		console.log(`🧠 SemanticWeaver: Rescued ${rescuedCount} orphans.`);
	}
}
