# Bento Box Playbook 2

### **Playbook: Markdown to Bento Box Transformation (Bun Edition)**

**ID:** `PB-M2B-002`
**Version:** 2.0 (Bun Edition)
**Objective:** To programmatically transform a semantically structured Markdown document into a responsive, visually organized Bento Box layout using the Bun runtime, TypeScript, and its high-performance APIs.

---

****1.0 Core Principles****

*   **Separation of Concerns:** The content (Markdown) must remain decoupled from the presentation (CSS). The Bun script will act as the bridge between them.
*   **Configuration-Driven Layout:** The grid layout is not to be hardcoded. It must be defined by metadata (YAML front matter) within the source Markdown file.
*   **Semantic Mapping:** The script will map Markdown heading sections (`## H2`) to individual Bento Boxes (`<div class="bento-box">`).

---

****2.0 Required Toolchain & Dependencies****

*   **Bun:** The all-in-one JavaScript runtime and toolkit.
*   **Bun Packages:**
    *   `marked`: For parsing the core Markdown content into HTML.
    *   `gray-matter`: For parsing the YAML front matter from the Markdown file.
*   **Note:** The `fs-extra` dependency is no longer required, as we will use Bun's native, high-performance file I/O APIs (`Bun.file()` and `Bun.write()`).

---

****3.0 Artifacts****

*   **Input Artifact:**
    *   `source.md`: A Markdown file containing YAML front matter to define the `grid-template-areas` and a structure based on `H2` headings for content sections.
*   **Output Artifacts:**
    *   `dist/index.html`: The final, rendered HTML page.
    *   `dist/style.css`: The corresponding CSS file for styling.
    *   `dist/` (directory): The output directory for all generated files.

---

****4.0 Agent Workflow: The Happy Path****

**Phase 1: Setup & Initialization**

1.  **Verify Environment:** Ensure Bun is installed.
2.  **Create Project Directory:** Establish a new directory for the project.
3.  **Initialize Bun Project:** Run `bun init -y`. This will create `package.json`, `tsconfig.json`, etc.
4.  **Install Dependencies:** Run `bun install marked gray-matter`.
5.  **Create Source File:** Create a file named `source.md` with the following content. This is your input artifact.

    ```markdown
    ---
    title: "Project Phoenix: Weekly Dashboard"
    grid-template-areas:
      - "key-metrics key-metrics performance-chart"
      - "recent-activity tasks tasks"
    ---
    
    ## Key Metrics
    - **Active Users:** 1,450 (+5%)
    - **Revenue:** $12,800 (+8%)
    - **System Uptime:** 99.98%
    
    ## Performance Chart
    A placeholder for a chart.
    
    ## Recent Activity
    A new module for data ingestion was deployed successfully. User feedback has been positive, with three minor bugs reported and triaged.
    
    ## Pending Tasks
    1.  Resolve Bug #582 (UI Glitch)
    2.  Prepare Q3 planning presentation
    3.  Onboard new team member
    ```


**Phase 2: Script Execution (`build.ts`) - V2.1 AST-Aware**

1.  **Create/Update Build Script:** Open `build.ts`.
2.  **Import Dependencies:** (No change)
    ```typescript
    import { marked } from 'marked';
    import matter from 'gray-matter';
    ```
