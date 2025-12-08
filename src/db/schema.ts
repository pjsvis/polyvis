import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";

export const nodes = sqliteTable("nodes", {
	id: text("id").primaryKey(),
	type: text("type").notNull(),
	
	// Content Fields
	title: text("title"), // Maps to 'label' in legacy
	content: text("content"), // Maps to 'definition' in legacy
	
	// Taxonomy
	domain: text("domain").default("knowledge"), // persona, system, knowledge
	layer: text("layer").default("experience"), // ontology, experience
	
	// Ordering & Meta
	orderIndex: integer("order_index").default(0),
	metadata: text("metadata"), // JSON string
	externalRefs: text("external_refs"), // JSON string (Legacy compatibility)
});

export const edges = sqliteTable("edges", {
	source: text("source").notNull(),
	target: text("target").notNull(),
	type: text("type").notNull(), // Renamed from 'relation'
    metadata: text("metadata")
	// Drizzle doesn't support Composite PK in SQLite definition easily without extra config, 
    // but we can trust the application logic or add a unique index later.
});
