
import { ResonanceDB } from "../resonance/src/db";
import { VectorEngine } from "../src/core/VectorEngine";
import { $ } from "bun";
import { join } from "path";

const dbPath = "public/resonance.db";
const db = new ResonanceDB(dbPath);
const vectorEngine = new VectorEngine(dbPath);
const testFile = "docs/test_lifecycle_E2E.md";
const testId = "test-lifecycle-E2E";

async function run() {
    console.log("🚦 Starting E2E Lifecycle Test...");

    // --- PHASE 1: CREATE ---
    console.log(`\n📝 [1/5] Creating Test Document '${testFile}'...`);
    const content = `# Lifecycle Test\n\nThis is a unique integration test signature: ${Date.now()}.\nIt verifies Full-Text Search and Vector Ingestion logic.`;
    await Bun.write(testFile, content);

    // --- PHASE 2: INGEST ---
    console.log("\n⚙️  [2/5] Running Ingestion Pipeline...");
    // Run build:data (ingest + sync)
    // We suppress output for cleanliness but check exit code
    const proc = Bun.spawn(["bun", "run", "build:data"], { stdout: "ignore", stderr: "inherit" });
    const exitCode = await proc.exited;
    if (exitCode !== 0) throw new Error("Ingestion failed");
    console.log("   ✅ Ingestion Complete.");

    // --- PHASE 3: VERIFY EXISTENCE ---
    console.log("\n🔍 [3/5] Verifying Search...");
    
    // 3a. FTS
    const ftsResults = db.searchText("integration test signature", 1);
    const hasFTS = ftsResults.some(r => r.id.includes(testId) || r.id.includes("test_lifecycle_E2E"));
    console.log(`   [FTS] Found: ${hasFTS ? "YES" : "NO"} (${ftsResults.length > 0 ? ftsResults[0].id : "none"})`);
    if (!hasFTS) throw new Error("FTS Verification Failed");

    // 3b. Vector
    const vecResults = await vectorEngine.search("unique integration test signature", 1);
    const hasVec = vecResults.some(r => r.id.includes(testId) || r.id.includes("test_lifecycle_E2E"));
    console.log(`   [Vector] Found: ${hasVec ? "YES" : "NO"} (${vecResults.length > 0 ? vecResults[0].id : "none"})`);
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
    const fileId = ftsResults[0].id; // Likely 'docs/test_lifecycle_E2E.md' or similar basename stuff
    console.log(`   Removing Node ID: ${fileId}`);
    
    db.getRawDb().run("DELETE FROM nodes WHERE id = ?", [fileId]);

    // --- PHASE 5: VERIFY DELETION ---
    console.log("\n🚫 [5/5] Verifying Deletion...");
    
    // 5a. Check FTS (Should be empty)
    const ftsGone = db.searchText("integration test signature", 1);
    if (ftsGone.length === 0) {
        console.log("   ✅ [FTS] Clean (No results).");
    } else {
        console.error("   ❌ [FTS] Found artifact:", ftsGone[0].id);
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
