import { db, wordsTable } from "@workspace/db";
import { sql } from "drizzle-orm";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { logger } from "./logger";

type LevelKey = "A1" | "A2" | "B1" | "B2";
type RawWord = { word: string; pos: string };
type OxfordData = Record<LevelKey, RawWord[]>;

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
  const [{ count }] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(wordsTable);
  if (count > 0) {
    logger.info({ count }, "Words table already seeded");
    return;
  }

  const data = loadData();
  const rows: { level: string; english: string; pos: string }[] = [];
  for (const level of ["A1", "A2", "B1", "B2"] as LevelKey[]) {
    for (const { word, pos } of data[level]) {
      rows.push({ level, english: word, pos: pos ?? "" });
    }
  }

  const chunkSize = 500;
  for (let i = 0; i < rows.length; i += chunkSize) {
    const chunk = rows.slice(i, i + chunkSize);
    await db.insert(wordsTable).values(chunk).onConflictDoNothing();
  }
  logger.info({ inserted: rows.length }, "Seeded words from Oxford 3000");
}
