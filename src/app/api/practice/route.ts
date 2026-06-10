import { NextResponse } from "next/server";
import OpenAI from "openai";
import { CEFR_LEVELS } from "@/lib/types";

export const maxDuration = 60;

const MODEL = process.env.OPENAI_MODEL ?? "gpt-4o-mini";

const RESPONSE_SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    verdict: {
      type: "string",
      enum: ["great", "minor_issues", "needs_work"],
    },
    feedback: {
      type: "string",
      description:
        "2-3 encouraging English sentences at the reader's level: what works, what to fix and why.",
    },
    improved: {
      type: "string",
      description:
        "A corrected or more natural version of the learner's sentence. Empty string if the original is already great.",
    },
  },
  required: ["verdict", "feedback", "improved"],
} as const;

export async function POST(request: Request) {
  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json({ error: "OPENAI_API_KEY is not set." }, { status: 500 });
  }

  const { word, sentence, level } = await request.json().catch(() => ({}));
  if (
    typeof word !== "string" ||
    !word.trim() ||
    typeof sentence !== "string" ||
    !sentence.trim() ||
    sentence.length > 300
  ) {
    return NextResponse.json(
      { error: "Send the word and your sentence (up to 300 characters)." },
      { status: 400 },
    );
  }
  const cefr = CEFR_LEVELS.includes(level) ? level : "B1";

  const client = new OpenAI();
  try {
    const completion = await client.chat.completions.create({
      model: MODEL,
      messages: [
        {
          role: "system",
          content: `You are a friendly English writing coach for a CEFR ${cefr} learner. The learner is practising the word "${word.trim()}" by writing their own sentence with it.

Judge the sentence:
- "great" — natural, grammatical, and the word is used correctly.
- "minor_issues" — the word is used correctly but grammar, word order or naturalness could improve.
- "needs_work" — the word is misused, or the sentence has errors that block understanding.

Write the feedback in English only, using vocabulary a ${cefr} reader understands. Be specific and encouraging. If the sentence doesn't contain the target word at all, point that out and set verdict to needs_work.`,
        },
        { role: "user", content: sentence.trim() },
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "practice_feedback",
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
    return NextResponse.json({ error: `Feedback failed: ${message}` }, { status: 502 });
  }
}
