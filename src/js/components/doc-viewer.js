import { marked } from 'marked';

export default () => ({
    docs: [],
    toc: [],

    // State
    viewMode: 'browse', // 'browse' (L+M) | 'reference' (M+R)
    navTab: 'index',    // 'index' | 'outline'
    leftOpen: false,    // Mobile sidebar state
    rightOpen: false,   // Mobile sidebar state
    showTocNumbers: false, // Hide section numbers by default

    // Content
    contentMain: '',
    contentRef: '',
    activeDoc: null,

    references: {}, // Lookup table for Wiki Refs

    async init() {
        try {
            // Parallel fetch for speed
            const [indexRes, refsRes] = await Promise.all([
                fetch('/index.json'),
                fetch('/data/references.json')
            ]);

            this.docs = await indexRes.json();

            if (refsRes.ok) {
                this.references = await refsRes.json();
            } else {
                console.warn("References not found, wiki-linking disabled.");
            }

            // Check URL params for initial file
            const params = new URLSearchParams(window.location.search);
            const initialFile = params.get('file');

            if (initialFile) {
                this.loadMain(initialFile);
            } else if (this.docs.length > 0) {
                // Default to first doc
                this.loadMain(this.docs[0].file);
            }
        } catch (e) {
            console.error("Failed to load initial data", e);
        }
    },

    // --- Actions ---

    async loadMain(filename) {
        try {
            const raw = await (await fetch(`/docs/${filename}`)).text();
            this.contentMain = this.parseMarkdown(raw);
            this.activeDoc = filename;

            // Generate ToC after DOM update
            this.$nextTick(() => {
                this.generateToC('#main-content');
                window.scrollTo(0, 0);
                // Auto-switch to outline view on mobile or if preferred
                this.navTab = 'outline';
            });

            // Reset View
            this.viewMode = 'browse';
        } catch (e) {
            console.error(`Failed to load ${filename}`, e);
            this.contentMain = `<p class="text-red-500">Error loading document: ${filename}</p>`;
        }
    },

    async loadRef(filename) {
        try {
            const raw = await (await fetch(`/docs/${filename}`)).text();
            this.contentRef = this.parseMarkdown(raw);
            this.viewMode = 'reference';
        } catch (e) {
            console.error(`Failed to load ref ${filename}`, e);
        }
    },

    goBack() {
        this.viewMode = 'browse';
        this.contentRef = '';
    },

    // Load a Wiki Reference into the RHS
    loadWikiRef(refId) {
        const ref = this.references[refId];
        if (!ref) return;

        // Render the Reference Card
        const html = `
            <div class="wiki-card">
                <div class="wiki-header">
                    <span class="wiki-type">${ref.type}</span>
                    <h1 class="wiki-title">${ref.title}</h1>
                    <div class="wiki-meta">ID: ${ref.id}</div>
                </div>
                <div class="wiki-content prose prose-sm">
                    ${marked.parse(ref.content)}
                </div>
                ${ref.tags.length ? `
                <div class="wiki-tags">
                    ${ref.tags.map(t => `<span class="wiki-tag">${t}</span>`).join('')}
                </div>` : ''}
            </div>
        `;

        this.contentRef = html;
        this.viewMode = 'reference';
    },

    // --- Helpers ---

    parseMarkdown(raw) {
        // Configure marked to add IDs to headers for ToC linking
        const renderer = new marked.Renderer();
        renderer.heading = function ({ tokens, depth, raw }) {
            const text = this.parser.parseInline(tokens);
            const cleanText = text.replace(/<[^>]*>/g, ''); // Strip HTML tags
            let slug = cleanText.toLowerCase().replace(/[^\w]+/g, '-').replace(/^-+|-+$/g, '');
            if (!slug) slug = `section-${Math.random().toString(36).substr(2, 9)}`;
            return `<h${depth} id="${slug}">${text}</h${depth}>`;
        };

        // 1. Parse Markdown to HTML
        let html = marked.parse(raw, { renderer });

        // 2. Auto-Link Wiki References (Regex Post-Processing)
        // Pattern: Matches OH-XXX, COG-XXX, TERM-XXX, etc.
        // We only link if the ID exists in this.references
        if (this.references) {
            html = html.replace(/\b([A-Z]{2,}-\d+|[a-z]+-[a-z]+-\d+)\b/g, (match) => {
                // Check exact match or case-insensitive match if needed
                if (this.references[match]) {
                    return `<a href="#" class="wiki-ref" data-ref="${match}">${match}</a>`;
                }
                return match;
            });
        }

        return html;
    },

    generateToC(containerSelector) {
        const container = document.querySelector(containerSelector);
        if (!container) return;

        const headers = container.querySelectorAll('h2, h3, h4');
        const groups = [];
        let currentGroup = null;

        Array.from(headers).forEach((h, index) => {
            let id = h.id;
            if (!id) {
                id = `header-${index}`;
                h.id = id;
            }

            // Extract number and text
            const fullText = h.innerText;
            const match = fullText.match(/^(\d+(\.\d+)*\.?)\s+(.*)/);
            const number = match ? match[1] : '';
            const text = match ? match[3] : fullText;

            if (!text.trim()) return;

            const item = {
                text: text,
                number: number,
                id: id,
                level: parseInt(h.tagName.substring(1))
            };

            if (item.level === 2) {
                // Start new group
                currentGroup = { header: item, children: [] };
                groups.push(currentGroup);
            } else {
                // Add to current group or create intro group
                if (!currentGroup) {
                    currentGroup = { header: null, children: [] };
                    groups.push(currentGroup);
                }
                currentGroup.children.push(item);
            }
        });

        this.toc = groups;
        console.log("Generated TOC Groups:", this.toc);
    },

    // Handle internal link clicks in the main content
    handleContentClick(e) {
        const link = e.target.closest('a');
        if (!link) return;

        const href = link.getAttribute('href');

        // Wiki Reference?
        if (link.classList.contains('wiki-ref')) {
            e.preventDefault();
            const refId = link.getAttribute('data-ref');
            this.loadWikiRef(refId);
            return;
        }

        if (!href) return;

        // Internal Markdown Link? (Simple check: ends with .md and not external)
        if (href.endsWith('.md') && !href.startsWith('http')) {
            e.preventDefault();
            // If in browse mode, open in ref panel
            this.loadRef(href);
        }
        // Anchor Link?
        else if (href.startsWith('#')) {
            // Let default behavior happen (scroll)
        }
        // External?
        else if (href.startsWith('http')) {
            e.preventDefault();
            window.open(href, '_blank');
        }
    }
});
