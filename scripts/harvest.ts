import { Harvester } from "./Harvester";
import { parseArgs } from "util";

const { values } = parseArgs({
  args: Bun.argv,
  options: {
    verbose: { type: 'boolean' }
  },
  strict: true,
  allowPositionals: true,
});

async function main() {
    console.log("🌾 Resonance Harvester: Scanning...");

    // 1. Load Known Terms
    const settingsRaw = await Bun.file("resonance.settings.json").text();
    const settings = JSON.parse(settingsRaw);
    
    const knownIds = new Set<string>();
    
    // Load Lexicon
    if (settings.ingestion.lexicon) {
        const lexRaw = await Bun.file(settings.ingestion.lexicon).text();
        const lex = JSON.parse(lexRaw);
        lex.forEach((t: any) => {
            knownIds.add(t.id);
            if (t.id.startsWith("term-")) knownIds.add(t.id.replace("term-", ""));
        });
    }

    // 2. Scan
    const harvester = new Harvester();
    const scanDirs = settings.ingestion.directories; // ["briefs", "debriefs", "playbooks"]
    const allTags = await harvester.scan(scanDirs);
    
    console.log(`Found ${allTags.size} unique tags.`);

    // 3. Filter
    const unknownTags = harvester.filterKnown(allTags, knownIds);
    console.log(`Filtered to ${unknownTags.size} new emerging concepts.`);

    // 4. Generate Staging
    const sorted = harvester.sortAndCluster(unknownTags);
    
    let mdOutput = "# Staging Area\n\n";
    mdOutput += "These concepts have been harvested from the codebase. Review and Promote.\n\n";
    
    for (const item of sorted) {
        mdOutput += `## ${item.tag}\n`;
        mdOutput += `- **Frequency:** ${item.count}\n`;
        mdOutput += `- **Occurrences:**\n`;
        // Dedupe files
        const uniqueFiles = [...new Set(item.files)];
        for (const f of uniqueFiles) {
            mdOutput += `  - ${f}\n`;
        }
        mdOutput += "\n";
    }

    await Bun.write("_staging.md", mdOutput);
    console.log("✅ Generated _staging.md");
}

main().catch(console.error);
