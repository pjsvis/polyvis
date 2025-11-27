/**
 * LexiconService
 * The "Brain" of the operation.
 * Encapsulates sql.js loading, DB fetching, and query execution.
 * * Dependencies: sql.js (loaded via <script> tag in index.html)
 */

window.LexiconService = {
    db: null,
    config: {
        wasmUrl: 'https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.8.0/sql-wasm.wasm', 
        dbUrl: '/ctx.db'
    },

    /**
     * 1. INITIALIZATION
     * Fetches the WASM binary and the Database file in parallel.
     * Mounts the DB into memory.
     */
    async init() {
        console.log('[LexiconService] Initializing...');

        try {
            // Check if SQL.js is loaded
            if (typeof initSqlJs === 'undefined') {
                throw new Error("sql.js library not found. Ensure script tag is present.");
            }

            // A. Load the Engine (WASM)
            const SQLPromise = initSqlJs({
                locateFile: file => this.config.wasmUrl
            });

            // B. Load the Data (The .db file)
            const dataPromise = fetch(this.config.dbUrl).then(res => res.arrayBuffer());

            // Wait for both
            const [SQL, buf] = await Promise.all([SQLPromise, dataPromise]);

            // C. Mount the DB
            this.db = new SQL.Database(new Uint8Array(buf));
            console.log('[LexiconService] Database mounted successfully.');
            
            return true;

        } catch (err) {
            console.error('[LexiconService] Init Failed:', err);
            return false; // Signal failure to UI
        }
    },

    /**
     * 2. QUERY INTERFACE
     * Executes a clean search query.
     * @param {string} query - The search term (e.g., "mentation")
     * @returns {Array} - Array of objects [{term, definition, category, ...}]
     */
    search(query) {
        if (!this.db) {
            console.warn('[LexiconService] DB not ready.');
            return [];
        }

        // Handle "Empty Query" -> Return all (or limit to top 20 for speed)
        let sql = "SELECT * FROM terms ORDER BY name ASC";
        let params = [];

        // Handle "Specific Query"
        if (query && query.trim().length > 0) {
            sql = "SELECT * FROM terms WHERE name LIKE $term OR definition LIKE $term ORDER BY name ASC";
            params = { $term: `%${query}%` };
        }

        // Execute
        // sql.js returns: [{ columns: ['col1', 'col2'], values: [['val1', 'val2']] }]
        const raw = this.db.exec(sql, params);

        // Transform to Objects (Alpine-friendly)
        return this._transformResults(raw);
    },

    /**
     * 3. INTERNAL UTILITY
     * Converts sql.js 'columns/values' format into clean JSON objects.
     */
    _transformResults(rawResult) {
        if (!rawResult || rawResult.length === 0) return [];

        const columns = rawResult[0].columns;
        const values = rawResult[0].values;

        return values.map(row => {
            let obj = {};
            columns.forEach((col, index) => {
                obj[col] = row[index];
            });
            return obj;
        });
    }
};