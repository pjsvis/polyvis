
export const initialState = () => ({
    activeColorViz: 'louvain',
    activeSizeViz: 'pagerank',
    activeLouvainGroup: null,
    louvainCommunities: null,
    louvainNames: null,
});

export const methods = {
    toggleColorViz(type, force = false) {
        if (!force && this.activeColorViz === type && this.activeLouvainGroup === null) {
            this.resetColors();
            this.activeColorViz = null;
            if (this.renderer) this.renderer.refresh();
            return;
        }

        if (this.activeColorViz !== type) {
            this.resetColors();
            this.activeLouvainGroup = null; 
        }

        this.activeColorViz = type;

        if (type === "louvain") {
            if (!graphologyLibrary.communitiesLouvain) return alert("Louvain library not loaded.");
            
            if (!this.louvainCommunities) {
                const domainKey = this.activeDomain === 'experience' ? 'experience' : 'persona';
                const resolution = this.settings?.graph?.tuning?.louvain?.[domainKey] || 1.1;
                console.log(`Using Louvain Resolution (${domainKey}): ${resolution}`);

                this.louvainCommunities = graphologyLibrary.communitiesLouvain(this.graph, { resolution: resolution });
                
                this.louvainNames = {};
                const communityNodes = {};
                this.graph.forEachNode((node) => {
                    const comm = this.louvainCommunities[node];
                    if (!communityNodes[comm]) communityNodes[comm] = [];
                    communityNodes[comm].push(node);
                });
                
                Object.keys(communityNodes).forEach((commId) => {
                    let maxDegree = -1;
                    let hubNode = null;
                    communityNodes[commId].forEach((node) => {
                        const degree = this.graph.degree(node);
                        if (degree > maxDegree) {
                            maxDegree = degree;
                            hubNode = node;
                        }
                    });
                    this.louvainNames[commId] = this.graph.getNodeAttribute(hubNode, "label") || hubNode;
                });
            }
            
            const communities = this.louvainCommunities;
            const counts = {};
			Object.values(communities).forEach((id) => (counts[id] = (counts[id] || 0) + 1));
            
            const sortedGroupIds = Object.keys(counts).sort((a, b) => {
				const diff = counts[b] - counts[a];
				if (diff !== 0) return diff;
				return a.localeCompare(b);
			});
            
            const rankMap = {};
			sortedGroupIds.forEach((id, index) => (rankMap[id] = index));
            
            const colors = [ "#e5484d", "#f76b15", "#f5d90a", "#46a758", "#00a2c7", "#0090ff", "#6e56cf", "#d6409f", "#99d52a", "#12a594", "#3e63dd", "#a15c13", "#8e4ec6", "#3cb44b" ];

            this.graph.forEachNode((node) => {
                const communityId = communities[node];
                const rank = rankMap[communityId];
                
                if (this.activeLouvainGroup !== null && communityId !== this.activeLouvainGroup) {
                    this.graph.setNodeAttribute(node, "hidden", true);
                } else {
                    this.graph.setNodeAttribute(node, "hidden", false);
                    this.graph.setNodeAttribute(node, "color", colors[rank % colors.length]);
                }
            });
            
            if (this.activeLouvainGroup !== null && this.renderer) {
                 this.renderer.setSetting("labelRenderedSizeThreshold", 2);
            } else if (this.renderer) {
                 this.renderer.getCamera().animatedReset();
                 this.renderer.setSetting("labelRenderedSizeThreshold", 5);
            }

        } else if (type === "betweenness") {
            if (!graphologyLibrary.metrics) return alert("Metrics library not loaded.");
			const scores = graphologyLibrary.metrics.centrality.betweenness(this.graph);
			const minScore = Math.min(...Object.values(scores));
			const maxScore = Math.max(...Object.values(scores));
			this.graph.forEachNode((node) => {
				const normalized = (scores[node] - minScore) / (maxScore - minScore);
				const r = Math.floor(148 + (220 - 148) * normalized);
				const g = Math.floor(163 + (38 - 163) * normalized);
				const b = Math.floor(184 + (38 - 184) * normalized);
				this.graph.setNodeAttribute(node, "color", `rgb(${r}, ${g}, ${b})`);
			});
        } else if (type === "components") {
             if (!graphologyLibrary.components) return alert("Components library not loaded.");
			const componentArrays = graphologyLibrary.components.connectedComponents(this.graph);
			let largestComponent = [];
			componentArrays.forEach((comp) => {
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

        if (type === "pagerank") {
            if (!graphologyLibrary.metrics) return alert("Metrics library not loaded.");
            const scores = graphologyLibrary.metrics.centrality.pagerank(this.graph);
            const minScore = Math.min(...Object.values(scores));
            const maxScore = Math.max(...Object.values(scores));
            this.graph.forEachNode((node) => {
                const normalized = (scores[node] - minScore) / (maxScore - minScore);
                this.graph.setNodeAttribute(node, "size", 6 + 25 * normalized);
            });
        } else if (type === "degree") {
            this.graph.forEachNode((node) => {
                const degree = this.graph.degree(node);
                this.graph.setNodeAttribute(node, "size", Math.min(6 + degree, 30));
            });
        }
        if (this.renderer) this.renderer.refresh();
    },
    
    resetColors() {
        if (!this.graph) return;
        this.graph.forEachNode((node, attrs) => {
            this.graph.setNodeAttribute(node, "color", attrs.originalColor || "#475569");
            this.graph.setNodeAttribute(node, "hidden", false);
        });
    },

    resetSizes() {
        if (!this.graph) return;
        this.graph.forEachNode((node, attrs) => {
            this.graph.setNodeAttribute(node, "size", attrs.originalSize || 6);
        });
    },
    
    getLouvainGroups() {
        if (!this.louvainCommunities) return [];
		const counts = {};
		Object.values(this.louvainCommunities).forEach((id) => {
			counts[id] = (counts[id] || 0) + 1;
		});
		const colors = [ "#e5484d", "#f76b15", "#f5d90a", "#46a758", "#00a2c7", "#0090ff", "#6e56cf", "#d6409f", "#99d52a", "#12a594", "#3e63dd", "#a15c13", "#8e4ec6", "#3cb44b" ];
		const sortedGroups = Object.keys(counts)
			.map((id) => ({ id: parseInt(id), count: counts[id] }))
			.sort((a, b) => b.count - a.count);
		return sortedGroups.map((group, index) => ({
			...group,
			color: colors[index % colors.length],
			name: this.louvainNames ? this.louvainNames[group.id] : `Group ${group.id}`,
		}));
    },
    
    cycleLouvainGroup() {
        if (!this.louvainCommunities) return;
		const groups = [...new Set(Object.values(this.louvainCommunities))].sort((a, b) => a - b);
		if (this.activeLouvainGroup === null) {
			this.activeLouvainGroup = groups[0];
			if (this.renderer) this.renderer.setSetting("labelRenderedSizeThreshold", 4);
		} else {
			const currentIndex = groups.indexOf(this.activeLouvainGroup);
			if (currentIndex === groups.length - 1) {
				this.activeLouvainGroup = null; 
				if (this.renderer) this.renderer.setSetting("labelRenderedSizeThreshold", 5);
			} else {
				this.activeLouvainGroup = groups[currentIndex + 1];
				if (this.renderer) this.renderer.setSetting("labelRenderedSizeThreshold", 4);
			}
		}
		this.toggleColorViz("louvain");
    }
};
