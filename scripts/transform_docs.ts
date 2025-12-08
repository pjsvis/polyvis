import { Glob } from "bun";
import { join, basename } from "path";
import settings from "../polyvis.settings.json";
import type { IngestionArtifact } from "../src/types/artifact.js";

const artifacts: IngestionArtifact[] = [];
const root = process.cwd();

// --- Helpers ---
function extractTitle(content: string, filename: string): string {
	const match = content.match(/^#\s+(.+)$/m);
	return match ? match[1].trim() : filename;
}

// --- Transformation Loop ---
let orderCounter = 0;

for (const sourceDirRelative of settings.paths.sources.docs) {
	const sourceDir = join(root, sourceDirRelative);
	console.log(`Scanning ${sourceDir}...`);

	const glob = new Glob("*.md");
    // Sort logic is implicit in file system usually, but better to be explicit 
    // Array.from(glob.scanSync) gives unsorted?
	const files = Array.from(glob.scanSync(sourceDir)).sort(); 

	for (const file of files) {
        const fullPath = join(sourceDir, file);
		const content = await Bun.file(fullPath).text();
        const id = basename(file, ".md");
        const type = sourceDirRelative.includes("playbooks") ? "playbook" : "debrief";

		artifacts.push({
			id,
            type: type as any,
			order_index: orderCounter++,
			payload: {
				title: extractTitle(content, id),
				content: content,
				domain: "knowledge",
				layer: "experience",
                metadata: { path: fullPath }
			},
		});
	}
}

// --- Output ---
const outDir = join(root, ".resonance", "artifacts");
if (!require("fs").existsSync(outDir)) {
    require("fs").mkdirSync(outDir, { recursive: true });
}

const outFile = join(outDir, "docs.json");
await Bun.write(outFile, JSON.stringify(artifacts, null, 2));

console.log(`✅ Transformed ${artifacts.length} docs to ${outFile}`);
