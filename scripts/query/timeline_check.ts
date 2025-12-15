import { ResonanceDB } from "@resonance/src/db";
import { join } from "path";
import settings from "@/polyvis.settings.json";

const dbPath = join(process.cwd(), settings.paths.database.resonance);
const db = new ResonanceDB(dbPath);

console.log("📅 Querying Database for Timeline...\n");

// Direct SQL query to bypass vector search and get everything
const nodes = db['db'].query(`
    SELECT id, title, content, meta 
    FROM nodes 
    WHERE type = 'debrief' 
       OR id LIKE '%debrief%' 
       OR title LIKE '%Debrief%'
`).all() as any[];

const timeline = nodes.map(n => {
    // Try to extract date from content or meta
    let date = "Unknown";
    const dateMatch = n.content.match(/Date:\*\*\s*(\d{4}-\d{2}-\d{2})/i) || n.content.match(/date:\s*(\d{4}-\d{2}-\d{2})/i);
    
    if (dateMatch) {
        date = dateMatch[1];
    } else if (n.meta) {
        try {
            const meta = JSON.parse(n.meta);
            if (meta.date) date = meta.date;
        } catch(e) {}
    }
    
    return {
        date,
        id: n.id,
        title: n.title || n.id,
        excerpt: n.content.slice(0, 100).replace(/\n/g, ' ')
    };
}).sort((a, b) => a.date.localeCompare(b.date));

console.table(timeline);
db.close();
