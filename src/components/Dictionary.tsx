"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { CEFR_LEVELS, type CefrLevel, type DefineResult } from "@/lib/types";
import { TRY_WORDS } from "@/lib/level-test";
import { useLocalStorage } from "@/lib/use-local-storage";
import SpeakButton from "./SpeakButton";
import PracticeBox from "./PracticeBox";

interface Props {
  level: CefrLevel;
  onLevelChange: (level: CefrLevel) => void;
  onRetakeTest: () => void;
}

type Status = "idle" | "loading" | "done" | "error";

const RECENT_KEY = "lexicon-recent";
const KO_KEY = "lexicon-ko";

const FEATURES = [
  {
    title: "Defined at your level",
    body: "Full-sentence definitions written with vocabulary you already know — no dictionary loops.",
  },
  {
    title: "Synonyms, compared",
    body: "Every synonym comes with its level and a note on when to choose it over the headword.",
  },
  {
    title: "Listen and practise",
    body: "Hear every word and sentence spoken aloud, then write your own and get coached.",
  },
];

export default function Dictionary({ level, onLevelChange, onRetakeTest }: Props) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState("");
  const [result, setResult] = useState<DefineResult | null>(null);
  const [image, setImage] = useState<string | null>(null);
  const [imageStatus, setImageStatus] = useState<Status>("idle");
  const [recentRaw, setRecentRaw] = useLocalStorage(RECENT_KEY);
  const [koRaw, setKoRaw] = useLocalStorage(KO_KEY);
  const inputRef = useRef<HTMLInputElement>(null);
  const lookupId = useRef(0);

  const showKo = koRaw !== "off";

  const recent = useMemo<string[]>(() => {
    try {
      const parsed = JSON.parse(recentRaw ?? "[]");
      return Array.isArray(parsed)
        ? parsed.filter((w): w is string => typeof w === "string")
        : [];
    } catch {
      return [];
    }
  }, [recentRaw]);

  const lookUp = useCallback(
    async (word: string) => {
      const trimmed = word.trim();
      if (!trimmed) return;
      const id = ++lookupId.current;
      setQuery(trimmed);
      setStatus("loading");
      setResult(null);
      setImage(null);
      setImageStatus("idle");
      setError("");

      try {
        const res = await fetch("/api/define", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ word: trimmed, level }),
        });
        const data = await res.json();
        if (id !== lookupId.current) return;
        if (!res.ok) throw new Error(data.error ?? "Lookup failed.");

        setResult(data as DefineResult);
        setStatus("done");

        if (data.isWord) {
          const next = [
            data.headword,
            ...recent.filter((w) => w !== data.headword),
          ].slice(0, 8);
          setRecentRaw(JSON.stringify(next));

          setImageStatus("loading");
          fetch("/api/illustrate", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ prompt: data.imagePrompt }),
          })
            .then(async (imgRes) => {
              const imgData = await imgRes.json();
              if (id !== lookupId.current) return;
              if (!imgRes.ok) throw new Error(imgData.error);
              setImage(imgData.image);
              setImageStatus("done");
            })
            .catch(() => {
              if (id === lookupId.current) setImageStatus("error");
            });
        }
      } catch (err) {
        if (id !== lookupId.current) return;
        setError(err instanceof Error ? err.message : "Something went wrong.");
        setStatus("error");
      }
    },
    [level, recent, setRecentRaw],
  );

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-10 border-b border-rule bg-paper/90 backdrop-blur">
        <div className="mx-auto flex w-full max-w-5xl items-center justify-between gap-4 px-6 py-3.5">
          <p className="font-display text-2xl italic">
            Learner&rsquo;s Lexicon<span className="text-ballpoint">.</span>
          </p>
          <div className="flex items-center gap-4">
            <button
              type="button"
              role="switch"
              aria-checked={showKo}
              onClick={() => setKoRaw(showKo ? "off" : "on")}
              className="flex items-center gap-2"
              title="Show Korean translations"
            >
              <span className="whitespace-nowrap font-mono text-xs tracking-[0.15em] text-ink-soft">
                한국어
              </span>
              <span
                className={`relative h-5 w-9 rounded-full transition-colors ${
                  showKo ? "bg-ballpoint" : "bg-rule"
                }`}
              >
                <span
                  className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${
                    showKo ? "translate-x-4.5" : "translate-x-0.5"
                  }`}
                />
              </span>
            </button>
            <label className="hidden font-mono text-xs tracking-[0.15em] text-ink-soft sm:block">
              LEVEL
              <select
                value={level}
                onChange={(e) => onLevelChange(e.target.value as CefrLevel)}
                className="ml-2 rounded-full border border-rule bg-card px-3 py-1 font-mono text-sm text-ink"
              >
                {CEFR_LEVELS.map((lv) => (
                  <option key={lv}>{lv}</option>
                ))}
              </select>
            </label>
            <button
              onClick={onRetakeTest}
              className="hidden font-mono text-xs tracking-[0.15em] text-ink-soft underline-offset-4 hover:text-ballpoint hover:underline sm:block"
            >
              RETAKE TEST
            </button>
            <select
              value={level}
              onChange={(e) => onLevelChange(e.target.value as CefrLevel)}
              aria-label="CEFR level"
              className="rounded-full border border-rule bg-card px-3 py-1 font-mono text-sm text-ink sm:hidden"
            >
              {CEFR_LEVELS.map((lv) => (
                <option key={lv}>{lv}</option>
              ))}
            </select>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-5xl flex-1 px-6 pb-24">
        <form
          className="mt-12"
          onSubmit={(e) => {
            e.preventDefault();
            lookUp(query);
          }}
        >
          <div className="flex items-center gap-3 border-b-2 border-ink pb-3 transition-colors focus-within:border-ballpoint">
            <input
              ref={inputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Type a word…"
              autoFocus
              spellCheck={false}
              className="w-full bg-transparent font-display text-4xl outline-none placeholder:text-ink-soft/40"
              aria-label="Word to look up"
            />
            <button
              type="submit"
              disabled={status === "loading"}
              className="shrink-0 rounded-full bg-ballpoint px-6 py-2.5 font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-40"
            >
              {status === "loading" ? "Looking up…" : "Look up"}
            </button>
          </div>
        </form>

        {status === "idle" && (
          <div className="mt-10 fade-up">
            <p className="font-mono text-xs tracking-[0.2em] text-ink-soft">
              {recent.length > 0 ? "RECENT" : `WORDS TO TRY AT ${level}`}
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {(recent.length > 0 ? recent : TRY_WORDS[level]).map((w) => (
                <button
                  key={w}
                  onClick={() => lookUp(w)}
                  className="rounded-full border border-rule bg-card px-4 py-1.5 text-sm transition-colors hover:border-ballpoint hover:text-ballpoint"
                >
                  {w}
                </button>
              ))}
            </div>
            <div className="mt-16 grid gap-4 sm:grid-cols-3">
              {FEATURES.map((f, i) => (
                <div key={f.title} className="rounded-2xl border border-rule bg-card p-6">
                  <p className="font-mono text-xs text-ballpoint">{`0${i + 1}`}</p>
                  <p className="mt-3 font-display text-xl">{f.title}</p>
                  <p className="mt-2 text-sm leading-relaxed text-ink-soft">{f.body}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {status === "loading" && (
          <div className="mt-12 space-y-4" aria-label="Loading entry">
            <div className="shimmer h-14 w-64 rounded" />
            <div className="shimmer h-4 w-40 rounded" />
            <div className="shimmer h-4 w-full max-w-xl rounded" />
            <div className="shimmer h-4 w-full max-w-lg rounded" />
          </div>
        )}

        {status === "error" && (
          <div className="mt-12 rounded-2xl border border-rule bg-card p-6 fade-up">
            <p className="font-medium">The lookup didn&rsquo;t work.</p>
            <p className="mt-1 text-sm text-ink-soft">{error}</p>
          </div>
        )}

        {status === "done" && result && !result.isWord && (
          <div className="mt-12 fade-up">
            <p className="font-display text-3xl">
              &ldquo;{query}&rdquo; isn&rsquo;t in the dictionary.
            </p>
            {result.suggestion && (
              <p className="mt-3 text-ink-soft">
                Did you mean{" "}
                <button
                  onClick={() => lookUp(result.suggestion!)}
                  className="font-medium text-ballpoint underline underline-offset-4"
                >
                  {result.suggestion}
                </button>
                ?
              </p>
            )}
          </div>
        )}

        {status === "done" && result && result.isWord && (
          <article className="mt-10 rounded-3xl border border-rule bg-card p-6 shadow-[0_2px_16px_rgba(28,27,26,0.05)] fade-up sm:p-10">
            <div className="grid gap-10 lg:grid-cols-[1fr_300px]">
              <div>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                  <h1 className="hl-swipe font-display text-6xl leading-none">
                    {result.headword}
                  </h1>
                  <SpeakButton text={result.headword} className="h-9 w-9" />
                  <span className="font-mono text-lg text-ink-soft">
                    /{result.pronunciation}/
                  </span>
                  <span
                    className="rounded-full bg-ballpoint-wash px-2.5 py-0.5 font-mono text-xs text-ballpoint"
                    title="CEFR level of this word"
                  >
                    {result.wordLevel}
                  </span>
                </div>
                {showKo && result.koreanGloss && (
                  <p className="mt-3 text-lg text-ink-soft">{result.koreanGloss}</p>
                )}

                {result.entries.map((entry, ei) => (
                  <section key={ei} className="mt-8">
                    <p className="font-display text-xl italic text-ink-soft">
                      {entry.partOfSpeech}
                    </p>
                    <ol className="mt-3 space-y-7">
                      {entry.senses.map((sense, si) => (
                        <li key={si} className="grid grid-cols-[2rem_1fr] gap-1">
                          <span className="font-mono text-sm font-medium text-ballpoint">
                            {si + 1}
                          </span>
                          <div>
                            <p className="leading-relaxed">{sense.definition}</p>
                            {showKo && (
                              <p className="mt-1 text-sm leading-relaxed text-ink-soft">
                                {sense.definitionKo}
                              </p>
                            )}
                            <ul className="mt-3 space-y-3 border-l-2 border-rule pl-4">
                              {sense.examples.map((ex) => (
                                <li key={ex.en} className="flex items-start gap-2.5">
                                  <SpeakButton text={ex.en} className="mt-1" />
                                  <div>
                                    <p className="font-display text-lg italic leading-relaxed text-ink">
                                      {ex.en}
                                    </p>
                                    {showKo && (
                                      <p className="text-sm leading-relaxed text-ink-soft">
                                        {ex.ko}
                                      </p>
                                    )}
                                  </div>
                                </li>
                              ))}
                            </ul>
                          </div>
                        </li>
                      ))}
                    </ol>
                  </section>
                ))}

                {result.synonyms.length > 0 && (
                  <section className="mt-10 rounded-2xl border border-rule bg-paper p-6">
                    <p className="font-mono text-xs tracking-[0.2em] text-ballpoint">
                      SYNONYMS — CHOOSE THE RIGHT WORD
                    </p>
                    <ul className="mt-4 space-y-4">
                      {result.synonyms.map((syn) => (
                        <li key={syn.word}>
                          <div className="flex items-baseline gap-2">
                            <button
                              onClick={() => lookUp(syn.word)}
                              className="font-display text-xl text-ballpoint underline-offset-4 hover:underline"
                            >
                              {syn.word}
                            </button>
                            <span className="font-mono text-xs text-ink-soft">
                              {syn.level}
                            </span>
                            <SpeakButton text={syn.word} className="h-6 w-6" />
                          </div>
                          <p className="mt-0.5 text-sm leading-relaxed text-ink-soft">
                            {syn.difference}
                          </p>
                        </li>
                      ))}
                    </ul>
                  </section>
                )}

                <PracticeBox key={result.headword} word={result.headword} level={level} />
              </div>

              <aside className="space-y-6">
                <figure className="overflow-hidden rounded-2xl border border-rule bg-paper">
                  {imageStatus === "done" && image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={image}
                      alt={`Illustration of ${result.headword}`}
                      className="aspect-square w-full object-cover"
                    />
                  ) : imageStatus === "error" ? (
                    <div className="flex aspect-square items-center justify-center p-6 text-center text-sm text-ink-soft">
                      The illustration couldn&rsquo;t be drawn this time.
                    </div>
                  ) : (
                    <div
                      className="shimmer aspect-square w-full"
                      aria-label="Drawing the illustration"
                    />
                  )}
                  <figcaption className="border-t border-rule px-4 py-2.5 font-mono text-xs text-ink-soft">
                    fig. — {result.headword}
                  </figcaption>
                </figure>

                {result.collocations.length > 0 && (
                  <section className="rounded-2xl border border-rule bg-paper p-5">
                    <p className="font-mono text-xs tracking-[0.2em] text-ballpoint">
                      COMMON PHRASES
                    </p>
                    <ul className="mt-3 space-y-4">
                      {result.collocations.map((col) => (
                        <li key={col.phrase}>
                          <div className="flex items-center gap-2">
                            <p className="font-medium">{col.phrase}</p>
                            <SpeakButton text={col.example} className="h-6 w-6" />
                          </div>
                          <p className="mt-1 font-display text-[15px] italic leading-relaxed text-ink-soft">
                            {col.example}
                          </p>
                          {showKo && (
                            <p className="text-[13px] leading-relaxed text-ink-soft/80">
                              {col.exampleKo}
                            </p>
                          )}
                        </li>
                      ))}
                    </ul>
                  </section>
                )}
              </aside>
            </div>
          </article>
        )}
      </main>

      <footer className="border-t border-rule">
        <div className="mx-auto flex w-full max-w-5xl flex-wrap items-center justify-between gap-2 px-6 py-5">
          <p className="font-mono text-xs text-ink-soft">
            LEARNER&rsquo;S LEXICON — definitions written at your level
          </p>
          <p className="font-mono text-xs text-ink-soft/70">Powered by OpenAI</p>
        </div>
      </footer>
    </div>
  );
}
