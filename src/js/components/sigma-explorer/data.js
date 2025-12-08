
export const initialState = () => ({
    masterData: { nodes: [], edges: [] },
});

export const methods = {
    loadGraph(db) {
        this.status = "Extracting Data...";
        this.masterData = { nodes: [], edges: [] };
        
        // Query Nodes
        try {
            const nodesStmt = db.prepare("SELECT * FROM nodes");
            const excludedIds = new Set([
                "term-035", "CIP-3", "term-040", "term-036", "term-038",
                "term-027", "term-025", "term-026", "term-024",
            ]);

            while (nodesStmt.step()) {
                const row = nodesStmt.getAsObject();
                if (excludedIds.has(row.id)) continue;
                this.masterData.nodes.push(row);
            }
        } catch (e) { console.error("Node Error", e); }

        // Query Edges
        try {
            const edgesStmt = db.prepare("SELECT * FROM edges");
            while (edgesStmt.step()) {
                const row = edgesStmt.getAsObject();
                this.masterData.edges.push(row);
            }
        } catch (e) { console.error("Edge Error", e); }
        
        // Chain operations
        if (this.constructGraph) this.constructGraph();
        
        if (this.initRenderer && this.$refs.sigmaContainer) {
            this.initRenderer(this.$refs.sigmaContainer);
        }
    }
};
