export const CEFR_LEVELS = ["A1", "A2", "B1", "B2", "C1", "C2"] as const;

export type CefrLevel = (typeof CEFR_LEVELS)[number];

export interface Sense {
  definition: string;
  examples: string[];
}

export interface Entry {
  partOfSpeech: string;
  senses: Sense[];
}

export interface Synonym {
  word: string;
  level: CefrLevel;
  difference: string;
}

export interface DefineResult {
  isWord: boolean;
  suggestion: string | null;
  headword: string;
  pronunciation: string;
  wordLevel: CefrLevel;
  entries: Entry[];
  synonyms: Synonym[];
  imagePrompt: string;
}
