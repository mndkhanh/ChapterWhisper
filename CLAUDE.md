# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this repo is

**ChapterWhisper** is a greenfield take-home assessment (Gradion, intern fullstack). Paste or
upload a book's text, then run a 5-step Gemini pipeline one step at a time —
style → characters → portraits → chapters → illustrations.

**Current state: identity and storage done, pipeline not started.** npm workspaces +
Express/TS server + Vite/React/TS client. The server has passwordless auth
(`POST /api/auth/login`, `GET /api/auth/me`) over a JSON-file store with per-file mutex locks
and atomic write-rename. No projects, no Gemini integration, and no UI beyond the health-check
page. The design for the rest is specified in `docs/` — see below.

## Work through the vault, every task

This repo's notes are not decoration — they are where the design lives. Follow this loop on
every task, before and after touching code. The vault is plain markdown on disk, so use the
normal search/read/edit tools on `docs/`; the Obsidian app is just one view of the same files.

1. **Orient.** Start at `docs/Index.md` and follow its wikilinks to the note that owns the
   topic. Do not start from the code.
2. **Search the notes first.** Grep `docs/` for the concept before grepping `server/` or
   `client/` — note titles, `aliases:`, and `tags:` in the frontmatter are the search surface.
   A decision already made lives in a note, and re-deriving it from code gets it wrong.
3. **Read the owning note in full.** `Pipeline.md` owns step mechanics, `Architecture.md` owns
   storage and concurrency, `DESIGN.md` owns visual tokens, `PRD.md` owns everything and wins
   any conflict.
4. **Then write the code.**
5. **Write the result back into the vault, in the same change.** Update the owning note if the
   design shifted, tick the box in `docs/tracking/Progress.md`, and register new files in
   `docs/tracking/Files.md`. A commit that changes behavior and leaves the notes stale is
   incomplete.

When editing or adding notes, match the vault's conventions: YAML frontmatter
(`title`, `aliases`, `tags`, `type`, `status`), `[[wikilinks]]` rather than relative paths so
links survive file moves, and `> [!type]` callouts for constraints and warnings.

If a note and the code disagree, say so and fix the note — never silently code around it.

## Commands

Run from the repo root — the workspaces are driven from there.

| Command                               | What it does                                                                                                          |
| ------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| `npm run dev`                         | Both sides via `concurrently`: server on `:4000` (tsx watch), client on `:3000` (Vite). **This is the working path.** |
| `npm test`                            | Server vitest, then client vitest                                                                                     |
| `npm run build`                       | `tsc` for server → `server/dist`, then `tsc && vite build` for client → `client/dist`                                 |
| `npm run dev:server` / `dev:client`   | One side only                                                                                                         |
| `npm run test:server` / `test:client` | One side only                                                                                                         |

Single test file or name: `npm test --workspace=server -- tests/health.test.ts`, or
`-- -t "substring"`. Watch mode: drop the `run` — `npx vitest` inside `server/` or `client/`.

`npm start` runs **only** the built server; nothing serves `client/dist` yet, so production is
not a working path. The PRD requires one command to start the stack and one to run the tests —
`npm run dev` and `npm test` satisfy that today.

## The docs are the design of record

The repo root is an **Obsidian vault** (`.obsidian/` is committed; per-machine UI state is
gitignored). Notes carry YAML frontmatter, `[[wikilinks]]`, and `> [!type]` callouts; the root
deliverables are notes in the same vault. Links are wikilinks rather than relative paths so
they survive file moves — the whole `docs/` tree has already been reorganized once. Keep new
docs in that format and register them in `docs/tracking/Files.md`.

| Path                                      | What it is                                                                                                                                                                     |
| ----------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `docs/Index.md`                           | Vault hub (MOC) — structure, active stack, key decisions. Start here                                                                                                           |
| `docs/spec/PRD.md`                        | The assessment brief. **Source of truth**; read before any design call                                                                                                         |
| `docs/spec/Pipeline.md`                   | Per-step contract: model, input, JSON schema, output path, state transition for all 5 steps. **Read this before writing any pipeline code** — it is more specific than the PRD |
| `docs/architecture/Architecture.md`       | Layer diagram, storage/state model, concurrency guards                                                                                                                         |
| `docs/design/DESIGN.md`                   | "Amrit Palace" tokens — parchment `#d8cbb8`, saffron `#d49653`, onyx `#2c2c2c`, Cormorant Garamond + Inter, 0px radius                                                         |
| `docs/tracking/Progress.md`               | Milestone checklist — 5 milestones, roughly the intended build order                                                                                                           |
| `docs/tracking/Files.md`                  | File registry; update it when adding files                                                                                                                                     |
| `app-demo.html`                           | Ships with the assessment. Standalone `localStorage` mock of the whole flow. Open it in a browser; it is the **scope and behavior floor** for the UI                           |
| `README.md`, `TESTING.md`, `DECISIONS.md` | Graded deliverables, still empty / scaffold only — see below                                                                                                                   |

### Where the docs and the code disagree

The docs describe the intended system; several claims are not true of the tree yet. Trust the
filesystem, and fix the doc rather than working around it.

- **`Files.md` has stale paths** from before the reorg — it lists `docs/PRD.md`,
  `docs/Architecture.md`, `docs/Progress.md`, `docs/DESIGN.md`, `docs/Files.md`, all of which
  now live under `docs/spec/`, `docs/architecture/`, `docs/tracking/`, `docs/design/`.
- **Tailwind is further along than `Progress.md` says.** Milestone 4's first box is unchecked,
  but `client/tailwind.config.js` already carries the full Amrit Palace palette and font
  stacks — it is only the CSS wiring that is missing (see Traps).
