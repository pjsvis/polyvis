import { unlink } from "fs/promises";
import { ZombieDefense } from "./ZombieDefense";

export interface ServiceConfig {
    name: string;        // e.g. "Daemon"
    pidFile: string;     // e.g. ".daemon.pid"
    logFile: string;     // e.g. ".daemon.log"
    entryPoint: string;  // e.g. "src/resonance/daemon.ts"
}

export class ServiceLifecycle {
    constructor(private config: ServiceConfig) {}

    private async isRunning(pid: number): Promise<boolean> {
        try {
            process.kill(pid, 0);
            return true;
        } catch (_e) {
            return false;
        }
    }

    /**
     * Start the service in the background (detached).
     */
    async start() {
        // Enforce clean state first (kill duplicates)
        await ZombieDefense.assertClean(this.config.name, true);

        // Check if already running based on PID file
        if (await Bun.file(this.config.pidFile).exists()) {
            const pid = parseInt(await Bun.file(this.config.pidFile).text());
            if (await this.isRunning(pid)) {
                console.log(`⚠️  ${this.config.name} is already running (PID: ${pid})`);
                return;
            }
            console.log(`⚠️  Found stale PID file for ${this.config.name}. Clearing...`);
            await unlink(this.config.pidFile);
        }

        const logFile = Bun.file(this.config.logFile);
        await Bun.write(logFile, ""); // Truncate logs

        // Spawn subprocess
        const subprocess = Bun.spawn(["bun", "run", this.config.entryPoint, "serve"], {
            cwd: process.cwd(),
            detached: true,
            stdout: logFile,
            stderr: logFile,
        });

        await Bun.write(this.config.pidFile, subprocess.pid.toString());
        subprocess.unref();

        console.log(`✅ ${this.config.name} started in background (PID: ${subprocess.pid})`);
        console.log(`📝 Logs: ${this.config.logFile}`);
    }

    /**
     * Stop the service using the PID file.
     */
    async stop() {
        if (!await Bun.file(this.config.pidFile).exists()) {
            console.log(`ℹ️  ${this.config.name} is not running.`);
            return;
        }

        const pid = parseInt(await Bun.file(this.config.pidFile).text());
        
        if (await this.isRunning(pid)) {
            console.log(`🛑 Stopping ${this.config.name} (PID: ${pid})...`);
            process.kill(pid, "SIGTERM");
            
            let attempts = 0;
            // Wait up to 1 second
            while (await this.isRunning(pid) && attempts < 10) {
                await new Promise(r => setTimeout(r, 100));
                attempts++;
            }
            
            if (await this.isRunning(pid)) {
                 console.log("⚠️  Process did not exit gracefully. Force killing...");
                 process.kill(pid, "SIGKILL");
            }
            console.log(`✅ ${this.config.name} stopped.`);
        } else {
            console.log("⚠️  Stale PID file found. Cleaning up.");
        }

        await unlink(this.config.pidFile);
    }

    /**
     * Check status of the service.
     */
    async status() {
        if (await Bun.file(this.config.pidFile).exists()) {
            const pid = parseInt(await Bun.file(this.config.pidFile).text());
            if (await this.isRunning(pid)) {
                console.log(`🟢 ${this.config.name} is RUNNING (PID: ${pid})`);
                return;
            }
            console.log(`🔴 ${this.config.name} is NOT RUNNING (Stale PID: ${pid})`);
        } else {
            console.log(`⚪️ ${this.config.name} is STOPPED`);
        }
    }

    /**
     * Wrapper for the foreground 'serve' command logic.
     * Use this to wrap your actual server startup code.
     */
    async serve(serverLogic: () => Promise<void>) {
        // Enforce clean state (ensure we aren't running as a zombie of ourselves)
        await ZombieDefense.assertClean(`${this.config.name} (Serve)`);
        await serverLogic();
    }

    /**
     * Main CLI dispatch logic.
     */
    async run(command: string, serverLogic: () => Promise<void>) {
        switch (command) {
            case "start":
                await this.start();
                process.exit(0);
                break;
            case "stop":
                await this.stop();
                process.exit(0);
                break;
            case "status":
                await this.status();
                process.exit(0);
                break;
            case "restart":
                await this.stop();
                await new Promise(r => setTimeout(r, 500));
                await this.start();
                process.exit(0);
                break;
            case "serve":
                await this.serve(serverLogic);
                break;
            default:
                console.log(`Unknown command '${command}'. Use: start, stop, status, restart, or serve`);
                process.exit(1);
        }
    }
}
