# Learner's Lexicon

An English-only dictionary for learners. A short placement test finds your CEFR level (A1–C2), and from then on every word is explained using vocabulary you can actually understand:

- **Collins COBUILD-style definitions** — full sentences that show the word in use ("If something is *ephemeral*, it lasts for only a very short time.")
- **Longman Activator-style synonyms** — each synonym comes with its own CEFR level and a note on how it differs from the headword
- **An illustration for every word** — generated with the OpenAI image API, drawn like a dictionary plate

## Setup

```bash
cp .env.local.example .env.local   # then put your OpenAI API key in it
npm install
npm run dev
```

Open http://localhost:3000.

## Configuration (`.env.local`)

| Variable | Default | Notes |
| --- | --- | --- |
| `OPENAI_API_KEY` | — | Required. |
| `OPENAI_MODEL` | `gpt-4o-mini` | Model used for dictionary entries. |
| `OPENAI_IMAGE_MODEL` | `gpt-image-2` | Falls back to `gpt-image-1-mini` automatically if unavailable. |

## How it works

- `src/components/LevelTest.tsx` — 8-question placement test; the score maps to a CEFR level stored in `localStorage`. You can also pick a level manually or retake the test anytime.
- `src/app/api/define/route.ts` — asks OpenAI for a structured entry (strict JSON schema): senses, examples, synonyms, the word's own CEFR level, and an image prompt — all written at the reader's level, English only.
- `src/app/api/illustrate/route.ts` — turns that image prompt into a coloured-pencil illustration.
- `src/components/Dictionary.tsx` — search, entry layout, clickable synonyms, recent lookups.
