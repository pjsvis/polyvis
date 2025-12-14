export const initialState = () => ({
	graph: null,
	layout: "forceatlas2",
	layoutInstance: null,
	showOrphans: false,
	orphanCount: 0,
});

export const methods = {
	constructGraph() {
		if (!this.graph) this.graph = new graphology.Graph({ type: "directed" });
		else this.graph.clear(); // STRICT RESET

		const nodeCount = this.masterData.nodes.length;
		console.log(
			`Constructing Graph for Domain: ${this.activeDomain} (Source: ${nodeCount} items)`,
		);

		// Add ALL Nodes (Filter dynamically later)
		this.masterData.nodes.forEach((row) => {
			if (row.type === "root" || row.type === "domain") return;

            // Add NodeSub-Graph Filter (Composability)
			// A node is included if its assigned subGraph is in the active list.
			if (!this.activeSubGraphs.includes(row.subGraph)) return;

			// Add Node
			if (!this.graph.hasNode(row.id)) {
				this.graph.addNode(row.id, {
					label: row.title || row.label || row.id,
					nodeType: row.type || "Unknown",
					domain: row.domain,
					subGraph: row.subGraph,
					definition: row.content || row.definition || "",

					size: (() => {
						if (row.type === "term" || row.type === "Core Concept") return 20;
						if (row.type === "playbook") return 12;
						if (row.type === "protocol") return 12;
						if (row.type === "directive") return 10;
						if (row.type === "debrief") return 8;
						if (row.type === "section") return 4;
						return 6;
					})(),

					color: (() => {
						// Persona / Ontology
						if (row.subGraph === "persona") return "black";
						
						// Sub-Graph Colors
						if (row.subGraph === "playbooks") return "#f97316"; // Orange
						if (row.subGraph === "debriefs") return "#3b82f6";  // Blue
						if (row.subGraph === "briefs") return "#22c55e";    // Green
						if (row.subGraph === "knowledge") return "#ec4899"; // Pink
						
						// Fallbacks
						if (row.type === "protocol") return "#a855f7"; // Purple
						return "#475569"; // Slate
					})(),

					originalSize:
						row.type === "term" || row.type === "Core Concept" ? 20 : 6,
					originalColor: row.subGraph === "persona" ? "black" : "#475569",

					x: ((str) => {
						let hash = 0;
						for (let i = 0; i < str.length; i++)
							hash = (Math.imul(31, hash) + str.charCodeAt(i)) | 0;
						return (Math.abs(hash) % 1000) / 10;
					})(row.id + "x"),
					y: ((str) => {
						let hash = 0;
						for (let i = 0; i < str.length; i++)
							hash = (Math.imul(31, hash) + str.charCodeAt(i)) | 0;
						return (Math.abs(hash) % 1000) / 10;
					})(row.id + "y"),

					external_refs: row.external_refs ? JSON.parse(row.external_refs) : [],
				});
			}
		});

		// Add Edges
		this.masterData.edges.forEach((row) => {
			if (this.graph.hasNode(row.source) && this.graph.hasNode(row.target)) {
				if (!this.graph.hasEdge(row.source, row.target)) {
					this.graph.addEdge(row.source, row.target, {
						type: "arrow",
						label: row.type || row.relation,
						size: 2,
						color:
							getComputedStyle(document.documentElement)
								.getPropertyValue("--graph-edge")
								.trim() || "#ffffff",
					});
				}
			}
		});

		const currentNodes = this.graph.order;
		const currentEdges = this.graph.size;
		this.status = `Graph Config: ${this.activeSubGraphs.join('+')} | ${currentNodes} Nodes, ${currentEdges} Edges.`;

		// Compute Stats & Visibility
		this.computeOrphanStats();

		// Update Stats Panel if active
		if (this.updateStats) this.updateStats();

		// Run Layout
		this.runLayout("forceatlas2");

		// Apply Default Visualization
		if (this.toggleColorViz) this.toggleColorViz("louvain", true);
		if (this.toggleSizeViz) this.toggleSizeViz("pagerank");

		// Apply Orphan Visibility Last (Overrides colors/visibility)
		this.updateOrphanVisibility();
	},

	toggleSubGraph(subGraph) {
		if (this.activeSubGraphs.includes(subGraph)) {
			// Remove it
			this.activeSubGraphs = this.activeSubGraphs.filter(g => g !== subGraph);
		} else {
			// Add it
			this.activeSubGraphs.push(subGraph);
		}
		
		console.log("Active Sub-Graphs:", this.activeSubGraphs);

		// Must Reconstruct Graph
		this.constructGraph();

		// Refresh Louvain if active
		if (this.activeColorViz === "louvain") {
			this.louvainCommunities = null; // Force recalc
			if (this.toggleColorViz) this.toggleColorViz("louvain", true);
		} else {
			if (this.renderer) this.renderer.refresh();
		}

		// Center the new graph
		if (this.zoomReset) this.zoomReset();
	},

	toggleOrphans() {
		this.showOrphans = !this.showOrphans;
		this.updateOrphanVisibility();
	},

	updateOrphanVisibility() {
		if (!this.graph) return;

		this.graph.forEachNode((node) => {
			const degree = this.graph.degree(node);
			if (degree === 0) {
				if (this.showOrphans) {
					this.graph.setNodeAttribute(node, "hidden", false);
					this.graph.setNodeAttribute(node, "color", "#ef4444"); // Red for emphasis
					// this.graph.setNodeAttribute(node, "size", 8);
				} else {
					this.graph.setNodeAttribute(node, "hidden", true);
				}
			}
		});

		if (this.renderer) this.renderer.refresh();
	},

	computeOrphanStats() {
		if (!this.graph) return;
		let count = 0;
		this.graph.forEachNode((node) => {
			if (this.graph.degree(node) === 0) count++;
		});
		this.orphanCount = count;
	},

	runLayout(algorithm) {
		if (!this.graph) return;
		this.layout = algorithm;

		if (this.layoutInstance) {
			this.layoutInstance.stop();
			this.layoutInstance = null;
		}

		if (algorithm === "forceatlas2") {
			if (!graphologyLibrary.layoutForceAtlas2)
				return alert("ForceAtlas2 not loaded.");
			graphologyLibrary.layoutForceAtlas2.assign(this.graph, {
				iterations: 50,
				settings: { gravity: 1 },
			});
		} else if (algorithm === "circular") {
			if (!graphologyLibrary.layout) return alert("Layout library not loaded.");
			graphologyLibrary.layout.circle.assign(this.graph);
		} else if (algorithm === "random") {
			if (!graphologyLibrary.layout) return alert("Layout library not loaded.");
			graphologyLibrary.layout.random.assign(this.graph);
		} else if (algorithm === "noverlap") {
			if (!graphologyLibrary.layoutNoverlap)
				return alert("Noverlap library not loaded.");
			graphologyLibrary.layoutNoverlap.assign(this.graph);
		}
	},
};
