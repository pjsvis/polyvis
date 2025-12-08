#!/usr/bin/env bun
import { Command } from "commander";
import chalk from "chalk";
import { initCommand } from "./commands/init.js";
import { installCommand } from "./commands/install.js";

import { syncCommand } from "./commands/sync.js";
import { serveCommand } from "./commands/serve.js";

const program = new Command();

program
  .name("resonance")
  .description("Operational Memory & Knowledge Package Manager")
  .version("1.1.0");

program
  .command("init")
  .description("Initialize .resonance environment and auto-discover playbooks")
  .option("-m, --magic", "Auto-install detected playbooks from Registry")
  .action(initCommand);

program
  .command("install [package]")
  .description("Install a playbook from the Registry")
  .option("-m, --magic", "Auto-install detected playbooks")
  .action(installCommand);

program
  .command("sync")
  .description("Ingest local artifacts into resonance.db")
  .action(syncCommand);

program
  .command("serve")
  .description("Start MCP Server (Stdio)")
  .action(serveCommand);

program.parse();
