"use client";

import { useState } from "react";
import { QUESTIONS, scoreToLevel, LEVEL_NOTES } from "@/lib/level-test";
import { CEFR_LEVELS, type CefrLevel } from "@/lib/types";

interface Props {
  onDone: (level: CefrLevel) => void;
}

type Stage = "intro" | "quiz" | "result";

export default function LevelTest({ onDone }: Props) {
  const [stage, setStage] = useState<Stage>("intro");
  const [index, setIndex] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [result, setResult] = useState<CefrLevel>("B1");

  function pick(option: number) {
    if (picked !== null) return;
    setPicked(option);
    const isCorrect = option === QUESTIONS[index].answer;
    const total = correct + (isCorrect ? 1 : 0);
    setTimeout(() => {
      if (index + 1 < QUESTIONS.length) {
        setCorrect(total);
        setIndex(index + 1);
        setPicked(null);
      } else {
        setResult(scoreToLevel(total));
        setStage("result");
      }
    }, 350);
  }

  if (stage === "intro") {
    return (
      <section className="mx-auto w-full max-w-xl px-6 py-20 fade-up">
        <p className="font-mono text-xs tracking-[0.2em] text-ballpoint">
          PLACEMENT TEST
        </p>
        <h1 className="mt-4 font-display text-5xl leading-tight">
          First, let&rsquo;s find <span className="hl-swipe">your level</span>.
        </h1>
        <p className="mt-5 text-ink-soft leading-relaxed">
          Eight quick questions, about two minutes. Your CEFR level (A1–C2)
          decides which words the dictionary uses to explain things to you.
        </p>
        <button
          onClick={() => setStage("quiz")}
          className="mt-8 rounded-full bg-ballpoint px-7 py-3 font-medium text-white hover:opacity-90"
        >
          Start the test
        </button>
        <div className="mt-12 border-t border-rule pt-6">
          <p className="font-mono text-xs tracking-[0.2em] text-ink-soft">
            ALREADY KNOW YOUR LEVEL?
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {CEFR_LEVELS.map((lv) => (
              <button
                key={lv}
                onClick={() => onDone(lv)}
                className="rounded-full border border-rule bg-card px-4 py-1.5 font-mono text-sm hover:border-ballpoint hover:text-ballpoint"
              >
                {lv}
              </button>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (stage === "result") {
    return (
      <section className="mx-auto w-full max-w-xl px-6 py-20 fade-up">
        <p className="font-mono text-xs tracking-[0.2em] text-ballpoint">
          YOUR RESULT
        </p>
        <h1 className="mt-4 font-display text-7xl">
          <span className="hl-swipe">{result}</span>
        </h1>
        <p className="mt-5 text-ink-soft leading-relaxed">{LEVEL_NOTES[result]}</p>
        <p className="mt-2 text-ink-soft leading-relaxed">
          Every definition, example and synonym will now be written so a{" "}
          {result} reader can understand it. You can change this anytime.
        </p>
        <button
          onClick={() => onDone(result)}
          className="mt-8 rounded-full bg-ballpoint px-7 py-3 font-medium text-white hover:opacity-90"
        >
          Open the dictionary
        </button>
      </section>
    );
  }

  const q = QUESTIONS[index];
  return (
    <section className="mx-auto w-full max-w-xl px-6 py-20">
      <div className="flex items-center justify-between">
        <p className="font-mono text-xs tracking-[0.2em] text-ink-soft">
          QUESTION {index + 1} / {QUESTIONS.length}
        </p>
        <div
          className="h-1 w-32 overflow-hidden rounded-full bg-rule"
          role="progressbar"
          aria-valuenow={index + 1}
          aria-valuemin={1}
          aria-valuemax={QUESTIONS.length}
        >
          <div
            className="h-full bg-ballpoint transition-all"
            style={{ width: `${((index + 1) / QUESTIONS.length) * 100}%` }}
          />
        </div>
      </div>
      <h2 key={index} className="fade-up mt-8 font-display text-3xl leading-snug">
        {q.prompt}
      </h2>
      <div className="mt-8 grid gap-3">
        {q.options.map((option, i) => {
          const state =
            picked === null
              ? "border-rule bg-card hover:border-ballpoint"
              : i === picked
                ? i === q.answer
                  ? "border-ballpoint bg-ballpoint-wash"
                  : "border-rule bg-card opacity-50"
                : "border-rule bg-card opacity-50";
          return (
            <button
              key={option}
              onClick={() => pick(i)}
              disabled={picked !== null}
              className={`rounded-xl border px-5 py-3.5 text-left transition-colors ${state}`}
            >
              {option}
            </button>
          );
        })}
      </div>
    </section>
  );
}
