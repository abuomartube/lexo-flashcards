# LEXO Flashcards

Premium AI-powered flashcard app for Arabic-speaking learners studying the Oxford 5000 word list, organized by CEFR level (A1 → C1). English + Arabic translations, AI-generated example sentences, and TTS audio in both languages, wrapped in a dark luxury UI with cinematic animations.

This is a **pnpm monorepo** containing the web app, the backend API, and a component preview sandbox.

---

## Project structure

```
.
├── artifacts/
│   ├── api-server/         Express + Drizzle backend (mounted at /api)
│   ├── lexo-flashcards/    React + Vite web app (the flashcards UI)
│   └── mockup-sandbox/     Vite-based component preview server
├── lib/
│   ├── api-spec/           OpenAPI source of truth (lib/api-spec/openapi.yaml)
│   ├── api-client-react/   Generated React Query hooks
│   ├── api-zod/            Generated Zod schemas
│   └── db/                 Drizzle schema + DB client
├── scripts/                Shared utility scripts
├── pnpm-workspace.yaml     Workspace package discovery + catalog pins
├── tsconfig.base.json      Shared strict TS defaults
└── package.json            Root task orchestration
```

### Where the flashcards live

The web app source is in **`artifacts/lexo-flashcards/src`**:

- `src/pages/home.tsx` — main flashcards screen (swipe gestures, animations, study modes)
- `src/components/Flashcard.tsx` — the 3D-flip card itself
- `src/components/StatsHeader.tsx` — XP / level header
- `src/components/AchievementToast.tsx` — achievement notifications
- `src/index.css` — Tailwind base + custom keyframes (glow, shake, xp-pop, reduced-motion guard)

### Where the API server runs

The backend source is in **`artifacts/api-server/src`**, mounted under **`/api`**:

- `GET /api/healthz`
- `GET /api/levels` → `[{ level, count }]`
- `GET /api/words?level=A1|A2|B1|B2|C1|ALL&search=…` → `[{ id, english, pos, level }]`
- `GET /api/cards/:id` → full card payload (English + Arabic word, example sentence in both languages, audio URLs). Generates and caches missing translations / audio on first hit.
- `GET /api/audio/:hash.mp3` → cached TTS audio with immutable cache headers

The Oxford 5000 source data lives at `artifacts/api-server/src/data/oxford3000.json` and is seeded into Postgres on startup.

---

## Prerequisites

- **Node.js 20+**
- **pnpm 9+** (`corepack enable && corepack prepare pnpm@latest --activate`)
- **PostgreSQL** (any reachable instance — Replit, Neon, local Docker, etc.)
- An **OpenAI-compatible API endpoint** (the project is built around Replit AI Integrations, but any OpenAI-compatible base URL + key will work)
- An **object storage bucket** for cached TTS mp3s (Replit App Storage, GCS, or compatible)

---

## Environment variables

Create a `.env` file at the repo root (or set these in your hosting platform). **Never commit secrets** — `.env` is gitignored.

```bash
# Database
DATABASE_URL=postgres://user:pass@host:5432/dbname

# Session
SESSION_SECRET=replace-with-a-long-random-string

# AI integration (OpenAI-compatible)
AI_INTEGRATIONS_OPENAI_BASE_URL=https://...
AI_INTEGRATIONS_OPENAI_API_KEY=sk-...

# Object storage (Replit App Storage or compatible)
DEFAULT_OBJECT_STORAGE_BUCKET_ID=...
PRIVATE_OBJECT_DIR=/your-bucket/private
PUBLIC_OBJECT_SEARCH_PATHS=/your-bucket/public
```

When running on Replit, `DATABASE_URL`, the AI integration variables, and the object storage variables are injected automatically once the corresponding integrations are added.

---

## Install

From the repo root:

```bash
pnpm install
```

This installs dependencies for every workspace package using `pnpm-lock.yaml`.

---

## Run dev mode

Each artifact runs as its own service. Open three terminals (or use Replit workflows):

```bash
# Terminal 1 — API server (Express, builds + starts)
pnpm --filter @workspace/api-server run dev

# Terminal 2 — Flashcards web app (Vite)
pnpm --filter @workspace/lexo-flashcards run dev

# Terminal 3 — Component preview sandbox (optional)
pnpm --filter @workspace/mockup-sandbox run dev
```

On **Replit**, the workflows `artifacts/api-server: API Server`, `artifacts/lexo-flashcards: web`, and `artifacts/mockup-sandbox: Component Preview Server` are pre-configured and start automatically. The reverse proxy routes `/api/*` to the API server and `/` to the flashcards app, so you can open the published URL and everything just works.

> **Don't run `pnpm dev` at the repo root** — there is no root `dev` script by design. Each artifact needs `PORT` and `BASE_PATH` set by its workflow.

---

## Build & typecheck

```bash
# Typecheck the whole monorepo (libs first via project references, then artifacts)
pnpm run typecheck

# Build everything
pnpm run build
```

To regenerate API client/zod files after editing `lib/api-spec/openapi.yaml`:

```bash
pnpm --filter @workspace/api-spec run codegen
```

---

## Deployment

The app is configured for Replit Deployments. Pushing to GitHub does not automatically deploy — use Replit's **Publish** button (or your own CI/CD) to roll out a new version.

For self-hosting, the artifacts are independent services that can be containerized separately. Make sure the reverse proxy in front of them maps:

- `/api/*` → `api-server` (default port `8080`)
- `/*` → `lexo-flashcards` static build output

---

## License

MIT — see `package.json`.
