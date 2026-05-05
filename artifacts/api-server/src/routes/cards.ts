import { Router, type IRouter } from "express";
import { sql, eq, asc, and, or, ilike } from "drizzle-orm";
import { db, wordsTable } from "@workspace/db";
import {
  ListLevelsResponse,
  ListWordsResponse,
  ListWordsQueryParams,
  GetCardParams,
  GetCardResponse,
} from "@workspace/api-zod";
import { ensureCard } from "../lib/cards";
import { streamAudio, ensureAudioForHash } from "../lib/audio";

const router: IRouter = Router();

const LEVELS = ["A1", "A2", "B1", "B2", "C1"] as const;

router.get("/levels", async (_req, res): Promise<void> => {
  const rows = await db
    .select({
      level: wordsTable.level,
      count: sql<number>`count(*)::int`,
    })
    .from(wordsTable)
    .groupBy(wordsTable.level);

  const map = new Map(rows.map((r) => [r.level, r.count]));
  const ordered = LEVELS.map((level) => ({
    level,
    count: map.get(level) ?? 0,
  }));
  res.json(ListLevelsResponse.parse(ordered));
});

router.get("/words", async (req, res): Promise<void> => {
  const parsed = ListWordsQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const { level, search } = parsed.data;

  const filters = [];
  if (level && level !== "ALL") filters.push(eq(wordsTable.level, level));
  if (search && search.trim().length > 0) {
    filters.push(ilike(wordsTable.english, `${search.trim()}%`));
  }

  const rows = await db
    .select({
      id: wordsTable.id,
      english: wordsTable.english,
      pos: wordsTable.pos,
      level: wordsTable.level,
    })
    .from(wordsTable)
    .where(filters.length ? and(...filters) : undefined)
    .orderBy(asc(wordsTable.level), asc(wordsTable.english), asc(wordsTable.id));

  res.json(ListWordsResponse.parse(rows));
});

router.get("/cards/:id", async (req, res): Promise<void> => {
  const parsed = GetCardParams.safeParse(req.params);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const id = parsed.data.id;
  try {
    const card = await ensureCard(id);
    if (!card) {
      res.status(404).json({ error: "Card not found" });
      return;
    }
    const payload = {
      id: card.id,
      level: card.level,
      english: card.english,
      pos: card.pos,
      arabic: card.arabic ?? "",
      sentenceEn: card.sentenceEn ?? "",
      sentenceAr: card.sentenceAr ?? "",
      audioWordUrl: `/api/audio/${card.audioWordPath}.mp3`,
      audioSentenceUrl: `/api/audio/${card.audioSentencePath}.mp3`,
    };
    res.json(GetCardResponse.parse(payload));
  } catch (err) {
    req.log.error({ err }, "Failed to build card");
    res.status(500).json({ error: "Failed to build card" });
  }
});

router.get("/audio/:hash.mp3", async (req, res): Promise<void> => {
  const rawHash = Array.isArray(req.params.hash)
    ? req.params.hash[0]
    : req.params.hash;
  if (!rawHash || !/^[a-f0-9]{64}$/.test(rawHash)) {
    res.status(400).json({ error: "Invalid audio id" });
    return;
  }
  let result = await streamAudio(rawHash);
  if (!result) {
    // MP3 not yet generated — look up which word/sentence this hash belongs
    // to and synthesize it on demand.
    const [row] = await db
      .select({
        english: wordsTable.english,
        sentenceEn: wordsTable.sentenceEn,
        audioWordPath: wordsTable.audioWordPath,
        audioSentencePath: wordsTable.audioSentencePath,
      })
      .from(wordsTable)
      .where(
        or(
          eq(wordsTable.audioWordPath, rawHash),
          eq(wordsTable.audioSentencePath, rawHash),
        ),
      )
      .limit(1);
    if (!row) {
      res.status(404).json({ error: "Audio not found" });
      return;
    }
    const text =
      row.audioWordPath === rawHash ? row.english : row.sentenceEn ?? "";
    if (!text) {
      res.status(404).json({ error: "Audio not found" });
      return;
    }
    try {
      await ensureAudioForHash("en", text, rawHash);
    } catch (err) {
      req.log.error({ err, hash: rawHash }, "Failed to synthesize audio");
      res.status(500).json({ error: "Failed to synthesize audio" });
      return;
    }
    result = await streamAudio(rawHash);
    if (!result) {
      res.status(500).json({ error: "Audio not available after generation" });
      return;
    }
  }
  res.setHeader("Content-Type", "audio/mpeg");
  res.setHeader("Content-Length", String(result.size));
  res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
  result.stream.on("error", (err) => {
    req.log.error({ err }, "Audio stream error");
    if (!res.headersSent) res.status(500).end();
    else res.end();
  });
  result.stream.pipe(res);
});

export default router;
