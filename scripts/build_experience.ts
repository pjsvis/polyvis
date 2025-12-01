import { join, basename } from "path";
import { writeFileSync, readFileSync, existsSync, mkdirSync, copyFileSync, readdirSync } from "fs";

// --- Configuration ---
const ROOT_DIR = process.cwd();
const PUBLIC_DOCS_DIR = join(ROOT_DIR, "public", "docs");
const PUBLIC_DATA_DIR = join(ROOT_DIR, "public", "data");
const OUTPUT_FILE = join(PUBLIC_DATA_DIR, "experience.json");

const SOURCES = [
    { kind: "dir", path: "playbooks", type: "playbook", dest: "playbooks" },
    { kind: "dir", path: "debriefs", type: "debrief", dest: "debriefs" },
    { kind: "file", path: "AGENTS.md", type: "protocol", dest: "" }
];

// --- Types ---
interface ExperienceNode {
    id: string;
    type: "playbook" | "debrief" | "protocol";
    title: string;
    path: string; // Relative to public/docs/
    date?: string;
    tags: string[];
}

console.log(`Building Experience Index...`);

// --- Helpers ---
function extractTitle(content: string, filename: string): string {
    // Try to find first H1
    const h1Match = content.match(/^#\s+(.+)$/m);
    if (h1Match) return h1Match[1].trim();

    // Fallback to filename
    return filename.replace(/\.md$/, "").replace(/-/g, " ");
}

function extractDate(filename: string): string | undefined {
    // Match YYYY-MM-DD pattern
    const match = filename.match(/^(\d{4}-\d{2}-\d{2})/);
    return match ? match[1] : undefined;
}

// --- Main ---
function build() {
    const nodes: ExperienceNode[] = [];

    // Ensure output directories exist
    if (!existsSync(PUBLIC_DATA_DIR)) mkdirSync(PUBLIC_DATA_DIR, { recursive: true });

    SOURCES.forEach(source => {
        const sourcePath = join(ROOT_DIR, source.path);
        const destDir = join(PUBLIC_DOCS_DIR, source.dest);

        if (!existsSync(sourcePath)) {
            console.warn(`Source not found: ${sourcePath}`);
            return;
        }

        // Ensure destination directory exists
        if (!existsSync(destDir)) mkdirSync(destDir, { recursive: true });

        let files: string[] = [];

        if (source.kind === "dir") {
            files = readdirSync(sourcePath).filter(f => f.endsWith(".md"));
        } else {
            // Single file
            files = [basename(sourcePath)];
        }

        files.forEach(file => {
            const srcFile = source.kind === "dir" ? join(sourcePath, file) : sourcePath;
            const destFile = join(destDir, file);

            // Read content for metadata
            let content = readFileSync(srcFile, "utf-8");
            const title = extractTitle(content, file);
            const date = extractDate(file);

            // TODO: Link Rewriting if needed (e.g. fixing relative paths)
            // For now, we assume relative paths in AGENTS.md (root) match public/docs (root) structure.

            // Copy file
            writeFileSync(destFile, content); // Write content instead of copy to allow future transformation
            console.log(`Copied: ${source.path}${source.kind === 'dir' ? '/' + file : ''} -> public/docs/${source.dest ? source.dest + '/' : ''}${file}`);

            // Add to Index
            nodes.push({
                id: basename(file, ".md"),
                type: source.type as any,
                title: title,
                path: source.dest ? `${source.dest}/${file}` : file,
                date: date,
                tags: []
            });
        });
    });

    // Write Index
    writeFileSync(OUTPUT_FILE, JSON.stringify(nodes, null, 2));
    console.log(`\nSuccess! Indexed ${nodes.length} experience artifacts to ${OUTPUT_FILE}`);
}

build();
