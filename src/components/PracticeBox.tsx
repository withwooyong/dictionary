"use client";

import { useState } from "react";
import type { CefrLevel, PracticeResult } from "@/lib/types";
import SpeakButton from "./SpeakButton";

interface Props {
  word: string;
  level: CefrLevel;
}

const VERDICT_LABEL: Record<PracticeResult["verdict"], string> = {
  great: "Great sentence!",
  minor_issues: "Almost there",
  needs_work: "Let's fix it",
};

export default function PracticeBox({ word, level }: Props) {
  const [sentence, setSentence] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [result, setResult] = useState<PracticeResult | null>(null);

  async function check() {
    if (!sentence.trim() || status === "loading") return;
    setStatus("loading");
    setResult(null);
    try {
      const res = await fetch("/api/practice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ word, sentence, level }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setResult(data as PracticeResult);
      setStatus("done");
    } catch {
      setStatus("error");
    }
  }

  return (
    <section className="mt-10 rounded-2xl border border-rule bg-card p-6">
      <p className="font-mono text-xs tracking-[0.2em] text-ballpoint">
        PRACTICE — USE IT YOURSELF
      </p>
      <p className="mt-2 text-sm leading-relaxed text-ink-soft">
        Write your own sentence with{" "}
        <strong className="font-medium text-ink">{word}</strong> and the AI
        coach will check it.
      </p>
      <form
        className="mt-4 flex flex-col gap-3 sm:flex-row"
        onSubmit={(e) => {
          e.preventDefault();
          check();
        }}
      >
        <input
          value={sentence}
          onChange={(e) => setSentence(e.target.value)}
          maxLength={300}
          placeholder={`Write a sentence using “${word}”…`}
          className="w-full rounded-xl border border-rule bg-paper px-4 py-3 text-[15px] outline-none placeholder:text-ink-soft/50 focus:border-ballpoint"
          aria-label={`Your sentence using ${word}`}
        />
        <button
          type="submit"
          disabled={status === "loading" || !sentence.trim()}
          className="shrink-0 rounded-xl bg-ballpoint px-5 py-3 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-40"
        >
          {status === "loading" ? "Checking…" : "Check my sentence"}
        </button>
      </form>

      {status === "error" && (
        <p className="mt-3 text-sm text-ink-soft">
          The coach couldn&rsquo;t check your sentence. Try again in a moment.
        </p>
      )}

      {status === "done" && result && (
        <div className="fade-up mt-4 rounded-xl bg-paper p-4">
          <p
            className={`font-mono text-xs tracking-[0.15em] ${
              result.verdict === "great" ? "text-green-700" : "text-ballpoint"
            }`}
          >
            {VERDICT_LABEL[result.verdict].toUpperCase()}
          </p>
          <p className="mt-2 text-[15px] leading-relaxed">{result.feedback}</p>
          {result.improved && (
            <div className="mt-3 flex items-start gap-2 border-t border-rule pt-3">
              <SpeakButton text={result.improved} className="mt-0.5" />
              <p className="font-display text-lg italic leading-relaxed">
                {result.improved}
              </p>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
