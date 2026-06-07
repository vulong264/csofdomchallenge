# CS of Doom — Dungeon Run

A single-learner web app that teaches **Cambridge IGCSE Computer Science (0478)** to genuine exam mastery, themed as a five-sector dungeon where each unit ends in a **Boss Fight** (the Mastery Test, gated at ≥80%). Built with Next.js 16, React 19, Tailwind v4, and the Google Gemini API for a Socratic AI tutor.

## Quick start

```bash
npm install
cp .env.example .env.local   # paste GEMINI_API_KEY (optional until the AI tutor step)
npm run dev                  # http://localhost:3000
```

Everything except the AI tutor / free-text grading runs fully offline. Without an API key, those features degrade gracefully to the static content.

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Start the dev server (Turbopack) |
| `npm run build` / `npm start` | Production build / serve |
| `npm test` | Run the Vitest unit tests (maths, logic, rewards, gating) |
| `npm run test:watch` | Vitest in watch mode |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run lint` | ESLint |

## Environment

Server-only secrets live in `.env.local` (gitignored). See `.env.example`:

- `GEMINI_API_KEY` — used only in `app/api/*` route handlers; never shipped to the client.
- `GEMINI_TUTOR_MODEL` / `GEMINI_GRADER_MODEL` — optional model overrides.

## Progress & data

Progress is stored in `localStorage` behind a `ProgressStore` interface. Use the in-app **Export / Import** to back up or move progress as JSON (survives a browser wipe, shareable with a parent). Swapping to a database (multi-device + a live parent dashboard) is a documented seam: `// TODO: swap to Vercel KV/Postgres`.

## Deploy (Vercel)

1. Push to a Git repo and import it at [vercel.com/new](https://vercel.com/new).
2. Set `GEMINI_API_KEY` (and optional model overrides) under Project → Settings → Environment Variables.
3. Deploy — `next build` and output are auto-detected.

## Project layout

See [`CLAUDE.md`](CLAUDE.md) for architecture and invariants. In short: `content/` is the curriculum source of truth, `lib/` is the engine (progress, rewards, SRS, gating, grading), `components/` is the UI + interactive widgets, and `app/` holds the routes.
