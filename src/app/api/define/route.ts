import { NextResponse } from "next/server";
import OpenAI from "openai";
import { CEFR_LEVELS } from "@/lib/types";

export const maxDuration = 60;

const MODEL = process.env.OPENAI_MODEL ?? "gpt-4o-mini";

const RESPONSE_SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    isWord: {
      type: "boolean",
      description: "False if the input is not a real English word or phrase.",
    },
    suggestion: {
      type: ["string", "null"],
      description:
        "If the input looks like a misspelling, the likely intended word. Otherwise null.",
    },
    headword: { type: "string" },
    pronunciation: {
      type: "string",
      description: "IPA transcription without surrounding slashes.",
    },
    wordLevel: {
      type: "string",
      enum: [...CEFR_LEVELS],
      description: "CEFR level of the headword itself.",
    },
    entries: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          partOfSpeech: { type: "string" },
          senses: {
            type: "array",
            items: {
              type: "object",
              additionalProperties: false,
              properties: {
                definition: { type: "string" },
                examples: { type: "array", items: { type: "string" } },
              },
              required: ["definition", "examples"],
            },
          },
        },
        required: ["partOfSpeech", "senses"],
      },
    },
    synonyms: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          word: { type: "string" },
          level: { type: "string", enum: [...CEFR_LEVELS] },
          difference: { type: "string" },
        },
        required: ["word", "level", "difference"],
      },
    },
    imagePrompt: {
      type: "string",
      description:
        "One concrete, drawable scene that visually explains the primary sense.",
    },
  },
  required: [
    "isWord",
    "suggestion",
    "headword",
    "pronunciation",
    "wordLevel",
    "entries",
    "synonyms",
    "imagePrompt",
  ],
} as const;

function systemPrompt(level: string) {
  return `You are an expert lexicographer for English learners. You combine two styles: Collins COBUILD for definitions and the Longman Language Activator for synonyms.

The reader's CEFR level is ${level}. Everything you write must be understandable at that level: prefer vocabulary at or below ${level}, and if a harder word is unavoidable, add a short plain-English gloss in brackets right after it.

Rules:
- Write in English only. Never use Korean or any other language.
- Definitions are full COBUILD-style sentences that show the word in use, e.g. "If something is ephemeral, it lasts for only a very short time." or "A harbour is an area of water next to the land where boats can stay safely."
- Give 1–3 senses per part of speech, the most common sense first. Each sense gets exactly 2 natural example sentences, level-appropriate.
- Synonyms follow the Longman Activator approach: for each one, write one short sentence explaining how it differs from the headword (formality, strength, or typical context). Include each synonym's own CEFR level. Give 3–6 synonyms; if the word has no useful synonyms, give fewer or none.
- wordLevel is the CEFR level of the headword itself, not the reader's level.
- imagePrompt describes one concrete, drawable scene that visually explains the word's primary sense. No text, letters, or abstract symbols in the scene.
- If the input is not a real English word or common phrase, set isWord to false and leave the other fields minimal. If it looks like a typo, put the likely intended word in suggestion.`;
}

export async function POST(request: Request) {
  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json(
      { error: "OPENAI_API_KEY is not set. Add it to .env.local and restart." },
      { status: 500 },
    );
  }

  const { word, level } = await request.json().catch(() => ({}));
  if (typeof word !== "string" || !word.trim() || word.length > 60) {
    return NextResponse.json({ error: "Please send a word to look up." }, { status: 400 });
  }
  const cefr = CEFR_LEVELS.includes(level) ? level : "B1";

  const client = new OpenAI();
  try {
    const completion = await client.chat.completions.create({
      model: MODEL,
      messages: [
        { role: "system", content: systemPrompt(cefr) },
        { role: "user", content: `Look up: "${word.trim()}"` },
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "dictionary_entry",
          strict: true,
          schema: RESPONSE_SCHEMA,
        },
      },
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) throw new Error("Empty response from the model.");
    return NextResponse.json(JSON.parse(content));
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json(
      { error: `The dictionary couldn't be reached: ${message}` },
      { status: 502 },
    );
  }
}
