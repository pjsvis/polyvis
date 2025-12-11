import { Glob } from "bun";
import { Harvester } from "@src/core/Harvester";
import { parseArgs } from "util";

// Parse args
const { values } = parseArgs({
  args: Bun.argv,
  options: {
    target: {
      type: 'string',
    },
  },
  strict: true,
  allowPositionals: true,
});

async function main() {
    console.log("🌾 Resonance Harvester: Scanning...");

    // 1. Load Known Terms
    // Note: We need settings to know where to find things? 
    // Or do we just scan what's passed?
    // The previous implementation used 'resonance.settings.json'. Let's restore it.
    
    let settings: any = {};
    try {
        const settingsRaw = await Bun.file("resonance.settings.json").text();
        settings = JSON.parse(settingsRaw);
    } catch (e) {
        console.warn("⚠️ Could not load resonance.settings.json, running in standalone mode.");
        settings = { ingestion: { lexicon: null, directories: [] } };
    }
    
    const knownIds = new Set<string>();
    
    // Load Lexicon
    if (settings.ingestion.lexicon) {
        try {
            const lexRaw = await Bun.file(settings.ingestion.lexicon).text();
            const lex = JSON.parse(lexRaw);
            lex.forEach((t: any) => {
                knownIds.add(t.id);
                if (t.id.startsWith("term-")) knownIds.add(t.id.replace("term-", ""));
            });
        } catch (e) {
            console.warn(`⚠️ Could not load lexicon at ${settings.ingestion.lexicon}`);
        }
    }

    // 2. Scan
    const harvester = new Harvester();
    // Use target arg OR settings directories OR default to 'docs'
    const targetArg = values.target;
    const scanDirs = targetArg ? [targetArg] : (settings.ingestion.directories.length > 0 ? settings.ingestion.directories : ["docs"]);
    
    console.log(`Scanning: ${scanDirs.join(", ")}`);
    
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
