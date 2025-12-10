import { ResonanceDB } from "../resonance/src/db";

export class EdgeWeaver {
    private db: ResonanceDB;
    private lexicon: Map<string, string>; // Slug -> ID
    // private entityIndex: Map<string, string>; // Placeholder for future entity index

    constructor(db: ResonanceDB, lexiconItems: any[]) {
        this.db = db;
        this.lexicon = new Map();
        
        // Build efficient lookup map (Slug -> ID)
        // We assume tags match the 'id' or a slugified 'title'
        for (const item of lexiconItems) {
            // Index by ID
            this.lexicon.set(item.id.toLowerCase(), item.id);
            // Index by Label (Slugified)
            if (item.title) {
                this.lexicon.set(this.slugify(item.title), item.id);
            }
            // Index by Aliases
            if (item.aliases) {
                for (const alias of item.aliases) {
                    this.lexicon.set(this.slugify(alias), item.id);
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
            const tagStub = match[1]!.toLowerCase();
            
            // Check Lexicon (Persona Domain)
            const conceptId = this.lexicon.get(tagStub);
            if (conceptId) {
                // EDGE: Source -> EXEMPLIFIES -> Concept
                this.db.insertEdge(sourceId, conceptId, "EXEMPLIFIES");
                // console.log(`🔗 Weaved: ${sourceId} -> ${conceptId} (EXEMPLIFIES)`);
            } else {
                // Future: Check Entity Index (REFERENCES)
                 // console.log(`⚠️ Unresolved Tag: ${tagStub}`);
            }
        }
    }

    private processWikiLinks(sourceId: string, content: string): void {
        // Match `[[Target]]` or `[[Target|Label]]`
        const matches = content.matchAll(/\[\[(.*?)(?:\|.*?)?\]\]/g);

        for (const match of matches) {
            if (!match[1]) continue;
            const rawTarget = match[1]!.trim();
            // In a real system, we'd look up the target ID. 
            // For now, we assume the target ID *is* the raw target or a simple transformation.
            // If the target is a filename, we might need path resolution.
            // But if it's a concept, it might be in the lexicon.
            
            // 1. Try Lexicon Lookup
            const conceptId = this.lexicon.get(this.slugify(rawTarget));
            if (conceptId) {
                this.db.insertEdge(sourceId, conceptId, "CITES");
                continue;
            }

            // 2. Assume File Link (desire line) - We might not have the full path, 
            // so we might just create a "Ghost Edge" or best-effort link.
            // For now, let's treat it as a CITATION to a potential Node ID.
            // CAUTION: Inserting an edge to a non-existent ID fails in strict Foreign Key DBs.
            // Bun:sqlite might allow it depending on schema. ResonanceDB logic handles inserts.
            // We'll skip for now to avoid pollution unless we can resolve it.
        }
    }

    private slugify(text: string): string {
        return text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    }
}
