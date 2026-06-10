export const CEFR_LEVELS = ["A1", "A2", "B1", "B2", "C1", "C2"] as const;

export type CefrLevel = (typeof CEFR_LEVELS)[number];

export interface ExampleSentence {
  en: string;
  ko: string;
}

export interface Sense {
  definition: string;
  definitionKo: string;
  examples: ExampleSentence[];
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

export interface Collocation {
  phrase: string;
  example: string;
  exampleKo: string;
}

export interface DefineResult {
  isWord: boolean;
  suggestion: string | null;
  headword: string;
  pronunciation: string;
  koreanGloss: string;
  wordLevel: CefrLevel;
  entries: Entry[];
  synonyms: Synonym[];
  collocations: Collocation[];
  imagePrompt: string;
}

export interface PracticeResult {
  verdict: "great" | "minor_issues" | "needs_work";
  feedback: string;
  improved: string;
}
