import { LocusLedger } from "../data/LocusLedger";
import { MarkdownMasker } from "./MarkdownMasker";
import { 
  REGEX_PIVOT, 
  REGEX_ENUMERATION, 
  REGEX_DIGRESSION, 
  REGEX_SENTENCE_BOUNDARY 
} from "./FractureLogic";
import { SEAMAN_CONSTANTS } from "../config/constants";

export interface BentoBox {
  locusId: string;
  content: string;
  tokenCount: number;
  isLeaf: boolean; // True if this box fits in the Seaman Constant
}

export class BentoBoxer {
  private ledger: LocusLedger;
  private masker: MarkdownMasker;

  constructor(ledger: LocusLedger) {
    this.ledger = ledger;
    this.masker = new MarkdownMasker();
  }

  /**
   * The public entry point.
   * Recursively processes text and returns a flat array of valid Bento Boxes.
   */
  public process(text: string): BentoBox[] {
    // 1. Reset Masker for new document
    this.masker.reset();

    // 2. Protect No-Fly Zones
    const cleanText = text.trim();
    if (!cleanText) return [];

    const maskedText = this.masker.mask(cleanText);

    // 3. Begin Recursive Boxing
    return this.internalProcess(maskedText);
  }

  private internalProcess(text: string): BentoBox[] {
    const tokenCount = this.countTokens(text);

    // BASE CASE: The text fits within the Seaman Constant.
    if (tokenCount <= SEAMAN_CONSTANTS.MAX_SIZE) {
      // Unmask BEFORE generation of hash/ID and final content
      // uniqueness relies on the ACTUAL content, not the masked content.
      const unmaskedContent = this.masker.unmask(text);
      
      const hash = LocusLedger.hashContent(unmaskedContent);
      const id = this.ledger.getOrMintId(hash);

      return [{
        locusId: id,
        content: unmaskedContent,
        tokenCount: tokenCount, // Count of tokens in the processing state (atomic boulders)
        isLeaf: true
      }];
    }

    // RECURSIVE STEP: The text is "Overweight".
    // We must find a fracture plane and split.
    const splitIndex = this.findFracturePlane(text);
    
    // Safety: If no split is found, force median split.
    const effectiveSplitIndex = splitIndex !== -1 ? splitIndex : Math.floor(text.length / 2);

    const [left, right] = this.splitText(text, effectiveSplitIndex);

    return [
      ...this.internalProcess(left),
      ...this.internalProcess(right)
    ];
  }

  /**
   * Identifies the optimal index to split the string.
   * Priority: Pivot > Enumeration > Digression > Sentence Boundary.
   * It searches near the middle of the text to ensure balanced trees.
   */
  private findFracturePlane(text: string): number {
    const midPoint = Math.floor(text.length / 2);
    const searchWindow = Math.floor(text.length * 0.25); // Look +/- 25% from center

    // Helper to find regex match closest to midPoint
    const findBestMatch = (regex: RegExp): number => {
      let bestIndex = -1;
      let minDistance = Infinity;
      
      // Reset regex state
      regex.lastIndex = 0;
      
      let match = regex.exec(text);
      while (match !== null) {
        const dist = Math.abs(match.index - midPoint);
        if (dist < minDistance && dist < searchWindow) {
          minDistance = dist;
          bestIndex = match.index;
        }
        match = regex.exec(text);
      }
      return bestIndex;
    };

    // 1. Priority A: Structural Pivot
    const pivotIdx = findBestMatch(REGEX_PIVOT);
    if (pivotIdx !== -1) return pivotIdx;

    // 2. Priority B: Enumeration
    const enumIdx = findBestMatch(REGEX_ENUMERATION);
    if (enumIdx !== -1) return enumIdx;

    // 3. Priority C: Digression
    const digressionIdx = findBestMatch(REGEX_DIGRESSION);
    if (digressionIdx !== -1) return digressionIdx;

    // 4. Fallback: Sentence Boundary
    // We just want the period closest to the middle
    const sentenceIdx = findBestMatch(REGEX_SENTENCE_BOUNDARY);
    return sentenceIdx !== -1 ? sentenceIdx + 1 : -1; // +1 to split AFTER the period
  }

  /**
   * Rudimentary token counter. 
   * For the purpose of "Seaman-sizing", whitespace splitting is a sufficient proxy.
   */
  private countTokens(text: string): number {
    return text.split(/\s+/).length;
  }

  private splitText(text: string, index: number): [string, string] {
    return [text.substring(0, index).trim(), text.substring(index).trim()];
  }
}
