"use client";

import LevelTest from "@/components/LevelTest";
import Dictionary from "@/components/Dictionary";
import { CEFR_LEVELS, type CefrLevel } from "@/lib/types";
import { useLocalStorage } from "@/lib/use-local-storage";

const LEVEL_KEY = "lexicon-level";

export default function Home() {
  const [stored, setStored] = useLocalStorage(LEVEL_KEY);
  const level =
    stored && (CEFR_LEVELS as readonly string[]).includes(stored)
      ? (stored as CefrLevel)
      : null;

  return level ? (
    <Dictionary
      level={level}
      onLevelChange={setStored}
      onRetakeTest={() => setStored(null)}
    />
  ) : (
    <LevelTest onDone={setStored} />
  );
}
