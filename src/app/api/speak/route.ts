import { NextResponse } from "next/server";
import OpenAI from "openai";

export const maxDuration = 60;

export async function POST(request: Request) {
  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json({ error: "OPENAI_API_KEY is not set." }, { status: 500 });
  }

  const { text } = await request.json().catch(() => ({}));
  if (typeof text !== "string" || !text.trim() || text.length > 500) {
    return NextResponse.json({ error: "Missing text to speak." }, { status: 400 });
  }

  const client = new OpenAI();
  const input = text.trim();

  async function synthesize(model: string) {
    const speech = await client.audio.speech.create({
      model,
      voice: process.env.OPENAI_TTS_VOICE ?? "alloy",
      input,
      response_format: "mp3",
    });
    return Buffer.from(await speech.arrayBuffer());
  }

  try {
    let audio: Buffer;
    try {
      audio = await synthesize(process.env.OPENAI_TTS_MODEL ?? "gpt-4o-mini-tts");
    } catch {
      audio = await synthesize("tts-1");
    }
    return new NextResponse(new Uint8Array(audio), {
      headers: {
        "Content-Type": "audio/mpeg",
        "Cache-Control": "private, max-age=86400",
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: `Speech failed: ${message}` }, { status: 502 });
  }
}
