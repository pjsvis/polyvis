
export const initialState = () => ({
    renderer: null,
    hoveredNode: null,
    selectedNode: null,
    searchQuery: '',
    searchResults: [],
    isSearchFocused: false,
    showStats: false,
    stats: { nodes: 0, edges: 0, density: 0, avgDegree: 0 },
    tooltip: { visible: false, text: '', x: 0, y: 0 },
});

export const methods = {
    initRenderer(container) {
        container.innerHTML = ""; 

		this.renderer = new Sigma(this.graph, container, {
			renderEdgeLabels: true,
			nodeReducer: (node, data) => {
				if (this.selectedNode && node === this.selectedNode.id) {
					return {
						...data,
						highlighted: true,
						size: Math.max(data.size, 25),
						zIndex: 10,
						label: data.label,
					};
				}
				return data;
			},
			labelRenderedSizeThreshold: 5,
			zIndex: true,
		});

        // Initialize Cursor & Events
        container.style.cursor = "grab";
		this.setupEventListeners(container);
		
		this.status = "Interactive Mode Active. Buttons to Zoom, Drag to Move.";
    },

    setupEventListeners(container) {
        // Dragging
        this.renderer.on("downStage", () => { container.style.cursor = "grabbing"; });
		document.addEventListener("mouseup", () => {
			if (this.renderer && this.renderer.getMouseCaptor()) {
				this.renderer.getMouseCaptor().isMouseEnabled = true;
			}
			if (!this.hoveredNode) container.style.cursor = "grab";
		});
        
        // Disable mouse wheel
		try {
			if (this.renderer.getMouseCaptor()) this.renderer.getMouseCaptor().isMouseWheelEnabled = false;
		} catch (e) {}
		container.addEventListener("wheel", (e) => e.stopPropagation(), true);
        
        // Node Events
        this.renderer.on("clickNode", ({ node }) => { this.selectNode(node); });
        this.renderer.on("enterNode", ({ node }) => {
			container.style.cursor = "pointer";
			this.hoveredNode = node;
		});
		this.renderer.on("leaveNode", () => {
			container.style.cursor = "";
			this.hoveredNode = null;
		});
    },

    setDomain(domain) {
        if (this.activeDomain === domain) return;
        this.activeDomain = domain;
        console.log(`Switching Domain to: ${domain}`);
        
        // Must Reconstruct Graph for proper Sigma behavior when nodes are removed/added
        if (this.constructGraph) this.constructGraph();

        // Refresh Louvain if active (to apply new resolution tuning)
        if (this.activeColorViz === "louvain") {
            this.louvainCommunities = null; // Force recalc
            if (this.toggleColorViz) this.toggleColorViz("louvain", true);
        } else {
             if (this.renderer) this.renderer.refresh();
        }

        // Center the new graph
        if (this.zoomReset) this.zoomReset();
    },
    
    selectNode(nodeId) {
        if (!nodeId) {
            this.selectedNode = null;
            if (this.renderer) this.renderer.refresh();
            return;
        }
        
        const attr = this.graph.getNodeAttributes(nodeId);
        this.selectedNode = {
            id: nodeId,
            ...attr
        };
        
        // Log click
        console.log("Selected Node:", this.selectedNode);
        
        // Open Right Sidebar
        this.rightOpen = true;
        
        if (this.renderer) this.renderer.refresh();
    },

    handleSearch() {
        if (!this.searchQuery) {
            this.searchResults = [];
            return;
        }
        const query = this.searchQuery.toLowerCase();
        
        if (!this.graph) return;
        
        const results = [];
        this.graph.forEachNode((node, attrs) => {
             if (attrs.hidden) return; // Skip hidden nodes
             if (attrs.label.toLowerCase().includes(query) || node.toLowerCase().includes(query)) {
                 results.push({ id: node, label: attrs.label });
             }
        });
        
        this.searchResults = results.slice(0, 10);
    },

    selectSearchResult(nodeId) {
        this.selectNode(nodeId);
        this.searchQuery = "";
        this.searchResults = [];
        
        // Fly to node
        if (this.renderer) {
            const camera = this.renderer.getCamera();
            const nodePos = this.renderer.getNodeDisplayData(nodeId);
            if (nodePos) {
                 camera.animate({ x: nodePos.x, y: nodePos.y, ratio: 0.5, duration: 500 });
            }
        }
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
    
    toggleStats() {
		this.showStats = !this.showStats;
		if (this.showStats && this.graph && graphologyLibrary.metrics) {
			this.stats.nodes = this.graph.order;
			this.stats.edges = this.graph.size;
			this.stats.density = graphologyLibrary.metrics.graph.density(this.graph).toFixed(4);
			let totalDegree = 0;
			this.graph.forEachNode((node) => { totalDegree += this.graph.degree(node); });
			this.stats.avgDegree = (totalDegree / this.graph.order).toFixed(2);
		}
	},
    
    showTooltip(event, text) {
        this.tooltip.visible = true;
        this.tooltip.text = text;
        this.tooltip.x = event.clientX + 10;
        this.tooltip.y = event.clientY + 10;
    },
    
    hideTooltip() {
        this.tooltip.visible = false;
    },
    
    linkify(text) {
        if (!text) return "";
        return text.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" class="text-blue-600 hover:underline">$1</a>');
    }
};
