import { ResonanceDB } from "@src/resonance/db";

export interface Candidate {
    nodeId: string;
    filePath: string;
    content: string;
    type: string;
}

export abstract class BaseGardener {
    protected db: ResonanceDB;

    constructor(db: ResonanceDB) {
        this.db = db;
    }

    abstract name: string;
    
    /**
     * Finds candidates that need attention.
     */
    abstract scan(limit: number): Promise<Candidate[]>;

    /**
     * Applies changes to a single candidate.
     */
    abstract cultivate(candidate: Candidate): Promise<void>;

    /**
     * Main loop.
     */
    public async run(limit: number = 10) {
        console.log(`🌿 Gardener [${this.name}] starting...`);
        const candidates = await this.scan(limit);
        console.log(`Found ${candidates.length} candidates.`);

        for (const candidate of candidates) {
            console.log(`Processing: ${candidate.nodeId}`);
            await this.cultivate(candidate);
        }
        console.log(`✅ Gardener [${this.name}] finished.`);
    }
}
