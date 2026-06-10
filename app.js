/* ============================================================
   LexiLevel — a level-aware English dictionary
   Powered by the Google Gemini API (user-supplied key).
   ============================================================ */

const TEXT_MODEL = "gemini-2.5-flash";
const IMAGE_MODEL = "gemini-3.1-flash-image";
const API_BASE = "https://generativelanguage.googleapis.com/v1beta/models";

const STORE = {
  key: "lexilevel.apiKey",
  level: "lexilevel.level",
};

/* ---------- CEFR levels ---------- */
const LEVELS = ["A1", "A2", "B1", "B2", "C1", "C2"];
const LEVEL_GUIDE = {
  A1: "an absolute beginner. Use only the most common ~500 everyday words. Very short, simple sentences.",
  A2: "an elementary learner. Use common everyday vocabulary and simple sentences.",
  B1: "an intermediate learner. Use everyday vocabulary; you may use slightly longer sentences.",
  B2: "an upper-intermediate learner. You may use a wider vocabulary and more natural phrasing.",
  C1: "an advanced learner. You may use rich vocabulary and nuanced explanations.",
  C2: "a near-native learner. You may use sophisticated, precise vocabulary.",
};

/* ---------- A short, increasing-difficulty vocabulary check ----------
   One representative item per CEFR band, easiest first. The number of
   correct answers maps directly to a level. */
const QUIZ = [
  {
    word: "happy",
    options: ["feeling good and pleased", "very tired", "made of metal", "very far away"],
    answer: 0,
  },
  {
    word: "borrow",
    options: ["to throw something hard", "to take and use something you will give back", "to cook slowly", "to speak loudly"],
    answer: 1,
  },
  {
    word: "reliable",
    options: ["able to be trusted", "very colourful", "happening once a year", "extremely heavy"],
    answer: 0,
  },
  {
    word: "reluctant",
    options: ["moving very fast", "unwilling and hesitant to do something", "shiny and new", "easy to understand"],
    answer: 1,
  },
  {
    word: "meticulous",
    options: ["showing great care about small details", "lasting a short time", "related to the sea", "loud and sudden"],
    answer: 0,
  },
  {
    word: "ubiquitous",
    options: ["rarely seen", "found everywhere at the same time", "deeply unfair", "pleasantly warm"],
    answer: 1,
  },
];

/* ---------- DOM ---------- */
const $ = (id) => document.getElementById(id);
const els = {
  setupScreen: $("setupScreen"),
  quizScreen: $("quizScreen"),
  dictScreen: $("dictScreen"),
  apiKeyInput: $("apiKeyInput"),
  saveKeyBtn: $("saveKeyBtn"),
  setupError: $("setupError"),
  quizProgress: $("quizProgress"),
  quizQuestion: $("quizQuestion"),
  quizOptions: $("quizOptions"),
  levelBadge: $("levelBadge"),
  settingsBtn: $("settingsBtn"),
  wordInput: $("wordInput"),
  lookupBtn: $("lookupBtn"),
  status: $("status"),
  result: $("result"),
  resWord: $("resWord"),
  resMeta: $("resMeta"),
  resLevel: $("resLevel"),
  resDefs: $("resDefs"),
  resSyns: $("resSyns"),
  imageBox: $("imageBox"),
  imageCaption: $("imageCaption"),
};

const state = {
  apiKey: localStorage.getItem(STORE.key) || "",
  level: localStorage.getItem(STORE.level) || "",
  quizIndex: 0,
  quizScore: 0,
};

/* ============================================================
   Navigation
   ============================================================ */
function showScreen(name) {
  els.setupScreen.classList.toggle("hidden", name !== "setup");
  els.quizScreen.classList.toggle("hidden", name !== "quiz");
  els.dictScreen.classList.toggle("hidden", name !== "dict");
}

function renderLevelBadge() {
  if (state.level) {
    els.levelBadge.textContent = `Your level: ${state.level}`;
    els.levelBadge.classList.remove("hidden");
  } else {
    els.levelBadge.classList.add("hidden");
  }
}

function boot() {
  renderLevelBadge();
  if (!state.apiKey) {
    showScreen("setup");
  } else if (!state.level) {
    startQuiz();
  } else {
    showScreen("dict");
    els.wordInput.focus();
  }
}

/* ============================================================
   Setup — API key
   ============================================================ */
els.saveKeyBtn.addEventListener("click", () => {
  const key = els.apiKeyInput.value.trim();
  els.setupError.classList.add("hidden");
  if (!key) {
    els.setupError.textContent = "Please paste your Gemini API key.";
    els.setupError.classList.remove("hidden");
    return;
  }
  state.apiKey = key;
  localStorage.setItem(STORE.key, key);
  if (!state.level) startQuiz();
  else { showScreen("dict"); els.wordInput.focus(); }
});

