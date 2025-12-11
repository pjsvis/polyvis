import type { ResonanceDB } from "@resonance/src/db";

export class EdgeWeaver {
    private db: ResonanceDB;
    // Lexicon for lookups (Slug -> ID)
    private lexicon: Map<string, string>;

    constructor(db: ResonanceDB, context: any[] = []) {
        this.db = db;
        this.lexicon = new Map();

        // Build efficient lookup map (Slug -> ID)
        if (Array.isArray(context)) {
            for (const item of context) {
                if (!item || !item.id) continue;
                
                const id = item.id;
                // Index by ID
                this.lexicon.set(id.toLowerCase(), id);
                
                // Index by Label (Slugified)
                if (item.title) {
                    this.lexicon.set(this.slugify(item.title), id);
                }
                
                // Index by Aliases
                if (item.aliases && Array.isArray(item.aliases)) {
                    for (const alias of item.aliases) {
                        this.lexicon.set(this.slugify(alias), id);
                    }
                }
            }
        }
    }

    /**
     * Scans content for semantic tags and WikiLinks, creating edges in the DB.
     * @param sourceNodeId The ID of the node containing the text (e.g., Section or File)
     * @param content The text content to scan
     */
    public weave(sourceNodeId: string, content: string): void {
        this.processTags(sourceNodeId, content);
        this.processWikiLinks(sourceNodeId, content);
    }

    private processTags(sourceId: string, content: string): void {
        // Match `tag-` followed by word chars or dashes
        const matches = content.matchAll(/\btag-([\w-]+)/g);
        
        for (const match of matches) {
            if (match[1]) {
                const tagStub = match[1].toLowerCase();
                
                // Check Lexicon (Persona Domain)
                const conceptId = this.lexicon.get(tagStub);
                if (conceptId) {
                    // EDGE: Source -> EXEMPLIFIES -> Concept
                    this.db.insertEdge(sourceId, conceptId, "EXEMPLIFIES");
                }
            }
        }
    }

    private processWikiLinks(sourceId: string, content: string): void {
        // Match `[[Target]]` or `[[Target|Label]]`
        const matches = content.matchAll(/\[\[(.*?)(?:\|.*?)?\]\]/g);

        for (const match of matches) {
            if (!match[1]) continue;
            const rawTarget = match[1].trim();
            
            // 1. Try Lexicon Lookup
            const conceptId = this.lexicon.get(this.slugify(rawTarget));
            if (conceptId) {
                this.db.insertEdge(sourceId, conceptId, "CITES");
                continue;
            }

            // 2. Assume File Link (desire line)
            // Skip for now
        }
    }

    private slugify(text: string): string {
        return text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    }
}
