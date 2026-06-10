"use client";

import { useEffect, useRef, useState } from "react";

// Module-level cache so the same text is only synthesized once per session.
const audioCache = new Map<string, string>();

const FETCH_TIMEOUT_MS = 35_000;

interface Props {
  text: string;
  className?: string;
}

export default function SpeakButton({ text, className = "" }: Props) {
  const [state, setState] = useState<"idle" | "loading" | "playing" | "error">(
    "idle",
  );
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const errorTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      audioRef.current?.pause();
      if (errorTimer.current) clearTimeout(errorTimer.current);
    };
  }, []);

  function fail() {
    setState("error");
    if (errorTimer.current) clearTimeout(errorTimer.current);
    errorTimer.current = setTimeout(() => setState("idle"), 2500);
  }

  async function toggle() {
    if (state === "playing") {
      audioRef.current?.pause();
      setState("idle");
      return;
    }
    if (state === "loading") return;
    if (errorTimer.current) clearTimeout(errorTimer.current);

    let url = audioCache.get(text);
    if (!url) {
      setState("loading");
      try {
        const res = await fetch("/api/speak", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text }),
          signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
        });
        if (!res.ok) throw new Error();
        const blob = await res.blob();
        if (!blob.type.startsWith("audio/")) throw new Error();
        url = URL.createObjectURL(blob);
        audioCache.set(text, url);
      } catch {
        fail();
        return;
      }
    }

    // If this blob turns out to be unplayable, evict it so the next
    // click fetches fresh audio instead of replaying the bad cache entry.
    const playbackFailed = () => {
      audioCache.delete(text);
      if (url) URL.revokeObjectURL(url);
      fail();
    };

    const audio = new Audio(url);
    audioRef.current = audio;
    audio.onended = () => setState("idle");
    audio.onerror = playbackFailed;
    setState("playing");
    audio.play().catch(playbackFailed);
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={
        state === "playing"
          ? "Stop audio"
          : state === "error"
            ? "Audio failed — tap to retry"
            : `Listen to “${text}”`
      }
      title={state === "error" ? "Audio failed — tap to retry" : "Listen"}
      className={`inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full border transition-colors ${
        state === "playing"
          ? "border-ballpoint bg-ballpoint-wash text-ballpoint"
          : state === "error"
            ? "border-red-300 bg-red-50 text-red-600"
            : "border-rule bg-card text-ink-soft hover:border-ballpoint hover:text-ballpoint"
      } ${className}`}
    >
      {state === "loading" ? (
        <svg viewBox="0 0 16 16" className="h-3.5 w-3.5 animate-spin" aria-hidden>
          <circle
            cx="8"
            cy="8"
            r="6"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeDasharray="28"
            strokeDashoffset="20"
            strokeLinecap="round"
          />
        </svg>
      ) : state === "error" ? (
        <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" aria-hidden>
          <path
            d="M12 5v9M12 17.5v.5"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.4"
            strokeLinecap="round"
          />
        </svg>
      ) : (
        <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" aria-hidden>
          <path d="M11 5 6 9H3v6h3l5 4V5z" fill="currentColor" />
          <path
            d="M15.5 8.5a5 5 0 0 1 0 7M18.2 6a8.5 8.5 0 0 1 0 12"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
        </svg>
      )}
    </button>
  );
}
