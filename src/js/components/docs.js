export default () => ({
    loaded: false,
    debug: false,
    leftOpen: false,
    rightOpen: false,
    documents: [
        { title: "00. Start Here", file: "example.md" },
        { title: "01. Conceptual Lexicon", file: "lexicon.md" },
        { title: "02. System Architecture", file: "architecture.md" },
        { title: "03. Persona Engineering", file: "persona-engineering.md" },
        { title: "04. The Tailwind Paradox", file: "the-tailwind-paradox.md" },
        { title: "05. The Hejlsberg Inversion", file: "the-hejlsberg-inversion.md" },
        { title: "06. Layout Test", file: "layout-test.md" },
        { title: "07. Hi Fi CSS", file: "hi-fi-css.md" },
        { title: "08 Zero Magic Contexting", file: "zero-magic-contexting.md" },
        { title: "09 Performance Review", file: "perf-review.md" },
    ],

    init() {
        setTimeout(() => this.loaded = true, 50);
        this.renderSidebar();
        this.loadCurrentDoc();
    },

    renderSidebar() {
        const listContainers = document.querySelectorAll(".file-list-container");
        if (listContainers.length === 0) return;

        const params = new URLSearchParams(window.location.search);
        const currentFile = params.get("file") || "example.md";

        const linksHTML = this.documents
            .map(
                (doc) => `
                <a href="?file=${doc.file}" class="doc-link ${doc.file === currentFile ? "active" : ""} flex items-center">
                    <i data-lucide="file-text" class="w-4 h-4 mr-2"></i>
                    ${doc.title}
                </a>
            `
            )
            .join("");

        listContainers.forEach(container => {
            container.innerHTML = linksHTML;
        });

        if (window.lucide) window.lucide.createIcons();
    },

    loadCurrentDoc() {
        let viz;
        try {
            viz = new Viz();
        } catch (e) {
            console.error(e);
        }

        const params = new URLSearchParams(window.location.search);
        const file = params.get("file") || "example.md";

        fetch(file)
            .then((response) => {
                if (!response.ok)
                    throw new Error(`HTTP error! status: ${response.status}`);
                return response.text();
            })
            .then((text) => {
                const rawHtml = marked.parse(text);
                const contentDiv = document.getElementById("content");
                contentDiv.innerHTML = rawHtml;
                this.renderGraphs(viz);
            })
            .catch((err) => {
                document.getElementById("content").innerHTML = `
                        <div class="p-8 text-center">
                            <h2 class="text-2xl font-bold mb-4">404: Document Not Found</h2>
                            <p class="font-mono text-red-600 bg-red-50 border border-red-200 p-4 inline-block">
                                File: ${file}
                            </p>
                            <p class="mt-4 text-gray-500">Please check the sidebar for valid documents.</p>
                        </div>`;
            });
    },

    renderGraphs(viz) {
        const codeBlocks = document.querySelectorAll("code.language-dot");
        codeBlocks.forEach((block) => {
            const dotSource = block.textContent;
            const preWrapper = block.parentElement;

            const container = document.createElement("div");
            container.className = "graph-container";
            container.innerHTML =
                '<span class="font-mono text-xs text-gray-400">Rendering Structure...</span>';

            preWrapper.parentNode.insertBefore(container, preWrapper);
            preWrapper.style.display = "none";

            if (viz) {
                viz
                    .renderSVGElement(dotSource)
                    .then((element) => {
                        container.innerHTML = "";
                        element.setAttribute("width", "100%");
                        element.setAttribute("height", "auto");
                        container.appendChild(element);
                    })
                    .catch((error) => {
                        container.innerHTML = `<div class="text-red-500 text-xs font-mono p-2">Graph Error: ${error.message}</div>`;
                        preWrapper.style.display = "block";
                    });
            }
        });
    }
})
