# Sigma.js Playbook

## Version

We are using **Sigma.js v2.4.0**.

> [!IMPORTANT]
> **Version Critical**: We are strictly using **v2.4.0**. Do not use v1 (uses `sigma.instances`) or v3 (uses different settings) documentation.

> [!NOTE]
> **Alpine.js Integration**: This playbook is designed to be used with Alpine.js. Avoid direct DOM manipulation (e.g., `document.getElementById`) and prefer Alpine directives (`x-on`, `x-ref`) and component state.

## Core Concepts

- **Graphology**: Used for graph data structure and manipulation.
- **Sigma**: The renderer (WebGL).
- **Layout**: ForceAtlas2 is used for layout.

## Configuration

### Renderer Settings

Settings are passed to the `Sigma` constructor. Use `x-ref` to reference the container.

```js
// Inside Alpine component init()
const container = this.$refs.sigmaContainer;
this.renderer = new Sigma(this.graph, container, {
  renderEdgeLabels: true,
  // Add other settings here
});
```

## Camera Control

### Zooming

> [!WARNING]
> **Inverse Logic**: In Sigma v2, `camera.ratio` is the **inverse** of the zoom level.
>
> - **Ratio < 1**: Zoomed In (Seeing a smaller area)
> - **Ratio > 1**: Zoomed Out (Seeing a larger area)

To control zoom programmatically, use Alpine methods bound to `@click`:

```html
<button @click="zoomIn()">+</button>
<button @click="zoomOut()">-</button>
```

```js
// Alpine component methods
zoomIn() {
  const camera = this.renderer.getCamera();
  camera.animate({ ratio: camera.ratio / 1.5 });
},
zoomOut() {
  const camera = this.renderer.getCamera();
  camera.animate({ ratio: camera.ratio * 1.5 });
}
```

### Disabling Scroll Zoom

In v2.4.0, prevent the `wheel` event from reaching Sigma using Alpine's `.stop` modifier on the container.

```html
<div 
  x-ref="sigmaContainer" 
  class="absolute inset-0" 
  @wheel.stop
></div>
```

## Event Handling

### The "Click Race" (Node vs Stage)

> [!CAUTION]
> **Event Propagation**: Clicking a node often triggers a `clickNode` event followed immediately by a `clickStage` (background) event. If your `clickStage` handler clears the selection, it will instantly deselect the node you just clicked.

**Solution: The Debounce Lock**

Use a flag (e.g., `clickBlock`) to temporarily ignore stage clicks after a node click.

```js
// Alpine Component Data
data() {
  return {
    clickBlock: false, // The Lock
    // ...
  }
}

// In init() or setup
this.renderer.on("clickNode", ({ node }) => {
  // 1. Engage Lock
  this.clickBlock = true;
  setTimeout(() => this.clickBlock = false, 200); // 200ms debounce

  // 2. Handle Selection
  this.selectedNode = node;
});

this.renderer.on("clickStage", () => {
  // 1. Check Lock
  if (this.clickBlock) return; 

  // 2. Clear Selection
  this.selectedNode = null;
});
```
