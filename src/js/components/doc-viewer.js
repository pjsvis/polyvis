import { marked } from 'marked';

export default () => ({
    docs: [],
    toc: [],

    // State
    viewMode: 'browse', // 'browse' (L+M) | 'reference' (M+R)
    navTab: 'index',    // 'index' | 'outline'
    leftOpen: false,    // Mobile sidebar state
    rightOpen: false,   // Mobile sidebar state

    // Content
    contentMain: '',
    contentRef: '',
    activeDoc: null,

    async init() {
        try {
            this.docs = await (await fetch('/index.json')).json();
            // Load first doc by default if available
            if (this.docs.length > 0) {
                this.loadMain(this.docs[0].file);
            }
        } catch (e) {
            console.error("Failed to load index.json", e);
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
        return marked.parse(raw, { renderer });
    },

    generateToC(containerSelector) {
        const container = document.querySelector(containerSelector);
        if (!container) return;

        const headers = container.querySelectorAll('h2, h3, h4');
        this.toc = Array.from(headers).map((h, index) => {
            let id = h.id;
            if (!id) {
                id = `header-${index}`;
                h.id = id;
            }
            return {
                text: h.innerText,
                id: id,
                level: parseInt(h.tagName.substring(1))
            };
        }).filter(item => item.text.trim().length > 0);
        console.log("Generated TOC:", this.toc);
    },

    // Handle internal link clicks in the main content
    handleContentClick(e) {
        const link = e.target.closest('a');
        if (!link) return;

        const href = link.getAttribute('href');
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
