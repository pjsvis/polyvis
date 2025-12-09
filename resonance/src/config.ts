import { z } from "zod";
import { join } from "path";
import { readFileSync, writeFileSync, existsSync } from "fs";

export const ResonanceConfigSchema = z.object({
    project_name: z.string().default("resonance-project"),
    version: z.string().default("0.1.0"),
    sources: z.object({
        playbooks: z.string().default("./playbooks"),
        debriefs: z.string().default("./debriefs"),
        docs: z.string().default("./docs"),
    }),
    registry: z.string().url().optional(),
});

export type ResonanceConfig = z.infer<typeof ResonanceConfigSchema>;

export function loadConfig(): ResonanceConfig {
    const configPath = join(process.cwd(), "resonance.settings.json");
    if (!existsSync(configPath)) {
        return ResonanceConfigSchema.parse({});
    }
    try {
        const data = JSON.parse(readFileSync(configPath, "utf-8"));
        return ResonanceConfigSchema.parse(data);
    } catch (e) {
        console.error("❌ Invalid configuration file:", e);
        return ResonanceConfigSchema.parse({});
    }
}
