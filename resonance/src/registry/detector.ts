import { type RegistryManifest } from "./types.js";
import { existsSync } from "fs";
import path from "path";

// Mock Remote Registry for now (Simulating remote fetch)
// In real networking, this would fetch from raw.githubusercontent.com/...
export const MOCK_REGISTRY: RegistryManifest = {
	packages: {
		"css-zero-magic": {
			path: "playbooks/css-master-playbook.md", // Mapping to our master playbook
			signatures: ["tailwind.config.js", "tailwind.config.ts"],
			description: "Master CSS Playbook: Zero Magic, Tokens, Architecture.",
		},
		"bun-native": {
			path: "playbooks/bun-playbook.md",
			signatures: ["bun.lockb", "bun.lock"],
			description: "Bun runtime workflows and best practices.",
		},
		"biome-std": {
			path: "playbooks/biome-playbook.md",
			signatures: ["biome.json"],
			description: "Biome linting and formatting standards.",
		},
	},
};

export async function detectPackages(
	root: string,
	manifest: RegistryManifest = MOCK_REGISTRY,
): Promise<string[]> {
	const detected: string[] = [];

	console.log(`🔍 Scanning ${root} for signatures...`);

	for (const [pkgName, pkgData] of Object.entries(manifest.packages)) {
		// potential improvements: recursive glob search
		// current implementation: root level check only
		for (const sig of pkgData.signatures) {
			const sigPath = path.join(root, sig);
			if (existsSync(sigPath)) {
				console.log(`   ✅ Found ${pkgName} (Signature: ${sig})`);
				detected.push(pkgName);
				break; // Match once per package
			}
		}
	}

	return detected;
}
