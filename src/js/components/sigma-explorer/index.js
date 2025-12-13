import * as Data from "./data.js";
import * as Graph from "./graph.js";
import * as Interactions from "./interactions.js";
import * as Viz from "./viz.js";

export default function sigmaApp() {
	return {
		// Base State
		status: "Initializing...",
		error: null,
		loaded: false,
		debug: false,
		activeDomain: "persona",
		leftOpen: true,
		rightOpen: false,
		settings: null,

		// Imported State
		...Data.initialState(),
		...Graph.initialState(),
		...Viz.initialState(),
		...Interactions.initialState(),

		// Imported Methods
		...Data.methods,
		...Graph.methods,
		...Viz.methods,
		...Interactions.methods,

		async init() {
			// Load Settings
			try {
				const response = await fetch("/polyvis.settings.json");
				this.settings = await response.json();
				console.log("Settings Loaded:", this.settings);
			} catch (e) {
				console.error("Failed to load settings:", e);
			}

			// Load DB
			if (!this.$refs.sigmaContainer) {
				console.error("Sigma Container not found in Ref");
				return;
			}

			// Using sql.js via CDN Global `initSqlJs`
			try {
				// @ts-expect-error
				const SQL = await initSqlJs({
					locateFile: (file) =>
						`https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.8.0/${file}`,
				});

				const xhr = new XMLHttpRequest();
				xhr.open("GET", "/resonance.db", true);
				xhr.responseType = "arraybuffer";

				xhr.onload = (e) => {
					const uInt8Array = new Uint8Array(xhr.response);
					const db = new SQL.Database(uInt8Array);
					this.loadGraph(db);
					this.loaded = true;
				};

				xhr.send();
			} catch (e) {
				console.error("DB Load Error", e);
				this.status = "Failed to load Database.";
			}
		},
	};
}
