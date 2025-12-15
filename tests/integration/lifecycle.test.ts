import { ResonanceDB } from "@src/resonance/db";
import { Ingestor } from "@src/pipeline/Ingestor";
import { VectorEngine } from "@src/core/VectorEngine";
import { $ } from "bun";
import { join } from "path";

const dbPath = "public/resonance.db";
const db = new ResonanceDB(dbPath);
const vectorEngine = new VectorEngine(dbPath);
const testFile = "docs/test_lifecycle_E2E.md";
const testId = "test-lifecycle-e2e";

async function run() {
    console.log("🚦 Starting E2E Lifecycle Test...");

    // --- PHASE 1: CREATE ---
    console.log(`\n📝 [1/5] Creating Test Document '${testFile}'...`);
    const content = `# Lifecycle Test\n\nThis is a unique integration test signature: ${Date.now()}.\nIt verifies Full-Text Search and Vector Ingestion logic.`;
    await Bun.write(testFile, content);

    // --- PHASE 2: INGEST ---
    console.log("\n⚙️  [2/5] Running Ingestion Pipeline...");
    const ingestor = new Ingestor(dbPath);
    await ingestor.run();
    console.log("   ✅ Ingestion Complete.");

    // --- PHASE 3: VERIFY EXISTENCE ---
    console.log("\n🔍 [3/5] Verifying Search...");
    
    // 3a. FTS
    const ftsResults = db.searchText("integration test signature", 1);
    const hasFTS = ftsResults.some(r => r.id.toLowerCase().includes(testId) || r.id.toLowerCase().includes("test_lifecycle_e2e"));
    console.log(`   [FTS] Found: ${hasFTS ? "YES" : "NO"} (${ftsResults.length > 0 ? ftsResults[0]!.id : "none"})`);
    if (!hasFTS) throw new Error("FTS Verification Failed");

    // 3b. Vector
    // DEBUG: Check if node actually made it to DB with vector
    const debugNode = db.getRawDb().query("SELECT id, length(embedding) as vecLen FROM nodes WHERE id LIKE ?").get(`%${testId}%`) as any;
    console.log("   [Debug] DB Node:", debugNode);

    const vecResults = await vectorEngine.search("unique integration test signature", 5);
    console.log("   [Debug] Vector Top 5:", vecResults.map(r => r.id));

    const hasVec = vecResults.some(r => r.id.toLowerCase().includes(testId) || r.id.toLowerCase().includes("test_lifecycle_e2e"));
    console.log(`   [Vector] Found: ${hasVec ? "YES" : "NO"} (${vecResults.length > 0 ? vecResults[0]!.id : "none"})`);
    if (!hasVec) throw new Error("Vector Verification Failed");

    // --- PHASE 4: DELETE ---
    console.log("\n🗑️  [4/5] Deleting Test Document...");
    // 4a. Delete File
    await $`rm ${testFile}`;
    
    // 4b. Sync Deletion (SIMULATED ORPHAN PRUNE)
    // Since pipeline is additive, we simulate what a 'prune' command would do: check FS and delete DB.
    // For this test, we explicitly delete the known ID to verify FTS trigger works.
    console.log("   Simulating Prune (Deleting from DB)...");
    
    // We expect the trigger `nodes_ad` to handle FTS cleanup.
    // We get the specific node ID that was inserted.
    const fileId = ftsResults[0]!.id; // Likely 'docs/test_lifecycle_E2E.md' or similar basename stuff
    console.log(`   Removing Node ID: ${fileId}`);
    
    db.getRawDb().run("DELETE FROM nodes WHERE id = ?", [fileId]);

    // --- PHASE 5: VERIFY DELETION ---
    console.log("\n🚫 [5/5] Verifying Deletion...");
    
    // 5a. Check FTS (Should NOT contain fileId)
    const ftsGone = db.searchText("integration test signature", 5);
    const ftsGhost = ftsGone.find(r => r.id === fileId);
    
    if (!ftsGhost) {
        console.log("   ✅ [FTS] Clean (Target ID not found).");
    } else {
        console.error("   ❌ [FTS] Found artifact:", ftsGhost.id);
        // Force cleanup just in case
        db.getRawDb().run("DELETE FROM nodes_fts WHERE id = ?", [fileId]);
        throw new Error("FTS Deletion Failed - Trigger did not fire?");
    }
    
    // 5b. Check Vector (Should be empty) - manual verify via SQL as VectorEngine might return nearest neighbor anyway
    const vecCheck = await vectorEngine.search("unique integration test signature", 5);
    // If it returns *something*, check if it's OUR document.
    const ghost = vecCheck.find(r => r.id === fileId);
    if (!ghost) {
        console.log("   ✅ [Vector] Clean (Node not found in results).");
    } else {
        throw new Error(`Vector Deletion Failed - Node ${fileId} still found.`);
    }

    console.log("\n🎉 ALL TESTS PASSED.");
}

run().catch(e => {
    console.error("\n❌ TEST FAILED:", e);
    process.exit(1);
});
