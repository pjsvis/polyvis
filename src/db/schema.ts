import { blob, primaryKey, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const nodes = sqliteTable("nodes", {
	id: text("id").primaryKey(),
	type: text("type").notNull(),

	// Content Fields
	title: text("title"),
	content: text("content"),

	// Taxonomy
	domain: text("domain").default("knowledge"),
	layer: text("layer").default("experience"),

	// Vector Search (FAFCAS)
	embedding: blob("embedding", { mode: "buffer" }),

	// Integrity
	hash: text("hash"),

	// Metadata (JSON)
	meta: text("meta"),
});

export const edges = sqliteTable(
	"edges",
	{
		source: text("source").notNull(),
		target: text("target").notNull(),
		type: text("type").notNull(),
	},
	(t) => ({
		pk: primaryKey({ columns: [t.source, t.target, t.type] }),
	}),
);
