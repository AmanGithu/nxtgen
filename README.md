# NxtGen Academy

Learning platform with an AI career toolkit and **I-Assist**, a live interview co-pilot that listens to an interview and suggests answers in real time.

Three deployable pieces:

| Directory | What it is | Runs on |
|---|---|---|
| `client/` | React + TypeScript + Vite web app (student + admin) | `5173` |
| `server/` | Express + Prisma API, MySQL | `3001` |
| `desktop/` | Electron overlay for I-Assist | — |

The server is REST-only. The desktop app talks to it over HTTP; there is no WebSocket.

## Prerequisites

- Node.js 20+
- MySQL (schema name `nxtgen_academy` by default)
- A Gemini API key — see [AI models](#ai-models), the default model matters

## Setup

Install dependencies in each package:

```bash
npm install --prefix server && npm install --prefix client && npm install --prefix desktop
```

Copy the environment templates and fill them in:

```bash
cp server/.env.example server/.env && cp client/.env.example client/.env
```

Generate the Prisma client and apply migrations:

```bash
npm run db:generate --prefix server && npm run db:migrate --prefix server
```

`db:generate` only writes TypeScript types into `node_modules` and is always safe to re-run. `db:migrate` alters your database — check `server/prisma/migrations/` before running it.

## Running

```bash
npm run dev --prefix server
```

```bash
npm run dev --prefix client
```

```bash
npm start --prefix desktop
```

Re-run `npm install` and `db:generate` after any pull that changes `package.json` or `prisma/schema.prisma`. To check:

```bash
git diff --name-only HEAD@{1} HEAD | grep -E 'package|schema.prisma'
```

## AI models

Model names live in **two places**, and the database wins.

Code defaults are in `server/src/services/iassist/aiQueryService.ts` (`CONFIG_DEFAULTS`). At runtime they are overridden by `SiteConfig` rows, editable in the web app under **Admin → AI Config**. Changing a default in code has no effect if a row already exists.

Current I-Assist models: `gemini-3.1-flash-lite` for transcription, `gemini-2.5-flash` for answers.

**The model choice is not cosmetic.** The `gemini-2.0-*` family has no free-tier quota — requests fail with `429` and `limit: 0`, meaning no allowance was ever granted rather than an allowance being exhausted. Waiting and retrying will never succeed. If transcription starts failing with 429, check the model before anything else.

## I-Assist

How a live session works:

1. The desktop app captures system audio — what your speakers play, so the interviewer's voice.
2. Voice activity detection spots speech and records the utterance.
3. The audio is sent to `POST /api/iassist/transcribe` and turned into text by Gemini.
4. The text, plus the assistant's resume and job description, goes to `POST /api/iassist/query/stream`.
5. The answer streams back over server-sent events and renders word by word in the overlay.

Capture behaviour is tuned server-side under **Admin → AI Config** — silence gap, amplitude threshold, and minimum speech length. The desktop fetches these at session start, so changes take effect on the next session without a rebuild.

Internals of the capture and streaming pipeline are documented in [`desktop/CLAUDE.md`](desktop/CLAUDE.md).

## Troubleshooting

**`PayloadTooLargeError` on transcription.** Audio is posted as base64 JSON and a single chunk exceeds Express's 100kb default. `server/src/index.ts` raises the limit to 10mb; the resume/LinkedIn import path needs the same headroom. Don't lower it.

**`429 ... limit: 0` from Gemini.** Not a rate limit you can wait out — see [AI models](#ai-models).

**`The column ... does not exist in the current database`.** The Prisma client is ahead of the database. Run `npm run db:migrate --prefix server`.

**`Cannot find module` after a pull.** Dependencies changed. Run `npm install` in the affected package.

**Admin panel setting appears to do nothing.** Check something actually reads it. VAD settings existed in the panel for a while before any code consumed them.
