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

		// Filter and Add Nodes
		this.masterData.nodes.forEach((row) => {
			// 1. Genesis/Structure Filter
			if (row.type === "root" || row.type === "domain") return;

			// 2. Domain Filter
			const isExperience =
				row.domain === "resonance" ||
				row.type === "playbook" ||
				row.type === "debrief" ||
				row.type === "protocol";
			const isPersona = row.domain === "persona" || !isExperience;

			let include = false;
			if (this.activeDomain === "persona" && isPersona) include = true;
			if (this.activeDomain === "experience" && isExperience) include = true;
			if (this.activeDomain === "unified") include = true;

			if (!include) return;

			// Add Node
			if (!this.graph.hasNode(row.id)) {
				this.graph.addNode(row.id, {
					label: row.title || row.label || row.id,
					nodeType: row.type || "Unknown",
					domain: row.domain || (isExperience ? "resonance" : "persona"),
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
						if (row.type === "term" || row.type === "Core Concept")
							return "black";
						if (row.type === "playbook") return "#f97316";
						if (row.type === "protocol") return "#a855f7";
						if (row.type === "directive") return "#dc2626";
						if (row.type === "debrief") return "#3b82f6";
						if (row.type === "section") return "#cbd5e1";
						return "#475569";
					})(),

					originalSize:
						row.type === "term" || row.type === "Core Concept" ? 20 : 6,
					originalColor:
						row.type === "term" || row.type === "Core Concept"
							? "black"
							: "#475569",

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
		this.status = `${this.activeDomain.toUpperCase()} Graph: ${currentNodes} Nodes, ${currentEdges} Edges.`;

		// Compute Stats & Visibility
		this.computeOrphanStats();
		this.updateOrphanVisibility();

		// Update Stats Panel if active
		if (this.updateStats) this.updateStats();

		// Run Layout
		this.runLayout("forceatlas2");

		// Apply Default Visualization
		if (this.toggleColorViz) this.toggleColorViz("louvain", true);
		if (this.toggleSizeViz) this.toggleSizeViz("pagerank");
	},

	setDomain(domain) {
		if (this.activeDomain === domain) return;
		this.activeDomain = domain;

		// Update URL
		const url = new URL(window.location);
		url.searchParams.set("domain", domain);
		window.history.pushState({}, "", url);

		this.constructGraph();
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
