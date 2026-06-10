import { NextResponse } from "next/server";
import OpenAI from "openai";

export const maxDuration = 120;

const STYLE =
  "A warm, friendly coloured-pencil illustration for a learner's dictionary. " +
  "Simple composition, soft daylight, plain background. " +
  "Absolutely no text, letters, numbers or symbols anywhere in the image. Scene: ";

export async function POST(request: Request) {
  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json({ error: "OPENAI_API_KEY is not set." }, { status: 500 });
  }

  const { prompt } = await request.json().catch(() => ({}));
  if (typeof prompt !== "string" || !prompt.trim() || prompt.length > 1000) {
    return NextResponse.json({ error: "Missing image prompt." }, { status: 400 });
  }

  const client = new OpenAI();
  const fullPrompt = STYLE + prompt.trim();

  // gpt-image-1 is cheaper and better, but requires a verified organisation;
  // fall back to dall-e-3 when it is unavailable.
  try {
    const result = await client.images.generate({
      model: process.env.OPENAI_IMAGE_MODEL ?? "gpt-image-1",
      prompt: fullPrompt,
      size: "1024x1024",
      quality: "low",
    });
    const b64 = result.data?.[0]?.b64_json;
    if (!b64) throw new Error("No image data returned.");
    return NextResponse.json({ image: `data:image/png;base64,${b64}` });
  } catch {
    try {
      const result = await client.images.generate({
        model: "dall-e-3",
        prompt: fullPrompt,
        size: "1024x1024",
        response_format: "b64_json",
      });
      const b64 = result.data?.[0]?.b64_json;
      if (!b64) throw new Error("No image data returned.");
      return NextResponse.json({ image: `data:image/png;base64,${b64}` });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      return NextResponse.json(
        { error: `Illustration failed: ${message}` },
        { status: 502 },
      );
    }
  }
}
