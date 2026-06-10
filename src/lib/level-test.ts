import type { CefrLevel } from "./types";

export interface Question {
  prompt: string;
  options: string[];
  answer: number;
}

// Ordered roughly from A1 to C2. The score maps to a CEFR level below.
export const QUESTIONS: Question[] = [
  {
    prompt: "I ___ from Korea.",
    options: ["am", "is", "are", "be"],
    answer: 0,
  },
  {
    prompt: "She ___ TV when I called her.",
    options: ["watches", "was watching", "is watching", "watch"],
    answer: 1,
  },
  {
    prompt: "I didn't pass the exam, so I have to ___ it next month.",
    options: ["repair", "remind", "retake", "replace"],
    answer: 2,
  },
  {
    prompt: "If I ___ rich, I would travel the world.",
    options: ["am", "will be", "be", "were"],
    answer: 3,
  },
  {
    prompt: "The medicine had no ___ on her at all.",
    options: ["effect", "affect", "effort", "afford"],
    answer: 0,
  },
  {
    prompt: "He ___ have missed the train — he left the house very late.",
    options: ["can't", "must", "shouldn't", "mustn't"],
    answer: 1,
  },
  {
    prompt: "Which is closest in meaning to “ubiquitous”?",
    options: ["very rare", "extremely large", "found everywhere", "very old"],
    answer: 2,
  },
  {
    prompt: "Her ___ remarks offended everyone at the meeting.",
    options: ["cautious", "causal", "casual", "caustic"],
    answer: 3,
  },
];

export function scoreToLevel(correct: number): CefrLevel {
  if (correct <= 1) return "A1";
  if (correct <= 3) return "A2";
  if (correct <= 5) return "B1";
  if (correct === 6) return "B2";
  if (correct === 7) return "C1";
  return "C2";
}

export const LEVEL_NOTES: Record<CefrLevel, string> = {
  A1: "Beginner — you understand everyday words and very simple sentences.",
  A2: "Elementary — you handle short, common phrases about daily life.",
  B1: "Intermediate — you follow clear texts on familiar topics.",
  B2: "Upper intermediate — you read most everyday texts comfortably.",
  C1: "Advanced — you understand long, demanding texts and implicit meaning.",
  C2: "Proficient — you understand virtually everything you read.",
};

export const TRY_WORDS: Record<CefrLevel, string[]> = {
  A1: ["breakfast", "rain", "happy"],
  A2: ["journey", "borrow", "noisy"],
  B1: ["achieve", "reliable", "curious"],
  B2: ["reluctant", "thrive", "subtle"],
  C1: ["meticulous", "ambiguous", "resilient"],
  C2: ["ephemeral", "ubiquitous", "serendipity"],
};
