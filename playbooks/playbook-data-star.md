# DATASTAR PLAYBOOK (The "Reactor" Pattern)

**Philosophy:**

* **Hollow Node:** The Client has NO logic. It only has "Bindings."
* **The Server is the Engine:** All state transitions happen in Bun.
* **The Transport:** Server-Sent Events (SSE) push HTML fragments or Signal updates.

## 1. The Stack

* **Runtime:** Bun
* **Library:** `@gavriguy/datastar-sdk` (Official TS SDK)
* **Client:** Single `script` tag (No Build Step needed for dev).

## 2. Core Concepts

### A. Signals (`data-signals`)

Global state variables on the client.

```html
<div data-signals="{ cpu: 0, status: 'IDLE' }">...</div>

<input data-bind-cpu />

<span data-text="$cpu"></span>

```

### B. The "Reactor" (SSE Stream)

The server pushes updates. It doesn't just send data; it sends **Instructions**.

* `MergeFragments`: "Here is a new `<div>`. Put it inside `#dashboard`."
* `MergeSignals`: "Update variable `$cpu` to `99`."

## 3. The "Hello World" (Bun + Datastar)

**server.ts**

```typescript
import { ServerSentEventGenerator } from "@gavriguy/datastar-sdk";

const server = Bun.serve({
  port: 3000,
  async fetch(req) {
    const url = new URL(req.url);

    // 1. Serve the Shell
    if (url.pathname === "/") return new Response(Bun.file("index.html"));

    // 2. The Reactor Stream
    if (url.pathname === "/feed") {
      const { stream, send } = ServerSentEventGenerator.stream();
      
      // Heartbeat Loop (The Reactor)
      const timer = setInterval(() => {
        // Option A: Update Data (Cheaper)
        send("datastar-merge-signals", { 
            signals: { time: new Date().toLocaleTimeString() } 
        });

        // Option B: Update UI (More Powerful)
        send("datastar-merge-fragments", {
            fragments: `<div id="status">Systems Nominal: ${Math.random()}</div>`
        });
      }, 100);

      // Cleanup
      req.signal.addEventListener("abort", () => clearInterval(timer));
      return stream;
    }
  }
});

```

**index.html**

```html
<!DOCTYPE html>
<html>
<head>
    <script type="module" src="https://cdn.jsdelivr.net/gh/starfederation/datastar/bundles/datastar.js"></script>
</head>
<body data-on-load="@get('/feed')">
    
    <div data-signals="{ time: 'Loading...' }">
        <h1>Reactor Time: <span data-text="$time"></span></h1>
    </div>

    <div id="status">Waiting for link...</div>

</body>
</html>

```

## 4. The "Gotchas" (Bestiary Candidates)

* **ID is King:** Every element you want to update via `MergeFragments` **MUST** have an `id`. No ID = No Update.
* **Global Signals:** Signals are global to the page. If you have two widgets using `$count`, they will sync. Namespace them (`$widget1_count`) if needed.
* **SSE Connection Limit:** Browsers have a limit on concurrent SSE connections (usually 6 per domain). Don't open a new stream for every component; use **One Stream to Rule Them All**.

---