- **`Architecture.md` says stale runs are "auto-recovering" past 2 minutes.** Read that as
  _clearing the stale lock so the user can press retry_. A timeout that clears `stepState` is
  sanctioned by the PRD; a timeout that fires a fresh Gemini call on its own violates the
  no-auto-retry rule. Keep the distinction explicit in the code.

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
- **Storage is JSON files on disk**, no database: `data/users.json`, `data/projects/*.json`,
  binaries under `data/storage/{projectId}/{portraits,illustrations}/`, rooted at
  `STORAGE_DIR`. Writes must be mutex-guarded and atomic (write-temp + rename) — overlapping
  writes are the failure mode this design has to defend against. All of `data/` is gitignored.
- **Auth is passwordless**: email + name only. Known email loads that user's projects, unknown
  email creates the user. No password, no OAuth (`PRD.md:118`). `JWT_SECRET` / `JWT_EXPIRES_IN`
  are already in `.env.example`; `jsonwebtoken` is already installed.
- **Env lives in two places.** Root `.env` and `server/.env` are byte-identical copies of
  `.env.example`; `dotenv.config()` in `server/src/index.ts` resolves against the server's cwd,
  so `server/.env` is the one that actually loads under `npm run dev`. Keep them in sync or
  collapse to one — silently divergent copies are a debugging trap.
- **Installed-but-unused deps encode the intended design**, not accidents: `jsonwebtoken`
  (auth), `multer` (`.txt` upload), `zod` (validating Gemini's structured JSON and request
  bodies), `uuid`.

### Traps in the current scaffold

- **`server/tsconfig.json` includes only `src/`,** but tests live in `server/tests/`. They run
  under vitest but are never type-checked by `npm run build`.
- **The server has no vitest config**, so it runs in the default `node` environment — correct
  for supertest, but any future DOM-ish server test needs its own config. The client has
  `client/vitest.config.ts` (jsdom + `src/test/setup.ts`).
- **Imports inside `server/src` must carry the `.js` extension** (`'./app.js'`), because the
  server is ESM with `moduleResolution: NodeNext`. Extensionless imports pass under `tsx` in dev
  and then break `node dist/index.js` in production.
- **Env accessors in `config.ts` read `process.env` lazily on every call**, so `dotenv.config()`
  at startup and per-test `STORAGE_DIR` overrides both work. Don't hoist them into module-level
  constants — tests set the env before importing the app.

## Hard requirements that constrain implementation

Graded, from `docs/spec/PRD.md`. Do not quietly relax them.

- **Caps: max 2 characters (adults only — the notebook restricts to adults on purpose) and max
  1 chapter, enforced server-side**, not just in the UI. They bound API cost.
- **Send the book text to Gemini once** and reuse it across steps (chat/session chaining or
  file upload + reference). Never re-send the full text per step.
- **Never auto-retry a Gemini call.** All retries are user-triggered.
- **Steps run in order, each on an explicit user action**, and a step cannot start until the
  prior ones succeeded.
- **Resumable**: refresh, logout, or server restart mid-step must reopen to the true state with
  no lost results.
- **No duplicate calls**: refresh, second tab, or double-click during a running step must not
  fire Gemini twice — the guard belongs on the server, not in one browser tab. The chosen
  mechanism is a `409 Conflict` when `stepState === 'RUNNING'`.
- **Retryable failures**: a failed step leaves the project usable and retries that step alone.
- **No stuck-forever state**: a step stranded "in progress" (server died mid-call) needs a
  user-reachable recovery path — no manual file surgery.
- Gemini key via env var, never committed; ship `.env.example`. Images and book text on the
  local filesystem, served through our own API — no S3/CDN.
- Out of scope, do not build: Veo animation, Lyria music, TTS narration, audiobook.

## Pipeline state model

`docs/spec/Pipeline.md` holds the per-step contract. The state shape, two fields deliberately:

- `status` — the milestone: `CREATED → STYLE_SET → CHARACTERS_GENERATED → PORTRAITS_GENERATED
→ CHAPTERS_GENERATED → DONE`
- `stepState` — execution: `IDLE` / `RUNNING` / `ERROR`, with `stepStartedAt` for stale detection

Two fields because one enum cannot express "step 3 done, step 4 currently running" — exactly
what a mid-step refresh has to read. That split is already written up as a decision in
`PRD.md:54`; the cost is two fields to keep in sync.

Step mechanics come from the notebook the PRD links, not from guesswork — sections 1–5 only:
`https://colab.research.google.com/github/google-gemini/cookbook/blob/main/examples/Book_illustration.ipynb`
Gemini REST docs: `https://ai.google.dev/gemini-api/docs`. `.env.example` and the docs name
`gemini-2.5-flash` and `imagen-3.0-generate-002`; verify both against the notebook and current
free-tier limits (tighter on the image model) before wiring them up.

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
  when a commit was mostly AI-authored — the PRD says honesty scores and hiding it doesn't.

## Working style for this repo

- **Right-sized beats thorough.** Over-engineering is explicitly penalized. Prefer the smallest
  thing that fully works; JSON files on disk are an accepted storage choice at this scope if
  isolated per user/project and safe against overlapping writes.
- **Harness first.** Improve the test/run loop as you go — the two `health.test.ts` sanity
  tests are placeholders to be replaced by the first real tests, not accumulated around.
- Mock Gemini in tests — do not burn free-tier quota, which is tighter on the image model.
- Keep `docs/tracking/Progress.md` and `docs/tracking/Files.md` current as work lands. They are
  only useful if they can be trusted; see the drift list above for what happens otherwise.
