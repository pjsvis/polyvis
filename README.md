# Polyvis: A Neuro-Symbolic Graph Visualizer

Polyvis is a lightweight, frontend-only web application for exploring and visualizing neuro-symbolic knowledge graphs. It renders conceptual relationships from a pre-built SQLite database, allowing users to navigate a "Neuro-Map" of interconnected ideas, principles, and directives.

The application is built with HTML, CSS, and [Alpine.js](https://alpinejs.dev/), and uses [Bun](https://bun.sh/) as its JavaScript runtime and toolkit. The graph visualization is powered by [viz.js](https://github.com/mdaines/viz.js) and [Sigma.js](https://www.sigmajs.org/), and the in-browser database is handled by [sql.js](https://sql.js.org/).

## Features

- **Interactive Graph Visualization:** Explore the knowledge graph by searching for terms.
- **Data-Driven Suggestions:** The search box provides a curated list of high-value terms guaranteed to produce rich, interesting graphs.
- **In-Browser Database:** The entire graph dataset is loaded into the browser via sql.js, requiring no active backend server for querying.
- **Alpine.js Reactivity:** Uses [Alpine.js](https://alpinejs.dev/) for a lightweight, reactive UI without a complex build step.
- **Zero-Build Frontend:** Built with vanilla web technologies and Alpine.js for maximum simplicity and performance.

## Prerequisites

- [Bun.js](https://bun.sh/docs/installation) (v1.0 or later)
- A local web server for development (e.g., `npm install -g live-server`)

## Getting Started

Follow these steps to set up and run the project locally.

### 1. Installation

There are no external dependencies to install for the application itself, as it relies on vanilla JavaScript and CDN-hosted libraries.

### 2. Build the Database

The core data for the application must be generated from the source JSON files located in the `/scripts` directory.

**A. Build the SQLite Database:**
This command reads the source JSON files and creates the `ctx.db` database file.

```bash
bun run scripts/build_db.ts
```

**B. Extract High-Value Search Terms:**
This command analyzes the newly created database and generates a `terms.json` file, which populates the search suggestions in the UI.

```bash
bun run scripts/extract_terms.ts
```

**C. Copy Database to Public Folder:**
The application loads the database from the `/public/data` directory. You must copy the generated file there.

```bash
cp scripts/ctx.db public/data/ctx.db
```

### 3. Run the Application

Since this is a frontend-only project, you can serve the files using any simple static web server.

1.  Navigate to the project root directory.
2.  Start your server, pointing it to the `public` directory as the root.

**Example using `live-server`:**

```bash
live-server public
```

Now, open your web browser and navigate to `http://127.0.0.1:8080/explorer/` to see the application.

## Project Structure

```
├── public/              # The application's web root
│   ├── explorer/        # The main graph explorer page
│   │   └── index.html
│   ├── data/            # Static data files for the frontend
│   │   └── ctx.db
│   └── terms.json       # Curated search terms for the UI
│
├── scripts/             # Build scripts for data processing
│   ├── build_db.ts      # Script to build the SQLite database
│   ├── extract_terms.ts # Script to generate the terms.json file
│   └── *.json           # Source data files
│
├── .gitignore           # Specifies files to be ignored by Git
├── LICENSE              # Project license (MIT)
└── README.md            # This file
```

## Contributing

Contributions are welcome. This project is licensed under the MIT License. Please feel free to open issues or submit pull requests.