3.  **Write the Build Logic:** Replace the previous script with this new version.

    ```typescript
    // build.ts (AST-Aware)
    
    console.log("Starting Bento Box build process (AST-Aware)...");
    
    // 1. Prepare Output Directory
    const outputDir = 'dist';
    await Bun.$`rm -rf ${outputDir}`;
    await Bun.$`mkdir ${outputDir}`;
    
    // 2. Read and Parse Source File
    const sourceFile = Bun.file('source.md');
    const markdownWithMeta = await sourceFile.text();
    const { data: frontMatter, content: markdownContent } = matter(markdownWithMeta);
    
    // 3. NEW: Parse Markdown into an AST (token stream)
    const tokens = marked.lexer(markdownContent);
    
    // 4. NEW: Group tokens into Bento Box sections based on H2 headings
    interface BentoSection {
        title: string;
        id: string;
        tokens: marked.Token[];
    }
    const bentoSections: BentoSection[] = [];
    let currentSection: BentoSection | null = null;
    
    for (const token of tokens) {
        if (token.type === 'heading' && token.depth === 2) {
            // If we find a new H2, push the previous section and start a new one.
            if (currentSection) {
                bentoSections.push(currentSection);
            }
            const title = token.text;
            currentSection = {
                title: title,
                id: title.toLowerCase().replace(/\s+/g, '-'),
                tokens: [] // Do not include the H2 token itself in the box content
            };
        } else if (currentSection) {
            // If we are inside a section, add the token to its content.
            currentSection.tokens.push(token);
        }
    }
    // Push the last remaining section
    if (currentSection) {
        bentoSections.push(currentSection);
    }
    
    // 5. Generate HTML for each Bento Box from its grouped tokens
    let bentoBoxesHtml = '';
    bentoSections.forEach(section => {
        // Use marked.parser to render HTML from the token list.
        // This preserves all sub-headings (H3, H4) and other structures.
        const sectionContentHtml = marked.parser(section.tokens);
    
        bentoBoxesHtml += `
            <div id="${section.id}" class="bento-box">
                <h2>${section.title}</h2>
                ${sectionContentHtml}
            </div>
        `;
    });
    
    // 6. Generate CSS (style.css) - Logic is now cleaner
    const css = `
        /* ... (CSS content from Section 5.0) ... */
        .bento-grid {
            display: grid;
            grid-template-areas: 
                "${frontMatter['grid-template-areas'][0]}"
                "${frontMatter['grid-template-areas'][1]}";
            /* ... (rest of CSS) ... */
        }
        
        /* Dynamically generate grid-area assignments */
        ${bentoSections.map(section => `#${section.id} { grid-area: ${section.id}; }`).join('\n')}
    `;
    await Bun.write(`${outputDir}/style.css`, css);
    
    // 7. Assemble Final HTML (index.html)
    const finalHtml = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${frontMatter.title}</title>
        <link rel="stylesheet" href="style.css">
    </head>
    <body>
        <main>
            <h1>${frontMatter.title}</h1>
            <div class="bento-grid">
                ${bentoBoxesHtml}
            </div>
        </main>
    </body>
    </html>
    `;
    await Bun.write(`${outputDir}/index.html`, finalHtml);
    
    console.log('Bento Box site generated successfully in /dist');
    ```

### **Summary of Improvements**

1.  **Robustness:** This script no longer relies on a brittle string-splitting method. It correctly understands the document's structure.
2.  **Hierarchy Preservation:** Any `H3`, `H4`, blockquotes, code blocks, or nested lists that appear under an `H2` will now be correctly parsed and rendered *inside* their parent Bento Box, maintaining the intended document hierarchy.
3.  **Correctness:** By using `marked.lexer()` to create an AST and `marked.parser()` to render from the token list, we are using the `marked` library as intended for complex structural manipulations.

This revised approach is fundamentally more sound and aligns with best practices for programmatic document transformation. We should consider this the new standard for this playbook.

**Phase 3: Execution**

1.  **Run the Script:** Execute the build script from the terminal: `bun run build.ts`.

---

****5.0 CSS Styling Guide (`style.css`)****

This is the full CSS content to be generated by the script. It remains unchanged from the previous version.

```css
:root {
    --background: #f8f9fa;
    --text-color: #212529;
    --box-background: #ffffff;
    --border-color: #e9ecef;
    --shadow-color: rgba(0, 0, 0, 0.05);
}

body {
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    background-color: var(--background);
    color: var(--text-color);
    margin: 0;
    padding: 2rem;
}

main {
    max-width: 1200px;
    margin: 0 auto;
}

h1 {
    font-size: 2.5rem;
    margin-bottom: 2rem;
}

.bento-grid {
    display: grid;
    gap: 1rem;
}

.bento-box {
    background-color: var(--box-background);
    border-radius: 16px;
    padding: 1.5rem;
    border: 1px solid var(--border-color);
    box-shadow: 0 4px 12px var(--shadow-color);
    transition: transform 0.2s ease-in-out;
}

.bento-box:hover {
    transform: translateY(-4px);
}

.bento-box h2 {
    margin-top: 0;
    font-size: 1.25rem;
    border-bottom: 1px solid var(--border-color);
    padding-bottom: 0.75rem;
    margin-bottom: 1rem;
}

/* Responsive stacking for smaller screens */
@media (max-width: 768px) {
    .bento-grid {
        grid-template-areas: none !important;
        grid-template-columns: 1fr;
    }
}
```

---


****6. The Accessibility (A11y) Hard-Stop Protocol****

Before outputting code, you **MUST** verify these 4 points:

1. **Semantic Containers:** Are you using \<section\> or \<article\> instead of \<div\> for the card wrapper?  
2. **Heading Hierarchy:** Do the card titles use \<h3\> (assuming the page title is \<h1\> and section titles are \<h2\>)?  
3. **Non-Text Content:** Does every Chart/Icon have role="img" and a descriptive aria-label?  
   * *Bad:* \<div class="chart"\>...\</div\>  
   * *Good:* \<div role="img" aria-label="Bar chart showing sales increase"\>...\</div\>  
4. **Color Contrast:**  
   * Do not use text-gray-500 on dark backgrounds (too low contrast). Use text-slate-400 or lighter.  
   * Do not use bg-indigo-500 with white text unless you verify contrast. Prefer bg-indigo-600 for better legibility.  
   * **Focus States:** Ensure interactive elements have focus:ring or focus:outline.

---   

****7.0 Verification Protocol****

Upon successful execution of `bun run build.ts`, the agent must verify the following conditions to confirm task completion:
1.  The `dist` directory exists.
2.  The file `dist/index.html` exists and is not empty.
3.  The file `dist/style.css` exists and is not empty.
4.  Opening `dist/index.html` in a web browser renders a titled page with a grid of styled boxes containing the content from `source.md`.

***