els.apiKeyInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") els.saveKeyBtn.click();
});

/* ============================================================
   Level assessment quiz
   ============================================================ */
function startQuiz() {
  state.quizIndex = 0;
  state.quizScore = 0;
  showScreen("quiz");
  renderQuizQuestion();
}

function renderQuizQuestion() {
  const q = QUIZ[state.quizIndex];
  els.quizProgress.textContent = `Question ${state.quizIndex + 1} of ${QUIZ.length}`;
  els.quizQuestion.innerHTML = `What does <span class="qword">“${q.word}”</span> mean?`;
  els.quizOptions.innerHTML = "";
  q.options.forEach((opt, i) => {
    const btn = document.createElement("button");
    btn.className = "quiz-option";
    btn.textContent = opt;
    btn.addEventListener("click", () => answerQuiz(i));
    els.quizOptions.appendChild(btn);
  });
}

function answerQuiz(choice) {
  if (choice === QUIZ[state.quizIndex].answer) state.quizScore++;
  state.quizIndex++;
  if (state.quizIndex < QUIZ.length) {
    renderQuizQuestion();
  } else {
    finishQuiz();
  }
}

function finishQuiz() {
  // score 0..6  ->  level index, clamped to the available bands
  const idx = Math.min(Math.max(state.quizScore - 1, 0), LEVELS.length - 1);
  state.level = LEVELS[idx];
  localStorage.setItem(STORE.level, state.level);
  renderLevelBadge();
  showScreen("dict");
  els.wordInput.focus();
}

/* ============================================================
   Settings — reset
   ============================================================ */
els.settingsBtn.addEventListener("click", () => {
  const choice = prompt(
    "Settings:\n" +
    "  1 — Retake the level test\n" +
    "  2 — Change API key\n" +
    "Type 1 or 2 (or cancel):"
  );
  if (choice === "1") {
    startQuiz();
  } else if (choice === "2") {
    els.apiKeyInput.value = state.apiKey;
    showScreen("setup");
  }
});

/* ============================================================
   Gemini calls
   ============================================================ */
async function geminiJson(prompt, schema) {
  const url = `${API_BASE}/${TEXT_MODEL}:generateContent?key=${encodeURIComponent(state.apiKey)}`;
  const body = {
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: {
      temperature: 0.4,
      responseMimeType: "application/json",
      responseSchema: schema,
    },
  };
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`Text model error (${res.status}). ${trimErr(detail)}`);
  }
  const data = await res.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error("The model returned an empty response.");
  return JSON.parse(text);
}

async function geminiImage(prompt) {
  const url = `${API_BASE}/${IMAGE_MODEL}:generateContent?key=${encodeURIComponent(state.apiKey)}`;
  const body = {
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: { responseModalities: ["IMAGE"] },
  };
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`Image model error (${res.status}). ${trimErr(detail)}`);
  }
  const data = await res.json();
  const parts = data?.candidates?.[0]?.content?.parts || [];
  const img = parts.find((p) => p.inlineData?.data);
  if (!img) throw new Error("No image was returned.");
  const mime = img.inlineData.mimeType || "image/png";
  return `data:${mime};base64,${img.inlineData.data}`;
}

function trimErr(detail) {
  try {
    const j = JSON.parse(detail);
    return j?.error?.message || "";
  } catch {
    return (detail || "").slice(0, 160);
  }
}

/* ---------- Schema for the dictionary entry ---------- */
const ENTRY_SCHEMA = {
  type: "object",
  properties: {
    word: { type: "string" },
    pronunciation: { type: "string", description: "IPA, e.g. /ˈkjʊə.ri.əs/" },
    wordLevel: { type: "string", description: "CEFR level of this word: A1-C2" },
    senses: {
      type: "array",
      items: {
        type: "object",
        properties: {
          partOfSpeech: { type: "string" },
          definition: {
            type: "string",
            description: "A full-sentence, Collins COBUILD-style definition written in plain English.",
          },
          example: { type: "string" },
        },
        required: ["partOfSpeech", "definition", "example"],
      },
    },
    synonyms: {
      type: "array",
      items: {
        type: "object",
        properties: {
          word: { type: "string" },
          note: { type: "string", description: "A short note on how its meaning or use differs." },
        },
        required: ["word", "note"],
      },
    },
    imagePrompt: {
      type: "string",
      description: "A vivid, concrete scene that visually illustrates the word's core meaning.",
    },
  },
  required: ["word", "pronunciation", "wordLevel", "senses", "synonyms", "imagePrompt"],
};

