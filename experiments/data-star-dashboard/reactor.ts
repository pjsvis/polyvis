
// POLYVIS REACTOR CORE
// Uses raw SSE (Server-Sent Events) to drive Datastar

console.log(`[REACTOR] Booting up...`);

// LIFECYCLE: Write PID
const PID_FILE = ".reactor.pid";
await Bun.write(PID_FILE, process.pid.toString());

const server = Bun.serve({
  port: 3050,
  async fetch(req) {
    const url = new URL(req.url);

    // 1. Serve the UI Shell
    if (url.pathname === "/") {
        return new Response(Bun.file(import.meta.dir + "/index.html"));
    }

    // 1.5 Serve Datastar Bundle
    if (url.pathname === "/datastar.js") {
        return new Response(Bun.file(import.meta.dir + "/datastar.bundle.js"), {
            headers: { "Content-Type": "application/javascript" }
        });
    }

    // 2. The Reactor Stream (SSE)
    if (url.pathname === "/feed") {
        console.log(`[REACTOR] Client connected: ${req.headers.get("user-agent")}`);
        
        let timer: Timer;

        const stream = new ReadableStream({
            start(controller) {
                // Helper to send events
                const send = (event: string, dataLines: Record<string, string>) => {
                    let dataBlock = "";
                    for (const [key, value] of Object.entries(dataLines)) {
                        dataBlock += `data: ${key} ${value}\n`;
                    }
                    const payload = `event: ${event}\n${dataBlock}\n`;
                    // console.log(`[REACTOR] Sending ${event}:`, JSON.stringify(dataLines).substring(0, 50) + "...");
                    controller.enqueue(new TextEncoder().encode(payload));
                };

                // SIMULATION LOOP (10Hz)
                timer = setInterval(() => {
                    const rpm = Math.floor(2000 + Math.random() * 3000); 
                    const temp = (40 + Math.random() * 60).toFixed(1);   
                    const height = Math.min(100, Math.max(0, (parseFloat(temp) - 20) * 1.2)); 
                    
                    let status = "NOMINAL";

                    if (parseFloat(temp) > 80) status = "WARNING";
                    if (parseFloat(temp) > 95) status = "CRITICAL";

                    const signalJSON = JSON.stringify({
                        ingest_rpm: rpm,
                        cpu_temp: temp,
                        core_status: status,
                        rod_height: `${height}%`
                    });

                    send("datastar-merge-signals", {
                        signals: signalJSON,
                        onlyIfMissing: "false"
                    });

                }, 100); 
            },
            cancel() {
                 console.log("[REACTOR] Client disconnected.");
                 clearInterval(timer);
            }
        });

        return new Response(stream, {
            headers: {
                "Content-Type": "text/event-stream",
                "Cache-Control": "no-cache",
                "Connection": "keep-alive",
            }
        });
    }

    return new Response("Not Found", { status: 404 });
  },
});

console.log(`[REACTOR] Online at http://localhost:${server.port}`);
