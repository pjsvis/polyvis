export default () => ({
    status: 'Initializing...',
    graph: null,
    renderer: null,
    activeColorViz: null,
    activeSizeViz: null,
    layout: 'forceatlas2',
    showStats: false,
    stats: { nodes: 0, edges: 0, density: 0, avgDegree: 0 },
    leftOpen: true,
    rightOpen: true,
    selectedNode: null,
    hoveredNode: null, // Track hovered node for robust clicking
    loaded: false,
    debug: false, // Added for layout debug mode
    clickBlock: false, // Event blocker
    tooltip: { visible: false, text: '', x: 0, y: 0 },

    // Search State
    searchQuery: '',
    searchResults: [],
    isSearchFocused: false,

    showTooltip(event, text) {
        const rect = event.currentTarget.getBoundingClientRect();
        this.tooltip.text = text;
        this.tooltip.x = rect.right + 10;
        this.tooltip.y = rect.top;
        this.tooltip.visible = true;
    },

    hideTooltip() {
        this.tooltip.visible = false;
    },

    // --- Search Logic ---

    handleSearch() {
        if (!this.graph) return;

        if (!this.searchQuery) {
            // Smart Autocomplete: Show top Core Concepts
            const nodes = this.graph.mapNodes((id, attrs) => ({ id, ...attrs }))
                .filter(n => n.nodeType === "Core Concept")
                .sort((a, b) => b.size - a.size) // Sort by size (importance)
                .slice(0, 5);
            this.searchResults = nodes;
            return;
        }

        const query = this.searchQuery.toLowerCase();
        const results = this.graph.mapNodes((id, attrs) => ({ id, ...attrs }))
            .filter(n =>
                n.id.toLowerCase().includes(query) ||
                n.label.toLowerCase().includes(query)
            )
            .slice(0, 10); // Limit to 10 results

        this.searchResults = results;
    },

    selectSearchResult(nodeId) {
        this.selectNode(nodeId);
        // this.searchQuery = ''; // Retain query as requested
        this.searchResults = [];
        this.isSearchFocused = false;
    },

    // --- Internal Navigation ---

    selectNode(nodeId) {
        if (!this.graph.hasNode(nodeId)) return;

        const attrs = this.graph.getNodeAttributes(nodeId);
        this.selectedNode = { id: nodeId, ...attrs };
        this.rightOpen = true;
        this.$refs.analysisGuide.open = false;

        this.renderer.refresh();
    },

    linkify(text) {
        if (!text) return "";
        // Regex for IDs: OH-104, COG-5, term-001
        // \b ensures we don't match partial words
        return text.replace(/\b([A-Z]{2,}-\d+|term-\d+)\b/g, (match) => {
            if (this.graph && this.graph.hasNode(match)) {
                return `<a href="#" class="internal-link" data-node-id="${match}">${match}</a>`;
            }
            return match;
        });
    },

    handleContentClick(event) {
        if (event.target.matches('.internal-link')) {
            event.preventDefault();
            const nodeId = event.target.dataset.nodeId;
            this.selectNode(nodeId);
        }
    },

    init() {
        setTimeout(() => this.loaded = true, 50);
        this.initSqlJs();
        this.$nextTick(() => { if (window.lucide) window.lucide.createIcons(); });
    },

    initSqlJs() {
        initSqlJs({
            locateFile: (file) => `https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.8.0/${file}`,
        }).then((SQL) => {
            const xhr = new XMLHttpRequest();
            xhr.open("GET", "/data/ctx.db", true);
            xhr.responseType = "arraybuffer";

            xhr.onload = (e) => {
                if (xhr.status !== 200) {
                    this.status = `<span class="text-red-500">Error: ctx.db not found (Status ${xhr.status})</span>`;
                    return;
                }
                const uInt8Array = new Uint8Array(xhr.response);
                const db = new SQL.Database(uInt8Array);
                this.loadGraph(db);
            };
            xhr.send();
        });
    },

    loadGraph(db) {
        // 1. Instantiate Graphology
        this.graph = new graphology.Graph();
        this.status = "Extracting Data...";

        // 2. Query Nodes
        try {
            const nodesStmt = db.prepare("SELECT * FROM nodes");
            while (nodesStmt.step()) {
                const row = nodesStmt.getAsObject();
                this.graph.addNode(row.id, {
                    label: row.label,
                    nodeType: row.type || 'Unknown',
                    definition: row.definition || '',
                    size: row.type === "Core Concept" ? 20 : 6,
                    color: row.type === "Core Concept" ? "black" : "#475569",
                    originalSize: row.type === "Core Concept" ? 20 : 6,
                    originalColor: row.type === "Core Concept" ? "black" : "#475569",
                    x: Math.random() * 100,
                    y: Math.random() * 100,
                    external_refs: row.external_refs ? JSON.parse(row.external_refs) : []
                });
            }
        } catch (e) {
            console.error("Node Error", e);
        }

        // 3. Query Edges
        try {
            const edgesStmt = db.prepare("SELECT * FROM edges");
            while (edgesStmt.step()) {
                const row = edgesStmt.getAsObject();
                if (this.graph.hasNode(row.source) && this.graph.hasNode(row.target)) {
                    if (!this.graph.hasEdge(row.source, row.target)) {
                        this.graph.addEdge(row.source, row.target, {
                            type: "arrow",
                            label: row.relation,
                            size: 2,
                            color: "#e5e5e5",
                        });
                    }
                }
            }
        } catch (e) {
            console.error("Edge Error", e);
        }

        const nodeCount = this.graph.order;
        const edgeCount = this.graph.size;
        this.status = `Graph Loaded: ${nodeCount} Nodes, ${edgeCount} Edges. Running Physics...`;

        // 4. Run Layout (ForceAtlas2)
        this.runLayout('forceatlas2');

        // 5. Apply Default Visualizations (User Request)
        // Apply BEFORE rendering to avoid "jarring" flash.
        this.toggleColorViz('louvain');
        this.toggleSizeViz('pagerank');

        // 6. Render with Sigma
        const container = this.$refs.sigmaContainer;
        container.innerHTML = ""; // Clear previous

        this.renderer = new Sigma(this.graph, container, {
            renderEdgeLabels: true,
            nodeReducer: (node, data) => {
                if (this.selectedNode && node === this.selectedNode.id) {
                    return { ...data, highlighted: true, size: Math.max(data.size, 25), zIndex: 10, label: data.label };
                }
                return data;
            },
            // User Request: Reduce label clutter.
            // Only show labels if node is > 8px (Core Concepts are 20px, Standard are 6px).
            // Labels will appear when zooming in.
            labelRenderedSizeThreshold: 8,
            zIndex: true,
        });

        // Fix: Hand Pointer for Background Dragging
        // 1. Default cursor is "grab"
        container.style.cursor = "grab";

        this.renderer.on("downStage", () => {
            container.style.cursor = "grabbing";
        });

        // Re-enable on mouseup anywhere
        document.addEventListener("mouseup", () => {
            if (this.renderer && this.renderer.getMouseCaptor()) {
                this.renderer.getMouseCaptor().isMouseEnabled = true;
            }
            // Reset cursor to grab (unless hovering a node)
            if (!this.hoveredNode) {
                container.style.cursor = "grab";
            }
        });

        // Disable mouse wheel zoom
        try {
            if (this.renderer.getMouseCaptor()) {
                this.renderer.getMouseCaptor().isMouseWheelEnabled = false;
            }
        } catch (e) { }

        container.addEventListener("wheel", (e) => e.stopPropagation(), true);

        this.status = "Interactive Mode Active. Buttons to Zoom, Drag to Move.";

        // Event Listeners
        this.renderer.on("clickNode", ({ node }) => {
            console.log(`[SigmaDebug] clickNode: ${node}`);
            // Prevent stage click from firing immediately after
            this.clickBlock = true;
            console.log(`[SigmaDebug] clickBlock SET to true`);
            setTimeout(() => {
                this.clickBlock = false;
                console.log(`[SigmaDebug] clickBlock RESET to false`);
            }, 200); // 200ms debounce

            const attrs = this.graph.getNodeAttributes(node);
            this.selectNode(node);
        });

        this.renderer.on("clickStage", () => {
            console.log(`[SigmaDebug] clickStage. Blocked? ${this.clickBlock}. Hovered? ${this.hoveredNode}`);
            if (this.clickBlock) {
                console.log(`[SigmaDebug] clickStage BLOCKED`);
                return; // Ignore if blocked
            }

            // Fallback: If we are hovering a node, select it!
            if (this.hoveredNode) {
                console.log(`[SigmaDebug] clickStage FALLBACK to hoveredNode: ${this.hoveredNode}`);
                this.selectNode(this.hoveredNode);
                return;
            }

            console.log(`[SigmaDebug] clickStage DESELECTING`);
            this.selectedNode = null;
            this.rightOpen = false;
            this.graph.forEachNode((n) => {
                this.graph.setNodeAttribute(n, "highlighted", false);
                this.graph.setNodeAttribute(n, "size", this.graph.getNodeAttribute(n, "originalSize"));
                this.graph.setNodeAttribute(n, "zIndex", 1);
            });
            if (this.renderer) this.renderer.refresh();
        });

        // Fix: Aggressive Drag Prevention
        // We intercept the native 'mousedown' on the container.
        // If the mouse is over a node, we STOP propagation immediately.
        // This prevents the camera from ever receiving the event to start a drag.
        container.addEventListener("mousedown", (e) => {
            if (this.hoveredNode) {
                console.log(`[SigmaDebug] Mousedown on Node ${this.hoveredNode} -> STOPPING PROPAGATION`);
                e.stopPropagation();
                // e.preventDefault(); // Optional: might prevent focus, use with caution
            }
        }, true); // Use CAPTURE phase to catch it before Sigma does

        this.renderer.on("enterNode", ({ node }) => {
            console.log(`[SigmaDebug] enterNode: ${node}`);
            container.style.cursor = "pointer";
            this.hoveredNode = node;
        });

        this.renderer.on("leaveNode", () => {
            console.log(`[SigmaDebug] leaveNode`);
            container.style.cursor = "";
            this.hoveredNode = null;
        });
    },

    zoomIn() {
        if (!this.renderer) return;
        const camera = this.renderer.getCamera();
        camera.animate({ ratio: camera.ratio / 1.5 });
    },

    zoomOut() {
        if (!this.renderer) return;
        const camera = this.renderer.getCamera();
        camera.animate({ ratio: camera.ratio * 1.5 });
    },

    zoomReset() {
        if (!this.renderer) return;
        this.renderer.getCamera().animatedReset();
    },

    resetColors() {
        this.graph.forEachNode((node, attributes) => {
            if (attributes.originalColor) this.graph.setNodeAttribute(node, "color", attributes.originalColor);
        });
    },

    resetSizes() {
        this.graph.forEachNode((node, attributes) => {
            if (attributes.originalSize) this.graph.setNodeAttribute(node, "size", attributes.originalSize);
        });
    },

    toggleColorViz(type) {
        if (this.activeColorViz === type) {
            this.resetColors();
            this.activeColorViz = null;
            if (this.renderer) this.renderer.refresh();
            return;
        }

        this.resetColors();
        this.activeColorViz = type;

        if (type === 'louvain') {
            if (!graphologyLibrary.communitiesLouvain) return alert("Louvain library not loaded.");
            const communities = graphologyLibrary.communitiesLouvain(this.graph);
            // Open Props Colors (Red 6, Green 6, Yellow 6, Blue 6, Orange 6, Purple 6, Cyan 6, Pink 6, Lime 6, Teal 6, Indigo 6, Violet 6, Grape 6, Choc 6)
            const colors = [
                "#e5484d", "#46a758", "#f5d90a", "#0090ff", "#f76b15", "#8e4ec6", "#00a2c7", "#d6409f", "#99d52a", "#12a594", "#3e63dd", "#6e56cf", "#ae3ec9", "#a15c13"
            ];
            this.graph.forEachNode((node) => {
                this.graph.setNodeAttribute(node, "color", colors[communities[node] % colors.length]);
            });
        } else if (type === 'betweenness') {
            if (!graphologyLibrary.metrics) return alert("Metrics library not loaded.");
            const scores = graphologyLibrary.metrics.centrality.betweenness(this.graph);
            const minScore = Math.min(...Object.values(scores));
            const maxScore = Math.max(...Object.values(scores));
            this.graph.forEachNode((node) => {
                const normalized = (scores[node] - minScore) / (maxScore - minScore);
                // Slate 400 (148, 163, 184) to Red 600 (220, 38, 38)
                const r = Math.floor(148 + (220 - 148) * normalized);
                const g = Math.floor(163 + (38 - 163) * normalized);
                const b = Math.floor(184 + (38 - 184) * normalized);
                this.graph.setNodeAttribute(node, "color", `rgb(${r}, ${g}, ${b})`);
            });
        } else if (type === 'components') {
            if (!graphologyLibrary.components) return alert("Components library not loaded.");
            const componentArrays = graphologyLibrary.components.connectedComponents(this.graph);
            let largestComponent = [];
            componentArrays.forEach(comp => {
                if (comp.length > largestComponent.length) largestComponent = comp;
            });
            const largestComponentSet = new Set(largestComponent);
            this.graph.forEachNode((node) => {
                this.graph.setNodeAttribute(node, "color", largestComponentSet.has(node) ? "#3cb44b" : "#cccccc");
            });
        }
        if (this.renderer) this.renderer.refresh();
    },

    toggleSizeViz(type) {
        if (this.activeSizeViz === type) {
            this.resetSizes();
            this.activeSizeViz = null;
            if (this.renderer) this.renderer.refresh();
            return;
        }

        this.resetSizes();
        this.activeSizeViz = type;

        if (type === 'pagerank') {
            if (!graphologyLibrary.metrics) return alert("Metrics library not loaded.");
            const scores = graphologyLibrary.metrics.centrality.pagerank(this.graph);
            const minScore = Math.min(...Object.values(scores));
            const maxScore = Math.max(...Object.values(scores));
            this.graph.forEachNode((node) => {
                const normalized = (scores[node] - minScore) / (maxScore - minScore);
                this.graph.setNodeAttribute(node, "size", 6 + (25 * normalized));
            });
        } else if (type === 'degree') {
            this.graph.forEachNode((node) => {
                const degree = this.graph.degree(node);
                // Simple scaling
                this.graph.setNodeAttribute(node, "size", Math.min(6 + degree, 30));
            });
        }
        if (this.renderer) this.renderer.refresh();
    },

    toggleStats() {
        this.showStats = !this.showStats;
        if (this.showStats && this.graph) {
            this.stats.nodes = this.graph.order;
            this.stats.edges = this.graph.size;
            this.stats.density = graphologyLibrary.metrics.graph.density(this.graph).toFixed(4);
            let totalDegree = 0;
            this.graph.forEachNode(node => {
                totalDegree += this.graph.degree(node);
            });
            this.stats.avgDegree = (totalDegree / this.graph.order).toFixed(2);
        }
    },

    runLayout(algorithm) {
        if (!this.graph) return;
        this.layout = algorithm;

        // Stop any running layout
        if (this.layoutInstance) {
            this.layoutInstance.stop();
            this.layoutInstance = null;
        }

        if (algorithm === 'forceatlas2') {
            if (!graphologyLibrary.layoutForceAtlas2) return alert("ForceAtlas2 not loaded.");
            graphologyLibrary.layoutForceAtlas2.assign(this.graph, { iterations: 50, settings: { gravity: 1 } });
        } else if (algorithm === 'circular') {
            if (!graphologyLibrary.layout) return alert("Layout library not loaded.");
            graphologyLibrary.layout.circle.assign(this.graph);
        } else if (algorithm === 'random') {
            if (!graphologyLibrary.layout) return alert("Layout library not loaded.");
            graphologyLibrary.layout.random.assign(this.graph);
        } else if (algorithm === 'noverlap') {
            if (!graphologyLibrary.layoutNoverlap) return alert("Noverlap library not loaded.");
            graphologyLibrary.layoutNoverlap.assign(this.graph);
        }
    }
})
