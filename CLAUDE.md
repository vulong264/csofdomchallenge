@AGENTS.md

# CS of Doom — project guide

A single-learner web app that teaches **Cambridge IGCSE Computer Science (0478, v5, exams 2026–2028)** to one 14-year-old (Tom) to genuine exam mastery — not a quiz toy. Every concept must be **seen and manipulated**; every unit is **provably mastered before the next unlocks**. Theme: a five-sector dungeon ("Dungeon Run") where each unit ends in a Boss Fight (the Mastery Test, gated at ≥80%).

## Stack (decided)
- **Next.js 16** (App Router, Turbopack) + **React 19** + **TypeScript (strict)**. NOTE: the seed spec named Next.js 15; we build on 16 (current latest) — functionally a superset here. `params`/`searchParams` are async (`await params`); global `PageProps<'/route'>` / `LayoutProps<'/route'>` helpers are available after `next dev`/`build`.
- **Tailwind CSS v4** — CSS-first config. Tokens live in `app/globals.css` via `:root` vars + `@theme inline`, so cosmetic "loot" themes can override them with `[data-theme="…"]`. There is **no** `tailwind.config.js`.
- **Framer Motion** for transitions; plain **SVG/Canvas** for interactive widgets (no charting lib).
- **Vitest** for unit tests (maths/logic/rewards/gating). `npm test`.
- **Google Gemini API** (`@google/genai`) for the AI tutor + free-text grading — **server routes only** (`app/api/*`), key in `GEMINI_API_KEY`, never in the client bundle. `gemini-2.5-flash` tutor (streamed), `gemini-2.5-flash-lite` JSON-structured grader; thinking disabled for latency. (Build step 4.)

## Architecture
- `content/` — the curriculum is the **source of truth** (teach to this, not to model recall). `content/index.ts` exports `UNITS`; units are drop-in extensible (syllabus Topics 4/5/6/8/9 added later without refactor). Typed objects only — no UI here.
- `lib/domain/` — the `Question` discriminated union (graded by `type`) + exam command words.
- `lib/progress/` — `ProgressStore` interface (localStorage impl now; `// TODO: swap to Vercel KV/Postgres`), React context + `useProgress` hook, JSON export/import.
- `lib/rewards/` — one editable `RewardConfig` + **pure** compute (vault decay, mastery banked, projected payout, Nintendo minutes). Tested against the spec §11.3 table.
- `lib/srs/` — SM-2 spaced repetition (warm-ups from mastered units resurface on the dashboard).
- `lib/engine/` — gating (≥80% unlock), grading, xp/level, streak/combo, "what next?" recommender.
- `lib/util/` — number systems, file size, parity, boolean logic. **All maths/logic is unit-tested.**
- `components/` — `ui/` kit, `shell/`, `dashboard/`, `question/`, `widgets/` (registry + each widget).

## Invariants (do not break)
- A learner **cannot reach Unit n+1's content without passing Unit n's Mastery Test at ≥80%.** (localStorage ⇒ client-guarded for now; true server gating is the DB seam.)
- **Banked mastery cash never decreases.** Only the speed vault decays / penalises. Projected payout is capped at **1,000,000 VND**.
- XP / levels are **cosmetic only** — never convertible to cash (prevents grinding trivial XP for money).
- **No API key in the client bundle.** AI degrades gracefully to static content when the key is absent.
- Pseudocode shown anywhere matches **Cambridge 0478 conventions exactly** (UPPERCASE keywords, `←` assignment, `DECLARE Id : TYPE`, `FOR…NEXT`, etc.).
- Strict TypeScript, **no `any` in domain code** (ESLint-enforced).

## Conventions
- Pages that read progress are client components (`"use client"`); the root layout stays a Server Component.
- MCQ distractors are drawn from each unit's "common mistakes" so a wrong click diagnoses a specific misconception; the tutor probes the same list.
- Feedback is always specific — name the misconception and link back to the concept, never just "wrong".
- Reward economy and gamification are first-class (spec §11), all driven by `RewardConfig` so a parent can re-tune every dial without code changes.

## Build order (verify acceptance before advancing — spec §9)
1. Engine + shell (this step): progress store + export/import, data model, dashboard, gating, question engine, XP/streak, a dummy unit that gates the next at 80%.
2. Unit 1 (Data Representation) with all widgets + tutor + mastery test.
3. Units 2 → 5.
4. AI tutor + free-text grading + "explain it back".
5. Parent view + polish.

## Commands
- `npm run dev` — local dev (Turbopack)
- `npm test` / `npm run test:watch` — Vitest
- `npm run typecheck` — `tsc --noEmit`
- `npm run lint` — ESLint
