import { readFileSync } from "fs";

interface PersonaObject {
  id: string;
  title: string;
  description: string;
  type: string;
  category: string;
  tags: string[];
  source: string;
}

class CtxPersona {
  private directives: PersonaObject[] = [];
  private lexicon: PersonaObject[] = [];

  constructor() {
    this.loadCoreDirectives();
    this.loadConceptualLexicon();
  }

  private loadCoreDirectives() {
    try {
      const directivesFile = readFileSync("core-directives.json", "utf-8");
      this.directives = JSON.parse(directivesFile);
      console.log("Successfully loaded and parsed core-directives.json");
    } catch (error) {
      console.error("Error loading core directives:", error);
    }
  }

  private loadConceptualLexicon() {
    try {
      const lexiconFile = readFileSync("conceptual-lexicon.json", "utf-8");
      this.lexicon = JSON.parse(lexiconFile);
      console.log("Successfully loaded and parsed conceptual-lexicon.json");
    } catch (error) {
      console.error("Error loading conceptual lexicon:", error);
    }
  }

  public getDirective(id: string): PersonaObject | undefined {
    return this.directives.find((d) => d.id === id);
  }

  public getTerm(id: string): PersonaObject | undefined {
    return this.lexicon.find((t) => t.id === id);
  }

  public findByTitle(searchTerm: string): PersonaObject[] {
    const lowercasedTerm = searchTerm.toLowerCase();
    const results = [
      ...this.directives.filter((d) =>
        d.title.toLowerCase().includes(lowercasedTerm)
      ),
      ...this.lexicon.filter((t) =>
        t.title.toLowerCase().includes(lowercasedTerm)
      ),
    ];
    return results;
  }

  public logSummary() {
    console.log("--- CTX Persona Summary ---");
    console.log(`- Core Directives: ${this.directives.length}`);
    console.log(`- Conceptual Lexicon Terms: ${this.lexicon.length}`);
    console.log("--------------------------");
  }
}

const persona = new CtxPersona();
persona.logSummary();
