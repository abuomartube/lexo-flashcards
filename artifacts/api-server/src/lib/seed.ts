import { db, wordsTable } from "@workspace/db";
import { sql } from "drizzle-orm";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { logger } from "./logger";

type LevelKey = "A1" | "A2" | "B1" | "B2" | "C1";
type RawWord = { word: string; pos: string };
type OxfordData = Record<LevelKey, RawWord[]>;
const ALL_LEVELS: LevelKey[] = ["A1", "A2", "B1", "B2", "C1"];

const __dirname = dirname(fileURLToPath(import.meta.url));

function loadData(): OxfordData {
  const candidates = [
    resolve(__dirname, "../data/oxford3000.json"),
    resolve(__dirname, "./data/oxford3000.json"),
    resolve(__dirname, "../src/data/oxford3000.json"),
  ];
  for (const p of candidates) {
    try {
      return JSON.parse(readFileSync(p, "utf-8")) as OxfordData;
    } catch {
      // try next
    }
  }
  throw new Error("oxford3000.json not found in expected locations");
}

export async function seedWordsIfEmpty(): Promise<void> {
  const data = loadData();

  // Idempotent seeding: upsert every (level, english, pos) row from the JSON.
  // The unique index on (level, english, pos) means already-present rows are
  // skipped via onConflictDoNothing, while newly added entries (e.g. extra B2
  // words or the entire C1 level) get inserted. Existing per-card content
  // (Arabic translations, audio paths) is never touched.
  const before = await db
    .select({
      level: wordsTable.level,
      count: sql<number>`count(*)::int`,
    })
    .from(wordsTable)
    .groupBy(wordsTable.level);
  const countBefore = new Map(before.map((r) => [r.level, r.count]));

  const rows: { level: string; english: string; pos: string }[] = [];
  for (const level of ALL_LEVELS) {
    const list = data[level];
    if (!list || list.length === 0) continue;
    for (const { word, pos } of list) {
      rows.push({ level, english: word, pos: pos ?? "" });
    }
  }

  const chunkSize = 500;
  for (let i = 0; i < rows.length; i += chunkSize) {
    const chunk = rows.slice(i, i + chunkSize);
    await db.insert(wordsTable).values(chunk).onConflictDoNothing();
  }

  const after = await db
    .select({
      level: wordsTable.level,
      count: sql<number>`count(*)::int`,
    })
    .from(wordsTable)
    .groupBy(wordsTable.level);
  const countAfter = new Map(after.map((r) => [r.level, r.count]));

  const inserted: Record<string, number> = {};
  let total = 0;
  for (const lvl of ALL_LEVELS) {
    const delta = (countAfter.get(lvl) ?? 0) - (countBefore.get(lvl) ?? 0);
    if (delta > 0) {
      inserted[lvl] = delta;
      total += delta;
    }
  }
  if (total === 0) {
    logger.info({ totals: Object.fromEntries(countAfter) }, "Words already seeded; no new rows");
  } else {
    logger.info(
      { inserted, totals: Object.fromEntries(countAfter) },
      "Seeded missing words from Oxford 5000",
    );
  }
}
