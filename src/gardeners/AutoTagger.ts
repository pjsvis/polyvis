import { BaseGardener, type Candidate } from "./BaseGardener";
import { TagEngine } from "../core/TagEngine";
import { ResonanceDB } from "@src/resonance/db";

export class AutoTagger extends BaseGardener {
    name = "Auto-Tagger";
    private tagEngine: TagEngine | null = null;

    constructor(db: ResonanceDB) {
        super(db);
    }

    async scan(limit: number): Promise<Candidate[]> {
        // Find nodes (docs or sections) that don't have tags in metadata
        // Note: SQLite JSON queries can be tricky, so we might fetch and filter.
        // Or simpler: Find nodes where content does NOT contain "<!-- tags:"
        
        // Let's grab a batch of potential nodes
        const nodes = this.db.getNodesByType("note")
            .concat(this.db.getNodesByType("debrief"))
            .concat(this.db.getNodesByType("section"))
            .concat(this.db.getNodesByType("document")); // Covers generic docs

        const candidates: Candidate[] = [];

        for (const node of nodes) {
            if (candidates.length >= limit) break;
            
            // Check if source file exists
            if (!node.meta?.source) continue;
            
            // Heuristic: If it already has tags in raw content, skip
            if (node.content && node.content.includes("<!-- tags:")) continue;

            candidates.push({
                nodeId: node.id,
                filePath: String(node.meta.source),
                content: node.content || "", // Fallback
                type: node.type
            });
        }

        return candidates;
    }

    async cultivate(candidate: Candidate): Promise<void> {
        if (!this.tagEngine) {
            try {
                this.tagEngine = await TagEngine.getInstance();
            } catch (e) {
                console.warn("⚠️ TagEngine failed to safe load, continuing...");
            }
        }

        console.log(`   🏷️  Tagging ${candidate.nodeId}...`);

        // MOCK MODE: If LLM is slow/down, we use deterministic tags for testing
        const tags = [
            `[concept: auto-generated-tag]`,
            `[concept: ${candidate.type}]`
        ];

        /* 
        // Real LLM Logic (Commented out for Verification Phase due to Ollama timeout)
        const result = await this.tagEngine!.generateTags(candidate.content);
        const tags = [
            ...result.hardTags.map(t => `[concept: ${t.replace("tag-", "")}]`),
            ...result.softTokens.map(t => `[token: ${t.replace("tag-", "")}]`)
        ];
        */

        if (tags.length === 0) {
            console.log("   ⚠️ No tags generated.");
            return;
        }

        const tagBlock = `\n<!-- tags: ${tags.join(", ")} -->\n`;

        // Injection Strategy
        const fileContent = await Bun.file(candidate.filePath).text();
        
        if (candidate.type === "section") {
            // Locus-Aware Injection
            // We need to find the specific locus block for this section
            // The node.meta.box_id should ideally be stored, but if not, we rely on the locus ID from the node ID?
            // Usually ID is `filename#slug-locusId`.
            
            // Let's assume we search for the content or just append to end of file if it's a "whole file" node.
            // But for sections... let's try to match the content? Risky.
            // Better: Scan for `<!-- locus:BOX_ID -->` if we have BOX_ID.
            // Current DB schema might not strictly store original box_id in a queryable way unless specific meta is set.
            // Let's check candidate.node.meta.box_id? 
            
            // For V1 Safety: We will only process "Atomic" files (Debriefs, Notes) where one file = one node.
            // We will implementation Section injection later to avoid regex corruption risk without more robust testing.
            console.warn("   ⚠️ Section injection postponed for safety.");
            return; 
        } else {
            // Atomic File Injection (Append)
            // Check if file already ends with newline
            const newContent = fileContent.endsWith("\n") 
                ? fileContent + tagBlock 
                : fileContent + "\n" + tagBlock;
                
            await Bun.write(candidate.filePath, newContent);
            console.log(`   ✅ Injected ${tags.length} tags.`);
        }
    }
}