function buildPrompt(word) {
  const guide = LEVEL_GUIDE[state.level] || LEVEL_GUIDE.B1;
  return `You are an English-only dictionary for English learners.
The user's CEFR level is ${state.level} — that is, ${guide}

Explain the word "${word}".

Rules:
- Write EVERYTHING in English only. Never use any other language.
- Write the definitions in PLAIN English using vocabulary at or below the user's level (${state.level}). Do not use a word that is harder than the word being defined.
- Use the Collins COBUILD style: each definition is a FULL SENTENCE that shows how the word is used (e.g. "If you are curious, you want to know or learn about something.").
- Give 1 to 3 of the most useful senses, each with one natural example sentence.
- Like the Longman thesaurus, list 3 to 6 synonyms, each with a short note on the difference in meaning or use. If the word has no real synonyms, return an empty list.
- Give the IPA pronunciation and the CEFR level of the word itself.
- imagePrompt: describe one clear, concrete scene that illustrates the word's main meaning.`;
}

/* ============================================================
   Lookup flow
   ============================================================ */
async function lookup() {
  const word = els.wordInput.value.trim();
  if (!word) return;
  if (!state.apiKey) { showScreen("setup"); return; }

  setBusy(true);
  setStatus(`<span class="spinner"></span>Looking up “${escapeHtml(word)}” for level ${state.level}…`);
  els.result.classList.add("hidden");

  let entry;
  try {
    entry = await geminiJson(buildPrompt(word), ENTRY_SCHEMA);
  } catch (err) {
    setStatus(escapeHtml(err.message), true);
    setBusy(false);
    return;
  }

  renderEntry(entry);
  els.status.classList.add("hidden");
  els.result.classList.remove("hidden");
  setBusy(false);

  // Image is generated after the text so the user can start reading.
  generateImage(entry);
}

function renderEntry(entry) {
  els.resWord.textContent = entry.word || els.wordInput.value.trim();
  const pos = entry.senses?.[0]?.partOfSpeech ? `<span class="pos">${escapeHtml(entry.senses[0].partOfSpeech)}</span>` : "";
  const pron = entry.pronunciation ? escapeHtml(entry.pronunciation) : "";
  els.resMeta.innerHTML = [pos, pron].filter(Boolean).join(" · ");
  els.resLevel.textContent = entry.wordLevel ? `CEFR ${entry.wordLevel}` : "";

  // Senses
  els.resDefs.innerHTML = "";
  (entry.senses || []).forEach((s) => {
    const div = document.createElement("div");
    div.className = "sense";
    div.innerHTML = `
      <span class="sense-pos">${escapeHtml(s.partOfSpeech || "")}</span>
      <div class="sense-def">${escapeHtml(s.definition || "")}</div>
      ${s.example ? `<div class="sense-example">${escapeHtml(s.example)}</div>` : ""}`;
    els.resDefs.appendChild(div);
  });

  // Synonyms
  els.resSyns.innerHTML = "";
  const syns = entry.synonyms || [];
  if (!syns.length) {
    els.resSyns.innerHTML = `<p class="muted">No close synonyms for this word.</p>`;
  } else {
    const list = document.createElement("div");
    list.className = "syn-list";
    syns.forEach((s) => {
      const item = document.createElement("div");
      item.className = "syn-item";
      item.innerHTML = `<strong>${escapeHtml(s.word || "")}</strong>${s.note ? `<span class="syn-note">${escapeHtml(s.note)}</span>` : ""}`;
      list.appendChild(item);
    });
    els.resSyns.appendChild(list);
  }
}

async function generateImage(entry) {
  els.imageBox.classList.remove("is-error");
  els.imageBox.innerHTML = `<span class="image-placeholder"><span class="spinner"></span>Generating image…</span>`;
  els.imageCaption.textContent = "";

  const scene = entry.imagePrompt || `A clear illustration of the word "${entry.word}".`;
  const prompt = `A clean, friendly educational illustration that helps a language learner understand the English word "${entry.word}". Scene: ${scene}. Bright, simple, uncluttered, no text or letters in the image.`;

  try {
    const dataUrl = await geminiImage(prompt);
    const img = new Image();
    img.alt = `Illustration of "${entry.word}"`;
    img.src = dataUrl;
    els.imageBox.innerHTML = "";
    els.imageBox.appendChild(img);
    els.imageCaption.textContent = scene;
  } catch (err) {
    els.imageBox.classList.add("is-error");
    els.imageBox.innerHTML = `<span class="image-placeholder">${escapeHtml(err.message)}</span>`;
  }
}

/* ---------- helpers ---------- */
function setStatus(html, isError = false) {
  els.status.innerHTML = html;
  els.status.classList.toggle("is-error", isError);
  els.status.classList.remove("hidden");
}
function setBusy(busy) {
  els.lookupBtn.disabled = busy;
  els.wordInput.disabled = busy;
}
function escapeHtml(str) {
  return String(str).replace(/[&<>"']/g, (c) => (
    { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]
  ));
}

els.lookupBtn.addEventListener("click", lookup);
els.wordInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") lookup();
});

/* ---------- go ---------- */
boot();
