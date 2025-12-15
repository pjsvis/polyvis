
import { Ingestor } from "@src/pipeline/Ingestor";
import { parseArgs } from "util";
import { Database } from "bun:sqlite";
import settings from "@/polyvis.settings.json";

/**
 * PHASE 2: EXPERIENCE
 * Ingests Documents, Playbooks, and Debriefs.
 */
async function main() {
    console.log("\n\n📚 [BUILD: EXPERIENCE] Starting...\n");
    
    // Check if we are in "Update Mode" (via args) or Full Rebuild
    // For simplicity, we just run the ingestor logic which is idempotent-ish
    const { values } = parseArgs({
        args: Bun.argv,
        options: {
            file: { type: "string" },
            dir: { type: "string" },
            db: { type: "string" },
        },
        strict: false,
    });

    const dbPath = values.db ? String(values.db) : settings.paths.database.resonance;
    const ingestor = new Ingestor(dbPath);
    
    // We need a raw SQLite connection for the method signature (and validator)
    // Ingestor.ts methods interact with ResonanceDB instance internally, 
    // but runExperience takes sqliteDb for validation.
    // Ideally we should refactor runExperience to NOT need external sqliteDb param, but for now...
    // Wait, Ingestor.init() returns it.
    // I can't call init() easily because it's private.
    // I'll just instantiate local one.
    
    const sqliteDb = new Database(dbPath);
    
    // Ensure Embedder is ready
    const embedder = (ingestor as any).embedder; // Private access workaround or just trust it
    await embedder.embed("init");

    await ingestor.runExperience({
        file: values.file ? String(values.file) : undefined,
        dir: values.dir ? String(values.dir) : undefined,
    }, [], sqliteDb);
    
    sqliteDb.close(); // Clean up the local connection
    // ingestor.cleanup() is private? The CLI script should handle process exit which cleans up.
    
    console.log("\n📚 [BUILD: EXPERIENCE] Complete.\n");
    process.exit(0);
}

if (import.meta.main) {
    main().catch(e => {
        console.error("❌ Experience Build Failed:", e);
        process.exit(1);
    });
}
