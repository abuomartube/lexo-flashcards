# LEXO Flashcards

Premium AI-powered flashcard app for Arabic-speaking learners studying the Oxford 3000 word list, organized by CEFR level (A1, A2, B1, B2).

## Architecture

- **Frontend**: `artifacts/lexo-flashcards` — React + Vite, Tailwind, framer-motion, dark mode with violet/blue gradient accents matching the LEXO brand. 3D card flip with keyboard shortcuts (← → Space).
- **Backend**: `artifacts/api-server` — Express + Drizzle (Postgres) at `/api`. Awaits seed-from-JSON before listening, then serves levels/words/cards.
- **API spec**: `lib/api-spec/openapi.yaml` (Orval generates `@workspace/api-client-react` hooks and `@workspace/api-zod` schemas).
- **DB**: `lib/db` — single `wordsTable` with translations, sentences, and audio object paths cached lazily.
- **AI**: OpenAI via Replit AI Integrations. `gpt-5-mini` for JSON translation + example sentence generation; `gpt-audio` chat-completions API for TTS (mp3, alloy voice). Both translation and audio generated on first card view, cached in DB / object storage.
- **Object storage**: Audio mp3s cached in the bucket under `<PRIVATE_OBJECT_DIR>/audio/<sha256>.mp3`, served by `/api/audio/:hash.mp3`.
- **Word data**: parsed from `attached_assets/The_Oxford_3000_by_CEFR_level_*.pdf` into `artifacts/api-server/src/data/oxford3000.json` (3304 entries).

## Endpoints (mounted at `/api`)

- `GET /healthz`
- `GET /levels` → `[{level, count}]`
- `GET /words?level=A1|A2|B1|B2|ALL&search=...` → list of `{id, english, pos, level}`
- `GET /cards/:id` → full card `{id, level, english, pos, arabic, sentenceEn, sentenceAr, audioWordUrl, audioSentenceUrl}`. Generates + caches missing pieces on first hit.
- `GET /audio/:hash.mp3` → cached audio, immutable cache headers.

## Gotchas

- The public dev URL (`*.pike.replit.dev`) hits Vite directly on the artifact's external port, bypassing the platform's path-based `/api` proxy that only exists on port 80. The lexo-flashcards `vite.config.ts` therefore needs a dev `server.proxy` entry forwarding `/api` → `http://localhost:8080`. Production is unaffected.

## Required env vars

- `DATABASE_URL` (Postgres)
- `AI_INTEGRATIONS_OPENAI_BASE_URL`, `AI_INTEGRATIONS_OPENAI_API_KEY`
- `DEFAULT_OBJECT_STORAGE_BUCKET_ID`, `PRIVATE_OBJECT_DIR`, `PUBLIC_OBJECT_SEARCH_PATHS`
- `SESSION_SECRET`
