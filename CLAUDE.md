# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this repo is

**ChapterWhisper** is a greenfield take-home assessment (Gradion, intern fullstack). The full
brief is `docs/PRD.md` — **it is the spec of record; read it before making any design call.**

The app: paste/upload a book's text, then run a 5-step Gemini pipeline one step at a time —
style → characters → portraits → chapters → illustrations.

**Current state: harness stood up, no features yet.** npm workspaces + Express/TS server +
Vite/React/TS client, wired together by a health-check endpoint and one sanity test per side.
None of the pipeline, auth, storage, or Gemini integration exists. `README.md` and `TESTING.md`
are empty; `DECISIONS.md` holds only a `{{title}}` scaffold. All three are graded deliverables.

## Commands

Run from the repo root — the workspaces are driven from there.

| Command | What it does |
| --- | --- |
| `npm run dev` | Both sides via `concurrently`: server on `:4000` (tsx watch), client on `:3000` (Vite). **This is the working path.** |
| `npm test` | Server vitest, then client vitest |
| `npm run build` | `tsc` for server → `server/dist`, then `tsc && vite build` for client → `client/dist` |
| `npm run dev:server` / `dev:client` | One side only |
| `npm run test:server` / `test:client` | One side only |

Single test file or name: `npm test --workspace=server -- tests/health.test.ts`, or
`-- -t "substring"`. Watch mode: drop the `run` — `npx vitest` inside `server/` or `client/`.

`npm start` runs **only** the built server; nothing serves `client/dist` yet. Production is not
a working path — if the PRD's "one command starts the stack" is to hold outside dev, the server
has to serve the client build (or a `start.sh` has to launch both).

## Architecture

```
package.json          workspaces: [server, client]; all dev/test/build entry points
server/  Express 4 + TS (ESM, NodeNext) — src/index.ts is the whole server today
client/  Vite 6 + React 18 + TS + Tailwind 3
```

- **The two sides talk over a Vite proxy, not CORS, in dev.** `client/vite.config.ts` proxies
  `/api` → `BACKEND_URL` (default `http://localhost:4000`), so client code calls relative
  `/api/...` paths and never hardcodes a host. Keep it that way. The server also enables
  `cors()` broadly, which is what makes a direct `:4000` hit work.
- **Env lives in two places.** Root `.env` and `server/.env` are currently byte-identical
  copies of `.env.example`; `dotenv.config()` in `server/src/index.ts` resolves against the
  server's cwd, so `server/.env` is the one that actually loads under `npm run dev`. Keep them
  in sync or collapse to one — silently divergent copies are a debugging trap. `.env.example`
  is committed and already declares `PORT`, `NODE_ENV`, `JWT_SECRET`, `JWT_EXPIRES_IN`,
  `GEMINI_API_KEY`, `GEMINI_TEXT_MODEL`, `GEMINI_IMAGE_MODEL`, `STORAGE_DIR`.
