# Graphology Cheatsheet

## Installation

```bash
npm install graphology
```

## Instantiation

### Basic Graph

```javascript
import Graph from 'graphology';
const graph = new Graph();
```

### Graph Types

Graphology supports different types of graphs:

- `Graph`: A basic graph that can be directed or undirected.
- `DirectedGraph`: A graph where all edges are directed.
- `UndirectedGraph`: A graph where all edges are undirected.

```javascript
import { DirectedGraph, UndirectedGraph } from 'graphology';

const directedGraph = new DirectedGraph();
const undirectedGraph = new UndirectedGraph();
```

### Instantiation Options

You can pass options to the constructor to customize the graph:

```javascript
const graph = new Graph({
  type: 'directed', // 'directed', 'undirected', or 'mixed'
  multi: false, // true to allow parallel edges
  allowSelfLoops: true // true to allow self-loops
});
```

## Properties

- `graph.order`: The number of nodes in the graph.
- `graph.size`: The number of edges in the graph.
- `graph.type`: The type of the graph ('directed', 'undirected', or 'mixed').
- `graph.multi`: Whether the graph allows parallel edges.
- `graph.allowSelfLoops`: Whether the graph allows self-loops.

## Read

- `graph.hasNode(node)`: Check if a node exists.
- `graph.hasEdge(edge)`: Check if an edge exists.
- `graph.degree(node)`: Get the degree of a node.
- `graph.source(edge)`: Get the source of an edge.
- `graph.target(edge)`: Get the target of an edge.
- `graph.opposite(node, edge)`: Get the opposite node of an edge.

## Mutation

- `graph.addNode(node, attributes)`: Add a node to the graph.
- `graph.addEdge(source, target, attributes)`: Add an edge to the graph.
- `graph.dropNode(node)`: Remove a node from the graph.
- `graph.dropEdge(edge)`: Remove an edge from the graph.
- `graph.clear()`: Clear the graph (remove all nodes and edges).
- `graph.clearEdges()`: Clear all edges from the graph.

## Attributes

### Node Attributes

- `graph.setNodeAttribute(node, name, value)`: Set a node attribute.
- `graph.getNodeAttribute(node, name)`: Get a node attribute.
- `graph.hasNodeAttribute(node, name)`: Check if a node has an attribute.
- `graph.removeNodeAttribute(node, name)`: Remove a node attribute.

### Edge Attributes

- `graph.setEdgeAttribute(edge, name, value)`: Set an edge attribute.
- `graph.getEdgeAttribute(edge, name)`: Get an edge attribute.
- `graph.hasEdgeAttribute(edge, name)`: Check if an edge has an attribute.
- `graph.removeEdgeAttribute(edge, name)`: Remove an edge attribute.

## Iteration

### Nodes

- `graph.forEachNode(callback)`: Iterate over each node.
- `graph.nodes()`: Get an array of all nodes.

### Edges

- `graph.forEachEdge(callback)`: Iterate over each edge.
- `graph.edges()`: Get an array of all edges.

### Neighbors

- `graph.forEachNeighbor(node, callback)`: Iterate over the neighbors of a node.
- `graph.neighbors(node)`: Get an array of the neighbors of a node.

## Serialization

- `graph.import(data)`: Import a graph from a serialized format.
- `graph.export()`: Export the graph to a serialized format.

## Standard Library

Graphology comes with a standard library that includes:

- **Algorithms**: community detection, shortest path, etc.
- **Generators**: classic graphs, random graphs, etc.
- **Layout**: ForceAtlas2, Noverlap, etc.
- **Metrics**: density, centrality, etc.
- **Traversal**: DFS, BFS, etc.

To use the standard library, you need to import the functions from `graphology-library`.

```javascript
import { dfs } from 'graphology-traversal';

dfs(graph, (node, attributes) => {
  console.log(node);
});
```

## Layouts & Dependencies

### Using Bundled Layouts (ForceAtlas2)

When using `graphology-library` via CDN (e.g., unpkg), it often bundles popular layouts like ForceAtlas2. **Do not** try to load `graphology-layout-forceatlas2` separately if you are already loading `graphology-library`, as this can lead to version conflicts or 404 errors if the standalone package doesn't have a UMD build.

**Correct Usage (Browser/CDN):**

```javascript
// graphology-library exports ForceAtlas2 directly as layoutForceAtlas2
if (graphologyLibrary.layoutForceAtlas2) {
  graphologyLibrary.layoutForceAtlas2.assign(graph, {
    iterations: 50,
    settings: { gravity: 1 }
  });
}
```

**Incorrect Usage:**

```javascript
// Avoid assuming global variables from standalone scripts unless verified
forceAtlas2.assign(graph, ...); // Likely undefined
```

### Debugging Globals

If you are unsure where a library is attached in the window object:
1.  Open the browser console.
2.  Inspect the main library object (e.g., `window.graphologyLibrary`).
3.  Check for properties like `layout`, `layoutForceAtlas2`, etc.
