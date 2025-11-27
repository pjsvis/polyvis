# Development Workflow Playbook

## Purpose
To document the standard procedures for developing, building, and maintaining the Polyvis application.

## 1. Development (Recommended)
The easiest way to work on the project is to use the unified development script. This starts both the CSS watcher and the local web server.

```bash
bun run dev
```
-   **Server:** http://localhost:3000
-   **CSS:** Auto-compiles on save.

> [!TIP]
> **Port 3000 Busy?**
> If the server fails to start because the port is in use, kill the existing process:
> `lsof -ti:3000 | xargs kill -9`

## 2. Manual Workflow (Advanced)
If you prefer to run processes separately:

### CSS Development
```bash
bun run watch:css
```

### Database Build
The core data for the application must be generated from the source JSON files located in the `/scripts` directory.

### A. Build the SQLite Database
This command reads the source JSON files and creates the `ctx.db` database file.
```bash
bun run scripts/build_db.ts
```

### B. Extract High-Value Search Terms
This command analyzes the newly created database and generates a `terms.json` file.
```bash
bun run scripts/extract_terms.ts
```

### C. Copy Database to Public Folder
The application loads the database from the `/public/data` directory. You must copy the generated file there.
```bash
cp scripts/ctx.db public/data/ctx.db
```

## 3. Python Utilities
Helper scripts located in `scripts/`.

### Generate Context Index
Scans the `context/` directory for markdown memory blocks and generates a JSON index.
```bash
python3 scripts/generate_context_index.py
```

## 4. Running the Application
Since this is a frontend-only project, you can serve the files using any simple static web server.

1.  Navigate to the project root directory.
2.  Start your server, pointing it to the `public` directory as the root.

**Example using `live-server`:**
```bash
live-server public
```
