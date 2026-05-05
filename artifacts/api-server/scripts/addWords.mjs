import fs from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import OpenAI from "openai";

const __dirname = dirname(fileURLToPath(import.meta.url));
const dataPath = resolve(__dirname, "../src/data/oxford3000.json");
const data = JSON.parse(fs.readFileSync(dataPath, "utf-8"));

function norm(s) {
  return s.trim().toLowerCase().replace(/[\s,/]+/g, " ");
}
const existing = new Set();
for (const lvl of Object.keys(data)) {
  for (const w of data[lvl]) existing.add(norm(w.word));
}
console.log("existing distinct:", existing.size);
console.log(
  "per-level:",
  Object.fromEntries(Object.entries(data).map(([k, v]) => [k, v.length])),
);

const openai = new OpenAI({
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
});

const FULL_FORBIDDEN = [...existing].sort().join(", ");

async function generateBatch(level, target, alreadyAddedSamples, theme) {
  const guidance =
    level === "A2"
      ? "elementary — concrete everyday vocabulary appropriate for an A2 learner. Less-common but still useful A2 words, not super-basic ones."
      : "intermediate — moderately specific everyday vocabulary appropriate for a B1 learner. Less-common but still useful B1 words.";
  const prompt = `Curate ${target} brand-new CEFR ${level} English headwords for an Oxford-5000-style learner app.

Level guidance: ${guidance}.
${theme ? `Focus this batch on the theme: **${theme}**.` : ""}

CRITICAL DEDUPLICATION RULE:
The user already has these ${existing.size} headwords in their corpus. You MUST NOT propose ANY of them. Read the list carefully:

${FULL_FORBIDDEN}

Also avoid the just-added words from this run: ${alreadyAddedSamples.join(", ") || "(none yet)"}.

If you can only think of words that are already in the list, dig deeper — propose less obvious but still genuinely common words at this level (e.g. "cushion", "blanket", "scarf", "stroll", "giggle", "chilly", "shy", "polite", "awkward" for A2; "appreciate", "complaint", "convince", "reluctant", "outcome", "impact", "prefer" for B1). Look for synonyms, opposites, related words to existing headwords that themselves are NOT yet listed.

OTHER STRICT RULES:
- Each headword: a SINGLE common English word (no phrases, no multi-word, no proper nouns, no slang, no abbreviations, no contractions).
- Lowercase only.
- Genuinely appropriate for CEFR ${level}.
- POS using these short codes only: "n.", "v.", "adj.", "adv.", "prep.", "conj.", "det.", "pron.", "exclam.", "modal v.", "number".
- Pick the SINGLE most common POS per word.
- Aim for variety across nouns, verbs, adjectives, adverbs.
- Output ONLY valid minified JSON: {"words":[{"word":"...","pos":"n."},...]}`;

  const resp = await openai.chat.completions.create({
    model: "gpt-5-mini",
    max_completion_tokens: 8192,
    messages: [
      {
        role: "system",
        content: "You output strict minified JSON only. No prose, no markdown.",
      },
      { role: "user", content: prompt },
    ],
    response_format: { type: "json_object" },
  });
  const raw = resp.choices[0]?.message?.content ?? "{}";
  const parsed = JSON.parse(raw);
  return parsed.words || [];
}

const THEMES = [
  "household objects, furniture, kitchen, bathroom",
  "food, cooking, restaurants, drinks, ingredients",
  "clothing, fashion, accessories, materials",
  "feelings, emotions, personality traits",
  "weather, seasons, nature, landscape",
  "body parts, health, illness, medicine",
  "travel, transport, hotels, directions",
  "work, jobs, office, business",
  "school, study, learning, exams",
  "hobbies, sports, games, leisure",
  "technology, computers, phones, internet",
  "city, shops, services, street",
  "family, relationships, social life",
  "verbs of motion and physical action",
  "common adjectives describing people",
  "common adjectives describing things",
  "everyday adverbs of manner, time, frequency",
  "money, shopping, prices, paying",
  "communication, talking, writing, sounds",
  "time, dates, schedule, events",
];

async function collect(level, want) {
  const added = [];
  const addedSet = new Set();
  let round = 0;
  const PARALLEL = 5;
  while (added.length < want && round < 5) {
    const themesThisRound = THEMES.slice(
      (round * PARALLEL) % THEMES.length,
      (round * PARALLEL) % THEMES.length + PARALLEL,
    );
    console.log(`[${level}] round ${round + 1}: parallel themes:`, themesThisRound);
    const results = await Promise.all(
      themesThisRound.map((theme) =>
        generateBatch(level, 30, [...addedSet].slice(0, 50), theme).catch(
          (e) => {
            console.error(`[${level}] theme "${theme}" err:`, e.message);
            return [];
          },
        ),
      ),
    );
    let kept = 0;
    for (const candidates of results) {
      for (const c of candidates) {
        if (!c?.word || !c?.pos) continue;
        const w = String(c.word).trim().toLowerCase();
        const p = String(c.pos).trim();
        if (!/^[a-z][a-z'-]*$/.test(w)) continue;
        const key = norm(w);
        if (existing.has(key) || addedSet.has(key)) continue;
        addedSet.add(key);
        existing.add(key);
        added.push({ word: w, pos: p });
        kept++;
        if (added.length >= want) break;
      }
      if (added.length >= want) break;
    }
    console.log(`[${level}] round ${round + 1}: kept ${kept}, total ${added.length}/${want}`);
    round++;
  }
  return added;
}

const targetLevel = process.argv[2];
const targetCount = parseInt(process.argv[3] || "100", 10);
if (!["A2", "B1"].includes(targetLevel)) {
  console.error("Usage: node addWords.mjs <A2|B1> <count>");
  process.exit(2);
}

const added = await collect(targetLevel, targetCount);
console.log(`[${targetLevel}] FINAL collected: ${added.length}/${targetCount}`);
console.log("sample:", added.slice(0, 15));

if (added.length >= targetCount) {
  data[targetLevel] = [...data[targetLevel], ...added.slice(0, targetCount)];
  fs.writeFileSync(dataPath, JSON.stringify(data, null, 2));
  const totals = Object.fromEntries(
    Object.entries(data).map(([k, v]) => [k, v.length]),
  );
  console.log(
    "Updated totals:",
    totals,
    "sum:",
    Object.values(totals).reduce((a, b) => a + b, 0),
  );
} else {
  console.error(
    `Did not reach target count (${added.length}/${targetCount}); refusing to write.`,
  );
  process.exit(1);
}
