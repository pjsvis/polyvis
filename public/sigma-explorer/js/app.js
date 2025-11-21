// Initialize SQL.js
initSqlJs({
    locateFile: (file) =>
        `https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.8.0/${file}`,
}).then(function (SQL) {
    const xhr = new XMLHttpRequest();
    xhr.open("GET", "/data/ctx.db", true);
    xhr.responseType = "arraybuffer";

    xhr.onload = function (e) {
        if (this.status !== 200) {
            document.getElementById("status").innerHTML =
                `<span class="text-red-500">Error: ctx.db not found (Status ${this.status})</span>`;
            return;
        }
        const uInt8Array = new Uint8Array(this.response);
        const db = new SQL.Database(uInt8Array);
        loadGraph(db);
    };
    xhr.send();
});

function loadGraph(db) {
    // 1. Instantiate Graphology
    const graph = new graphology.Graph();

    document.getElementById("status").textContent = "Extracting Data...";

    // 2. Query Nodes
    try {
        const nodesStmt = db.prepare("SELECT * FROM nodes");
        while (nodesStmt.step()) {
            const row = nodesStmt.getAsObject();
            // Add Node with randomization to help ForceAtlas start
            graph.addNode(row.id, {
                label: row.label,
                // Visual Hierarchy: Core Concepts are big/black, others small/grey
                size: row.type === "Core Concept" ? 15 : 5,
                color: row.type === "Core Concept" ? "black" : "#999",
                originalSize: row.type === "Core Concept" ? 15 : 5,
                originalColor: row.type === "Core Concept" ? "black" : "#999",
                x: Math.random() * 100,
                y: Math.random() * 100,
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
            if (graph.hasNode(row.source) && graph.hasNode(row.target)) {
                // Avoid duplicates if DB has them
                if (!graph.hasEdge(row.source, row.target)) {
                    graph.addEdge(row.source, row.target, {
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

    const nodeCount = graph.order;
    const edgeCount = graph.size;
    document.getElementById("status").textContent =
        `Graph Loaded: ${nodeCount} Nodes, ${edgeCount} Edges. Running Physics...`;

    // 4. Run Layout (ForceAtlas2)
    if (window.graphologyLibrary && window.graphologyLibrary.layoutForceAtlas2) {
        console.log("Running initial ForceAtlas2 layout...");
        window.graphologyLibrary.layoutForceAtlas2.assign(graph, {
            iterations: 50, // Run 50 ticks of physics
            settings: {
                gravity: 1,
                scalingRatio: 5,
                barnesHutOptimize: nodeCount > 2000,
            },
        });
    } else {
        console.warn(
            "ForceAtlas2 library not loaded correctly. Using random positions.",
            window.graphologyLibrary
        );
    }

    // 5. Render with Sigma
    const container = document.getElementById("sigma-container");
    container.innerHTML = "";

    // Add zoom controls
    const controlsDiv = document.createElement("div");
    controlsDiv.className = "zoom-controls";
    controlsDiv.innerHTML = `
            <button id="zoom-in" class="zoom-btn" title="Zoom In">+</button>
            <button id="zoom-reset" class="zoom-btn" title="Reset Zoom">⟲</button>
            <button id="zoom-out" class="zoom-btn" title="Zoom Out">-</button>
        `;
    container.appendChild(controlsDiv);

    // Add Analysis Controls
    const analysisDiv = document.createElement("div");
    analysisDiv.style.position = "absolute";
    analysisDiv.style.top = "20px";
    analysisDiv.style.left = "20px";
    analysisDiv.style.display = "flex";
    analysisDiv.style.flexWrap = "wrap"; // Allow wrapping to multiple rows
    analysisDiv.style.gap = "10px";
    analysisDiv.style.maxWidth = "calc(100% - 200px)"; // Leave space for zoom controls
    analysisDiv.style.zIndex = "10";
    analysisDiv.innerHTML = `
        <button id="btn-louvain" class="zoom-btn">Color by Community</button>
        <button id="btn-pagerank" class="zoom-btn">Size by Importance</button>
        <button id="btn-degree" class="zoom-btn">Size by Connections</button>
        <button id="btn-betweenness" class="zoom-btn">Highlight Bridges</button>
        <button id="btn-components" class="zoom-btn">Show Components</button>
<!-- <button id="btn-find-path" class="zoom-btn">Find Path</button> -->
        <button id="btn-show-stats" class="zoom-btn">Show Stats</button>
        <div style="width: 100%; height: 0; flex-basis: 100%;"></div> <!-- Line break -->
        <select id="layout-select" class="zoom-btn" style="cursor: pointer;">
            <option value="forceatlas2">Layout: ForceAtlas2</option>
            <option value="circular">Layout: Circular</option>
            <option value="random">Layout: Random</option>
            <option value="noverlap">Layout: Noverlap (Refine)</option>
        </select>
    `;
    container.appendChild(analysisDiv);

    // Add Statistics Panel
    const statsPanel = document.createElement("div");
    statsPanel.id = "stats-panel";
    statsPanel.style.position = "absolute";
    statsPanel.style.bottom = "20px";
    statsPanel.style.left = "20px";
    statsPanel.style.background = "white";
    statsPanel.style.border = "1px solid #ccc";
    statsPanel.style.borderRadius = "4px";
    statsPanel.style.padding = "15px";
    statsPanel.style.boxShadow = "2px 2px 5px rgba(0, 0, 0, 0.1)";
    statsPanel.style.fontFamily = "monospace";
    statsPanel.style.fontSize = "12px";
    statsPanel.style.zIndex = "10";
    statsPanel.style.display = "none"; // Hidden by default
    statsPanel.style.minWidth = "200px";
    container.appendChild(statsPanel);

    const renderer = new Sigma(graph, container, {
        renderEdgeLabels: true,
    });

    // Disable mouse wheel zoom
    container.addEventListener(
        "wheel",
        (e) => {
            e.stopPropagation();
        },
        true
    );

    try {
        if (renderer.getMouseCaptor()) {
            renderer.getMouseCaptor().isMouseWheelEnabled = false;
        }
    } catch (e) { }

    // Bind zoom events
    document.getElementById("zoom-in").addEventListener("click", () => {
        const camera = renderer.getCamera();
        camera.animate({ ratio: camera.ratio / 1.5 });
    });

    document.getElementById("zoom-out").addEventListener("click", () => {
        const camera = renderer.getCamera();
        camera.animate({ ratio: camera.ratio * 1.5 });
    });

    document.getElementById("zoom-reset").addEventListener("click", () => {
        renderer.getCamera().animatedReset();
    });

    // State management for toggles
    // Track color and size visualizations separately (they can coexist)
    let activeColorViz = null; // louvain, betweenness, components
    let activeSizeViz = null;  // pagerank, degree

    // Helper function to reset to original state
    const resetToOriginal = () => {
        graph.forEachNode((node, attributes) => {
            if (attributes.originalColor) graph.setNodeAttribute(node, "color", attributes.originalColor);
            if (attributes.originalSize) graph.setNodeAttribute(node, "size", attributes.originalSize);
        });
        renderer.refresh(); // Ensure changes are rendered
    };

    // Helper to reset only colors
    const resetColors = () => {
        graph.forEachNode((node, attributes) => {
            if (attributes.originalColor) graph.setNodeAttribute(node, "color", attributes.originalColor);
        });
    };

    // Helper to reset only sizes
    const resetSizes = () => {
        graph.forEachNode((node, attributes) => {
            if (attributes.originalSize) graph.setNodeAttribute(node, "size", attributes.originalSize);
        });
    };

    // Helper to clear active button styling
    const clearActiveButtons = () => {
        document.querySelectorAll(".zoom-btn").forEach(btn => {
            // Only remove 'active' from analysis buttons, not zoom buttons
            if (btn.id.startsWith("btn-")) {
                btn.classList.remove("active");
            }
        });
    };

    // Bind Analysis Events
    // Louvain (Color visualization)
    document.getElementById("btn-louvain").addEventListener("click", (e) => {
        if (activeColorViz === "louvain") {
            // Toggle off
            resetColors();
            activeColorViz = null;
            e.target.classList.remove("active");
            renderer.refresh();
            return;
        }

        // Apply new color visualization
        resetColors();
        document.querySelectorAll("#btn-louvain, #btn-betweenness, #btn-components").forEach(btn => btn.classList.remove("active"));
        e.target.classList.add("active");
        activeColorViz = "louvain";

        if (typeof graphologyLibrary === "undefined" || !graphologyLibrary.communitiesLouvain) {
            alert("Louvain library not loaded.");
            return;
        }

        const communities = graphologyLibrary.communitiesLouvain(graph);
        const colors = ["#e6194b", "#3cb44b", "#ffe119", "#4363d8", "#f58231", "#911eb4", "#46f0f0", "#f032e6", "#bcf60c", "#fabebe", "#008080", "#e6beff", "#9a6324", "#fffac8", "#800000", "#aaffc3", "#808000", "#ffd8b1", "#000075", "#808080", "#ffffff", "#000000"];

        graph.forEachNode((node, attributes) => {
            const communityId = communities[node];
            const color = colors[communityId % colors.length];
            graph.setNodeAttribute(node, "color", color);
        });
    });

    // PageRank (Size visualization)
    document.getElementById("btn-pagerank").addEventListener("click", (e) => {
        if (activeSizeViz === "pagerank") {
            resetSizes();
            activeSizeViz = null;
            e.target.classList.remove("active");
            renderer.refresh();
            return;
        }

        resetSizes();
        document.querySelectorAll("#btn-pagerank, #btn-degree").forEach(btn => btn.classList.remove("active"));
        e.target.classList.add("active");
        activeSizeViz = "pagerank";

        if (typeof graphologyLibrary === "undefined" || !graphologyLibrary.metrics) {
            alert("Metrics library not loaded.");
            return;
        }

        const scores = graphologyLibrary.metrics.centrality.pagerank(graph);
        const minScore = Math.min(...Object.values(scores));
        const maxScore = Math.max(...Object.values(scores));

        graph.forEachNode((node) => {
            const score = scores[node];
            const size = 3 + ((score - minScore) / (maxScore - minScore)) * 27;
            graph.setNodeAttribute(node, "size", size);
        });
    });

    // Degree Centrality (Size visualization)
    document.getElementById("btn-degree").addEventListener("click", (e) => {
        if (activeSizeViz === "degree") {
            resetSizes();
            activeSizeViz = null;
            e.target.classList.remove("active");
            renderer.refresh();
            return;
        }

        resetSizes();
        document.querySelectorAll("#btn-pagerank, #btn-degree").forEach(btn => btn.classList.remove("active"));
        e.target.classList.add("active");
        activeSizeViz = "degree";

        if (typeof graphologyLibrary === "undefined" || !graphologyLibrary.metrics) {
            alert("Metrics library not loaded.");
            return;
        }

        const scores = graphologyLibrary.metrics.centrality.degree(graph);
        const minScore = Math.min(...Object.values(scores));
        const maxScore = Math.max(...Object.values(scores));

        graph.forEachNode((node) => {
            const score = scores[node];
            const size = 4 + ((score - minScore) / (maxScore - minScore)) * 21;
            graph.setNodeAttribute(node, "size", size);
        });
    });

    // Betweenness Centrality (Color visualization)
    document.getElementById("btn-betweenness").addEventListener("click", (e) => {
        if (activeColorViz === "betweenness") {
            resetColors();
            activeColorViz = null;
            e.target.classList.remove("active");
            renderer.refresh();
            return;
        }

        resetColors();
        document.querySelectorAll("#btn-louvain, #btn-betweenness, #btn-components").forEach(btn => btn.classList.remove("active"));
        e.target.classList.add("active");
        activeColorViz = "betweenness";

        if (typeof graphologyLibrary === "undefined" || !graphologyLibrary.metrics) {
            alert("Metrics library not loaded.");
            return;
        }

        const scores = graphologyLibrary.metrics.centrality.betweenness(graph);
        const minScore = Math.min(...Object.values(scores));
        const maxScore = Math.max(...Object.values(scores));

        graph.forEachNode((node) => {
            const score = scores[node];
            const normalized = (score - minScore) / (maxScore - minScore);
            const r = 255;
            const g = Math.floor(255 * (1 - normalized * 0.8));
            const b = Math.floor(255 * (1 - normalized));
            const color = `rgb(${r}, ${g}, ${b})`;
            graph.setNodeAttribute(node, "color", color);
        });
    });

    // Connected Components (Color visualization)
    document.getElementById("btn-components").addEventListener("click", (e) => {
        if (activeColorViz === "components") {
            resetColors();
            activeColorViz = null;
            e.target.classList.remove("active");
            renderer.refresh();
            return;
        }

        resetColors();
        document.querySelectorAll("#btn-louvain, #btn-betweenness, #btn-components").forEach(btn => btn.classList.remove("active"));
        e.target.classList.add("active");
        activeColorViz = "components";

        if (typeof graphologyLibrary === "undefined" || !graphologyLibrary.components) {
            alert("Components library not loaded.");
            return;
        }

        const componentArrays = graphologyLibrary.components.connectedComponents(graph);
        console.log(`Found ${componentArrays.length} connected component(s)`);

        let largestComponent = [];
        componentArrays.forEach(comp => {
            if (comp.length > largestComponent.length) {
                largestComponent = comp;
            }
        });

        console.log(`Largest component has ${largestComponent.length} nodes`);
        console.log(`${componentArrays.length - 1} other components`);

        const largestComponentSet = new Set(largestComponent);
        const mainColor = "#3cb44b";
        const isolatedColor = "#cccccc";

        let coloredCount = 0;
        let mainCount = 0;
        graph.forEachNode((node) => {
            if (largestComponentSet.has(node)) {
                graph.setNodeAttribute(node, "color", mainColor);
                mainCount++;
            } else {
                graph.setNodeAttribute(node, "color", isolatedColor);
            }
            coloredCount++;
        });

        console.log(`Colored ${coloredCount} nodes - ${mainCount} in main component (green), ${coloredCount - mainCount} isolated/small (gray)`);
        renderer.refresh();
    });

    // Bind Show Stats Event
    document.getElementById("btn-show-stats").addEventListener("click", () => {
        const panel = document.getElementById("stats-panel");

        if (panel.style.display === "none") {
            // Calculate statistics
            const nodes = graph.order;
            const edges = graph.size;
            const density = graphologyLibrary.metrics.graph.density(graph);
            const avgDegree = (2 * edges) / nodes; // Manual calculation for undirected graph

            // Update panel content
            panel.innerHTML = `
            <div style="font-weight: bold; margin-bottom: 10px; border-bottom: 1px solid #ccc; padding-bottom: 5px;">Graph Statistics</div>
            <div><strong>Nodes:</strong> ${nodes}</div>
            <div><strong>Edges:</strong> ${edges}</div>
            <div><strong>Density:</strong> ${density.toFixed(4)}</div>
            <div><strong>Avg Degree:</strong> ${avgDegree.toFixed(2)}</div>
          `;

            panel.style.display = "block";
            document.getElementById("btn-show-stats").textContent = "Hide Stats";
        } else {
            panel.style.display = "none";
            document.getElementById("btn-show-stats").textContent = "Show Stats";
        }
    });

    // Find Path Mode (Disabled)
    /*
    let pathMode = false;
    let sourceNode = null;
    let targetNode = null;
    let pathNodes = [];
    let pathEdges = [];
  
    document.getElementById("btn-find-path").addEventListener("click", (e) => {
      pathMode = !pathMode;
  
      if (pathMode) {
        e.target.classList.add("active");
        sourceNode = null;
        targetNode = null;
        pathNodes = [];
        pathEdges = [];
        console.log("Path mode activated. Click two nodes to find the shortest path.");
      } else {
        e.target.classList.remove("active");
        // Clear path visualization
        if (pathNodes.length > 0) {
          resetColors();
          renderer.refresh();
        }
        sourceNode = null;
        targetNode = null;
        pathNodes = [];
        pathEdges = [];
        console.log("Path mode deactivated.");
      }
    });
    */

    // Handle node clicks for path finding
    renderer.on("clickNode", ({ node }) => {
        if (!pathMode) return;

        if (!sourceNode) {
            // First click: select source
            sourceNode = node;
            graph.setNodeAttribute(node, "color", "#0066ff"); // Blue
            renderer.refresh();
            console.log(`Source node selected: ${node}`);
        } else if (!targetNode && node !== sourceNode) {
            // Second click: select target and find path
            targetNode = node;
            graph.setNodeAttribute(node, "color", "#00cc00"); // Green
            renderer.refresh();
            console.log(`Target node selected: ${node}`);

            // Find shortest path
            if (typeof graphologyLibrary === "undefined" || !graphologyLibrary.shortestPath) {
                alert("Shortest path library not loaded.");
                return;
            }

            const path = graphologyLibrary.shortestPath.bidirectional(graph, sourceNode, targetNode);

            if (path === null) {
                console.log(`No path found between ${sourceNode} and ${targetNode}`);
                alert(`No path exists between the selected nodes (they are in different components).`);
                // Reset for new selection
                resetColors();
                sourceNode = null;
                targetNode = null;
                renderer.refresh();
            } else {
                pathNodes = path;
                console.log(`Path found (length ${path.length - 1}):`, path);

                // Highlight path nodes (except source and target which are already colored)
                path.forEach((pathNode, index) => {
                    if (index > 0 && index < path.length - 1) {
                        graph.setNodeAttribute(pathNode, "color", "#ff6600"); // Orange
                    }
                });

                // Highlight path edges
                for (let i = 0; i < path.length - 1; i++) {
                    const edge = graph.edge(path[i], path[i + 1]);
                    if (edge) {
                        pathEdges.push(edge);
                        // Note: Sigma.js doesn't easily support edge highlighting without custom rendering
                        // For now, we'll just log it
                    }
                }

                renderer.refresh();
                console.log(`Path visualization complete. Click "Find Path" again to clear and select new nodes.`);
            }
        } else {
            // Third click: reset and start over
            console.log("Resetting path selection...");
            resetColors();
            sourceNode = null;
            targetNode = null;
            pathNodes = [];
            pathEdges = [];
            renderer.refresh();
        }
    });

    // Layout Switcher Logic
    const layoutSelect = document.getElementById("layout-select");

    layoutSelect.addEventListener("change", (e) => {
        const layout = e.target.value;
        console.log("Switching layout to:", layout);
        const lib = window.graphologyLibrary;

        if (!lib) {
            console.error("Graphology Library not found!");
            return;
        }

        if (layout === "forceatlas2") {
            if (lib.layoutForceAtlas2) {
                document.getElementById("status").textContent = "Running ForceAtlas2...";
                lib.layoutForceAtlas2.assign(graph, {
                    iterations: 50,
                    settings: { gravity: 1 }
                });
                document.getElementById("status").textContent = "ForceAtlas2 Complete.";
            } else { console.error("ForceAtlas2 not found in library"); }
        } else if (layout === "circular") {
            if (lib.layout && lib.layout.circular) {
                document.getElementById("status").textContent = "Applying Circular Layout...";
                lib.layout.circular.assign(graph);
                document.getElementById("status").textContent = "Circular Layout Applied.";
            } else { console.error("Circular layout not found in library"); }
        } else if (layout === "random") {
            if (lib.layout && lib.layout.random) {
                document.getElementById("status").textContent = "Applying Random Layout...";
                lib.layout.random.assign(graph);
                document.getElementById("status").textContent = "Random Layout Applied.";
            } else { console.error("Random layout not found in library"); }
        } else if (layout === "noverlap") {
            if (lib.layoutNoverlap) {
                document.getElementById("status").textContent = "Removing Overlaps...";
                lib.layoutNoverlap.assign(graph);
                document.getElementById("status").textContent = "Overlaps Removed.";
            } else {
                alert("Noverlap layout not found.");
            }
        }

        renderer.refresh();
        // Reset zoom to fit new layout
        renderer.getCamera().animatedReset();
    });

    document.getElementById("status").textContent =
        "Interactive Mode Active. Buttons to Zoom, Drag to Move.";
}
