# Sigma.js Playbook

## Version
We are using **Sigma.js v2.4.0**.

> [!IMPORTANT]
> **Version Critical**: We are strictly using **v2.4.0**. Do not use v1 (uses `sigma.instances`) or v3 (uses different settings) documentation.

## Core Concepts
- **Graphology**: Used for graph data structure and manipulation.
- **Sigma**: The renderer (WebGL).
- **Layout**: ForceAtlas2 is used for layout.

## Configuration

### Renderer Settings
Settings are passed to the `Sigma` constructor.

```js
const renderer = new Sigma(graph, container, {
  renderEdgeLabels: true,
  // Add other settings here
});
```

## Camera Control

### Zooming
> [!WARNING]
> **Inverse Logic**: In Sigma v2, `camera.ratio` is the **inverse** of the zoom level.
> - **Ratio < 1**: Zoomed In (Seeing a smaller area)
> - **Ratio > 1**: Zoomed Out (Seeing a larger area)

To control zoom programmatically, calculate the target ratio explicitly:

```js
const camera = renderer.getCamera();

// Zoom In (Divide ratio)
camera.animate({ ratio: camera.ratio / 1.5 });

// Zoom Out (Multiply ratio)
camera.animate({ ratio: camera.ratio * 1.5 });
```

### Disabling Scroll Zoom
In v2.4.0, the most reliable way to disable scroll zoom without disabling other interactions is to stop the `wheel` event from reaching Sigma.

```js
// Add this to the container element
container.addEventListener('wheel', (e) => {
    e.stopPropagation();
}, true); // Use capture phase
```