- **Dependencies present but unused** — they encode intended design, not accidents:
  `jsonwebtoken` (auth), `multer` (book upload), `zod` (validating Gemini's structured JSON and
  request bodies), `uuid`, `STORAGE_DIR=./data` plus gitignored `server/data/{storage,projects}/`
  and `data/users.json` (JSON-files-on-disk storage, per the PRD's right-sizing).

### Traps in the current scaffold

- **Neither side has a vitest config file.** Client tests therefore run in the default `node`
  environment — the first React component test will fail on a missing DOM. Add
  `client/vitest.config.ts` with `environment: 'jsdom'` and a `@testing-library/jest-dom`
  setup file before writing component tests. (`jsdom` and Testing Library are already installed.)
- **`server/tsconfig.json` includes only `src/`,** but tests live in `server/tests/`. They run
  under vitest but are never type-checked by `npm run build`.
- **Tailwind is configured but not wired in.** `client/src/index.css` has no `@tailwind`
  directives, so the utility classes already on `client/index.html`'s `<body>`
  (`bg-parchment`, `text-onyx-warm`, `selection:bg-saffron-glow`) currently do nothing, and
  the file hardcodes an off-palette `#f8f6f0`. Add the three directives when styling starts.

## Files present

**The repo root is an Obsidian vault** (`.obsidian/` is committed; per-machine UI state is
gitignored). Notes live in `docs/` and carry YAML frontmatter, `[[wikilinks]]`, and
`> [!type]` callouts; the root deliverables are notes in the same vault. Links are wikilinks
rather than relative paths so they survive file moves — `app-demo.html` has already moved
once. Keep new docs in that format, and start from [[Index]].

| Path | What it is |
| --- | --- |
| `docs/Index.md` | Vault hub (MOC) — pipeline, hard constraints, deliverable checklist, open questions. Start here. Its "where things stand" callout still says *docs only* and is stale — update it as work lands |
| `docs/PRD.md` | The assessment brief — requirements, deliverables, grading criteria |
| `app-demo.html` | Ships with the assessment. Standalone `localStorage` mock of the whole flow. Open it in a browser; it is the **scope and behavior floor** for the UI |
| `docs/DESIGN.md` | Visual style reference ("Amrit Palace" — warm parchment, serif display, 0px radius), frontmatter `status: unconfirmed`. It does **not** match `app-demo.html`'s orange/paper "Gradion" tokens. Note the code has already picked a side: `client/tailwind.config.js` and `index.html` carry the Amrit Palace palette and Cormorant Garamond/Inter. Get that confirmed and recorded in `DECISIONS.md` rather than leaving the doc and the code disagreeing |
| `README.md` | Required deliverable, currently empty — one start command, one test command, prereqs, env vars, architecture |
| `DECISIONS.md` | Required deliverable. `{{title}}` scaffold only — no real entries yet |
| `TESTING.md` | Required deliverable, currently empty — see below |

## Hard requirements that constrain implementation

These come from `docs/PRD.md` and are graded. Do not quietly relax them.

- **Caps: max 2 characters, max 1 chapter — enforced server-side**, not just in the UI. They bound API cost.
- **Send the book text to Gemini once** and reuse it across steps (chat/session chaining or file upload + reference). Never re-send the full text per step.
- **Never auto-retry a Gemini call.** All retries are user-triggered.
- **Steps run in order, each on an explicit user action**, and a step cannot start until the prior ones succeeded.
- **Resumable**: refresh, logout, or server restart mid-step must reopen to the true state with no lost results.
- **No duplicate calls**: refresh, second tab, or double-click during a running step must not fire Gemini twice — the guard belongs on the server, not in one browser tab.
- **Retryable failures**: a failed step leaves the project usable and retries that step alone.
- **No stuck-forever state**: a step stranded "in progress" (server died mid-call) needs a user-reachable recovery path.
- **One command starts the stack, one command runs the tests.** A reviewer runs one line.
- Gemini key via env var, never committed; ship `.env.example`. Images and book text on the local filesystem, served through our own API — no S3/CDN.
- Out of scope, do not build: Veo animation, Lyria music, TTS narration, audiobook.

## Pipeline contract

The mechanics (which model, how context chains, how structured JSON is requested) come from the
notebook the PRD links, not from guesswork:
`https://colab.research.google.com/github/google-gemini/cookbook/blob/main/examples/Book_illustration.ipynb`
Gemini REST docs: `https://ai.google.dev/gemini-api/docs`. Only sections 1–5 ("Illustrate a
book: The Wind in the Willows") are in scope. `.env.example` currently names
`gemini-2.5-flash` and `imagen-3.0-generate-002` — verify both against the notebook and current
free-tier limits (tighter on the image model) before wiring them up.

The demo's state model is a reasonable starting shape (`app-demo.html` ~line 282):
a linear `status` (`CREATED → STYLE_SET → CHARACTERS_GENERATED → PORTRAITS_GENERATED →
CHAPTERS_GENERATED → DONE`) plus a separate `stepState` (`IDLE`/`RUNNING`) with a
`stepStartedAt` timestamp for stale detection. Two fields, because one enum cannot express
"step 3 done, step 4 currently running" — which is exactly what a mid-step refresh must read.

## Reading `app-demo.html`

Cover everything it does, but it is a mock and stops short in three places that are ours to solve:

1. It never fails — there is no error state to copy.
2. Its duplicate-click guard lives in one browser tab; ours belongs server-side.
3. Its timings are fake (~2s steps, 8s stale threshold). Real calls are 10–30s+, images longer.

Do not port its `localStorage` store or its numbers.

## Deliverables that are graded as much as the code

- **`DECISIONS.md`** — 4–6 decisions, a heading and a paragraph each, in the user's own voice:
  who proposed it, who pushed back, where it landed, what it cost. Must include **at least 3
  places the AI was overridden** (wrong, unsafe, or overcomplicated) and must cover stack +
  storage choice, how pipeline progress is modeled, and how duplicate execution on refresh is
  stopped. Closes with a one-more-day answer. This is the user's writeup — draft only when
  asked, never invent decisions that did not happen.
- **`TESTING.md`** — strategy for both sides (backend: step ordering, progress, retry;
  frontend: a couple of components' loading/error/empty states), what is deliberately not
  tested, plus **a real test run's output** pasted or committed. Never fabricate a report.
- **Git history** — small, meaningful, incremental commits with real messages, committed as
  work happens. No single giant commit; reviewers look at timestamps. Note in the message body
  when a commit was mostly AI-authored.

## Working style for this repo

- **Right-sized beats thorough.** Over-engineering is explicitly penalized. Prefer the smallest
  thing that fully works; JSON files on disk are an accepted storage choice at this scope if
  isolated per user/project and safe against overlapping writes.
- **Harness first.** Improve the test/run loop as you go — the two `health.test.ts` sanity
  tests are placeholders and should be replaced by the first real tests, not accumulated around.
- Mock Gemini in tests — do not burn free-tier quota, which is tighter on the image model.
