"use client";

import { useEffect, useRef, useState } from "react";

// Module-level cache so the same text is only synthesized once per session.
const audioCache = new Map<string, string>();

interface Props {
  text: string;
  className?: string;
}

export default function SpeakButton({ text, className = "" }: Props) {
  const [state, setState] = useState<"idle" | "loading" | "playing">("idle");
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    return () => audioRef.current?.pause();
  }, []);

  async function toggle() {
    if (state === "playing") {
      audioRef.current?.pause();
      setState("idle");
      return;
    }
    if (state === "loading") return;

    let url = audioCache.get(text);
    if (!url) {
      setState("loading");
      try {
        const res = await fetch("/api/speak", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text }),
        });
        if (!res.ok) throw new Error();
        url = URL.createObjectURL(await res.blob());
        audioCache.set(text, url);
      } catch {
        setState("idle");
        return;
      }
    }

    const audio = new Audio(url);
    audioRef.current = audio;
    audio.onended = () => setState("idle");
    audio.onerror = () => setState("idle");
    setState("playing");
    audio.play().catch(() => setState("idle"));
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={state === "playing" ? "Stop audio" : `Listen to “${text}”`}
      title="Listen"
      className={`inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-rule bg-card text-ink-soft transition-colors hover:border-ballpoint hover:text-ballpoint ${
        state === "playing" ? "border-ballpoint bg-ballpoint-wash text-ballpoint" : ""
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
