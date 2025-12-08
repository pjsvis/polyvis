export interface RegistryPackage {
	path: string;
	signatures: string[];
	description: string;
}

export interface RegistryManifest {
	packages: Record<string, RegistryPackage>;
}

export interface LockfilePackage {
	version: string;
	hash: string;
	installed_at: string;
}

export interface Lockfile {
	packages: Record<string, LockfilePackage>;
}
