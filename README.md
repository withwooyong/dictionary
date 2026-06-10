# LexiLevel — a level-aware English dictionary

LexiLevel is a small, dependency-free web app that explains English words
**in English only**, tuned to your CEFR level (A1–C2). It is built for English
learners and runs entirely in the browser using the **Google Gemini API** with
your own API key.

## What it does

1. **Finds your level.** A few simple vocabulary questions estimate your CEFR
   level (A1, A2, B1, B2, C1, C2).
2. **Explains at your level.** Definitions are written in plain English using
   words at or below your level — never harder than the word being explained.
3. **Collins-style definitions.** Each sense is a full sentence that shows the
   word in use, in the style of the Collins COBUILD dictionary
   (e.g. *“If you are curious, you want to know or learn about something.”*).
4. **Longman-style synonyms.** Synonyms come with short notes on how their
   meaning or use differs, like a Longman thesaurus box.
5. **Pictures the word.** An illustration is generated with
   `gemini-3.1-flash-image` to help you picture the meaning.
6. **English only.** No translations into any other language.

## Running it

No build step and no server are required — it is plain HTML, CSS and JS.

```bash
# from the project folder, any static server works, e.g.:
python3 -m http.server 8000
# then open http://localhost:8000
```

You can also just open `index.html` directly in a browser.

## API key

The app asks for a **Google Gemini API key** on first launch. Get a free key at
<https://aistudio.google.com/apikey>.

- The key is stored only in your browser's `localStorage`.
- Requests go directly from your browser to Google's
  `generativelanguage.googleapis.com` endpoint — there is no backend.

Use the ⚙️ button to change your key or retake the level test.

## Models

| Purpose      | Model                    |
| ------------ | ------------------------ |
| Definitions  | `gemini-2.5-flash`       |
| Word images  | `gemini-3.1-flash-image` |

Both are set at the top of `app.js` and can be changed there.

## Files

- `index.html` — markup and screens (setup → quiz → dictionary)
- `styles.css` — styling
- `app.js` — quiz logic and Gemini API calls
