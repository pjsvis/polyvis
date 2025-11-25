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
