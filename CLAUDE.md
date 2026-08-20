# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this repo is

**ChapterWhisper** is a greenfield take-home assessment (Gradion, intern fullstack). Paste or
upload a book's text, then run a 5-step Gemini pipeline one step at a time —
style → characters → portraits → chapters → illustrations.

**Current state: both sides are wired end to end.** npm workspaces + Express/TS server +
Vite/React/TS client. The server has passwordless auth, the JSON-file store, the projects API,
the Gemini Interactions client, and the whole 5-step pipeline runner with its 409 guard. The
client's data layer is real `fetch` against that API — the `localStorage` mock and the
`setTimeout` fake step runner are **gone**. What remains fake is narrower and specific; see
"What is still mocked" below before touching the pipeline screens.

`npm test` currently passes **39 server tests + 34 client tests** (73 total). Re-run it rather than trusting
any count written down here or in `Progress.md` — both rot.

## What is still mocked

The data layer, pipeline runner, real-time WebSocket sync, attempt history, and slide presentation are all fully implemented.
- **Zero hardcoded chapter lists**: `SAMPLE_CHAPTERS` and redundant pickers are removed. Step 04 renders server-generated `project.chapters` directly.
- **`DEFAULT_STYLES` in `PipelineStudio.tsx`** is client-side presets for Step 01 fail-safe art styles (recorded in `DECISIONS.md` §2).
- **Gemini API in Tests**: Tests mock `createInteraction` via `vi.mock('../src/gemini/client.js')` to protect API quotas and keep CI runs instant and hermetic without live API keys.

## The client data layer

`useAuth` was the model; the other two hooks now follow it. Read these four files before
changing anything on the client:

- **`src/api/http.ts`** — the shared `request()` plus `ApiError` (carries `status`, so callers
  branch on 401/409). `credentials: 'include'` on every call because the session is an httpOnly
  cookie. **Deliberately no `AbortSignal.timeout`**: a step run blocks for the entire Gemini
  call. `API_BASE` comes from `VITE_API_BASE` and is empty in dev so calls stay relative and
  same-origin behind the Vite proxy.
- **`src/api/projects.ts`** — `listProjects` / `getProject` / `createProject` / `runStep`, plus
  `StepFailedError`. See the 200-means-nothing trap below; that class exists to handle it in one
  place.
- **`src/hooks/useProjects.ts`** — server-backed, no `localStorage` at all. Clears on sign-out
  so the next user never sees the previous shelf; `applyProject` merges a server response back
  into the list and the server's copy always wins. Holds `onToast` in a ref so an unmemoized
  caller callback cannot re-fire the load effect.
- **`src/hooks/usePipeline.ts`** — one blocking call per run, no retry anywhere. Short-circuits
  `locked` and `done` client-side rather than spending a request to learn the answer, and on a
  409 re-fetches the project so the tab resyncs with whoever actually holds the step.

`App.tsx` composes them and derives a `displayProject`: the server's project, plus the two
browser-only selections, plus `busyStep` painted in as `running`. That last part matters — the
server persists `running` before it calls Gemini but does not respond until the call finishes,
so the *initiating* tab would otherwise show a stale status for the whole wait. Other tabs read
the real `running` from the server and get their 409.

## Work through the vault, every task

This repo's notes are not decoration — they are where the design lives. Follow this loop on
every task, before and after touching code. The vault is plain markdown on disk, so use the
normal search/read/edit tools on `docs/`; the Obsidian app is just one view of the same files.

1. **Orient.** Start at `docs/Index.md` and follow its wikilinks to the note that owns the
   topic. Do not start from the code.
2. **Search the notes first.** Grep `docs/` for the concept before grepping `server/` or
   `client/` — note titles, `aliases:`, and `tags:` in the frontmatter are the search surface.
   A decision already made lives in a note, and re-deriving it from code gets it wrong.
3. **Read the owning note in full.** `docs/features/<Feature>.md` owns whatever that feature
   does; `Pipeline.md` owns step mechanics; `Architecture.md` owns only cross-cutting rules and
   the feature index; `DESIGN.md` owns visual tokens; `PRD.md` owns everything and wins any
   conflict.
   **When you build a new feature, create its feature note** and add a row to
   `Architecture.md`'s feature table — don't grow `Architecture.md` itself.
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

Single test file or name: `npm test --workspace=server -- tests/projects.test.ts`, or
`-- -t "races itself"`. Watch mode: drop the `run` — `npx vitest` inside `server/` or `client/`.
Per-test detail for pasting into `TESTING.md`: `npx vitest run --reporter=verbose` inside the
workspace.

> `server/package.json` declares `check:step00` → `tsx scripts/step00-check.mts`, but
> **that file does not exist**, and `server/scripts/` is now empty. The script is a real
> live-Gemini smoke check worth writing (it would hit the network, so it must never be folded
> into `npm test`); until then the command just fails. Do not cite it in `README.md` as if it
> worked.

There is currently **no manuscript fixture in the repo**. One existed briefly at
`server/scripts/fixtures/lantern-corridor.txt`, was moved to `server/data/`, and is now gone
from disk — it was never committed, so it is not recoverable from git. If you add one back,
keep it out of `server/data/` (that is the live runtime store, see below) and note that nothing
in the codebase reads a fixture: it reaches the app only by hand, pasted into the New Project
box or uploaded as the `.txt`.

The suite needs no `.env` and no network. `auth.test.ts` and `json-file.test.ts` point
`STORAGE_DIR` at a fresh temp dir and set a throwaway `JWT_SECRET` before importing the app;
`projects.test.ts` does the same plus `vi.mock('../src/gemini/client.js')`, so no Gemini call
ever leaves the machine. The client tests stub `global.fetch`. Nothing touches the real `data/`.

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
| `docs/architecture/Architecture.md`       | System-level only: layer diagram, cross-cutting state model and concurrency guards, and the index of feature notes                                                              |
| `docs/features/*.md`                      | **One note per feature** — API surface, invariants, known limits, tests. `Storage.md`, `Identity.md`, `Projects.md` exist                                                       |
| `docs/design/DESIGN.md`                   | "Amrit Palace" tokens — parchment `#d8cbb8`, saffron `#d49653`, onyx `#2c2c2c`, Cormorant Garamond + Inter, 0px radius                                                         |
| `docs/tracking/Progress.md`               | Milestone checklist — 5 milestones, roughly the intended build order                                                                                                           |
| `docs/tracking/Files.md`                  | File registry; update it when adding files                                                                                                                                     |
| `app-demo.html`                           | Ships with the assessment. Standalone `localStorage` mock of the whole flow. Open it in a browser; it is the **scope and behavior floor** for the UI                           |
| `ChapterWhisper.html`                     | The Claude-designed visual mock the current React components were ported from                                                                                                  |
| `README.md`, `TESTING.md`, `DECISIONS.md` | Graded deliverables at three different stages — see below                                                                                                                      |

### Keeping the docs honest

Two rules:

- **Trust the filesystem over the note, and fix the note in the same change.** Never code
  around a stale doc.
- **`Progress.md` and `Files.md` rot first**, because they carry counts and paths. `Progress.md`
  names a passing-test count: re-run `npm test` and correct it rather than repeating it.

No known drift is outstanding right now. Re-derive it rather than trusting this line — the
tracking notes rot fastest.

Four items previously listed here are fixed, recorded so nobody re-reports them:
`Progress.md`'s false "18 passing" now reads 23 (33 across both workspaces) with the partially
covered Milestone 5 boxes annotated rather than falsely ticked; `Architecture.md`'s dead
`[[Pipeline Runner]]` and `[[Media]]` links now both point at `[[Projects]]`, which genuinely
covers all three; `Files.md` registers the client data layer; and the env template — now at
`server/.env.example`, moved out of the repo root along with its dead `.env` twin — names
`gemini-3.7-flash` / `gemini-3.1-flash-image`, matching `config.ts` (it previously named
`imagen-3.0-generate-002`, which cannot do the conversational chaining steps 03 and 05 need, so
anyone who copied the file got a broken pipeline).

Where the deliverables actually stand: `TESTING.md` is written and carries a real pasted run —
**re-run and re-paste it**, since it predates the 33-test suite. `DECISIONS.md` now holds three
real decisions in the user's own voice (cookie-vs-localStorage, preset art styles, no
regeneration of a `done` step); it needs **1–3 more** to hit the 4–6 required, and still owes
the stack + storage choice, the progress model, and the one-more-day close. `README.md` is
**written** (~140 lines): prerequisites, the `server/.env` setup trap, the single start and test
commands, a five-minute review walkthrough, a requirement-to-code mapping table, and a stated
known-gaps list.

## Architecture

```
package.json                    workspaces: [server, client]; all dev/test/build entry points
.github/workflows/ci.yml        GitHub Actions CI workflow (Node 20.x & 22.x matrix build + test)

server/   Express 4 + TS (ESM, NodeNext) + ws
  src/index.ts                  dotenv.config(), PORT, http.createServer, setupWebSocketServer, listen
  src/app.ts                    createApp(): cors → cookie-parser → json({limit:'5mb'})
                                → /api/health → /api/auth → /api/projects
  src/websocket.ts              WebSocket server: cookie auth, project subscription, real-time broadcasts
  src/config.ts                 lazy env accessors: getDataDir/getJwtSecret/getJwtExpiresIn,
                                getGeminiApiKey/getGeminiBaseUrl/getTextModel/getImageModel,
                                getStepStaleMs
  src/storage/json-file.ts      withFileLock, readJson, writeJsonAtomic, updateJson
  src/users/user-store.ts       User, normalizeEmail, findByEmail/findById/findOrCreate
  src/auth/jwt.ts               signToken / verifyToken
  src/auth/cookie.ts            SESSION_COOKIE ('cw_session'), flags, sessionMaxAgeMs()
  src/auth/middleware.ts        requireAuth — cookie only, re-reads the user from the store
  src/auth/routes.ts            login / me / logout
  src/gemini/client.ts          Interactions REST client + outputText/outputImage/JSON parsing
  src/projects/types.ts         Project, StepStatus, Character, Chapter, StepAttempt
  src/projects/events.ts        Project event bus emitting live state updates
  src/projects/project-store.ts getProject/saveProject/mutateProject/listUserProjects
  src/projects/pipeline-runner.ts  ingestBook + executeStep + attempt duration tracking + character consistency
  src/projects/routes.ts        projects CRUD, step run, portrait/illustration streaming
  data/                         runtime store (users.json, projects/, storage/)
  tests/                        vitest & supertest: auth, json-file, projects, pipeline, websocket, health

client/   Vite 6 + React 18 + TS + Tailwind 3
  src/App.tsx                   screen switch + displayProject derivation
  src/types.ts                  client mirror of server Project & StepAttempt types
  src/hooks/usePipeline.ts      step runner hook + WebSocket auto-subscription (/ws)
  src/components/library/       LibraryView with completed illustration preview & Present Slides button
  src/components/presentation/  SlidePresentationModal (5-slide fullscreen deck with keyboard nav)
  src/components/result/        ResultView (master composition plate, reading view, cast dossier)
  src/components/pipeline/      PipelineStudio (5-step atelier + per-step attempt history)
  src/api/http.ts               shared request() + ApiError
  src/api/projects.ts           projects/pipeline calls + StepFailedError
  src/api/auth.ts               login / me / logout
  src/hooks/useAuth.ts          real — fetches /api/auth/*
  src/hooks/useProjects.ts      real — server-backed, no localStorage
  src/hooks/usePipeline.ts      real — one blocking call per step, no retry
  src/components/               auth/ layout/ library/ new-project/ pipeline/ result/ common/
  src/index.css                 @tailwind directives + body base styles
  src/test/                     jsdom + Testing Library; App.test.tsx + usePipeline.test.ts
```

### Server API surface

| Method | Path                                     | Notes                                          |
| ------ | ---------------------------------------- | ---------------------------------------------- |
| POST   | `/api/auth/login`                        | `{ name, email }` → sets `cw_session` cookie   |
| GET    | `/api/auth/me`                           | 401 when not signed in                         |
| POST   | `/api/auth/logout`                       | must be a server call — cookie is `httpOnly`   |
| GET    | `/api/projects`                          | this user's projects, newest `updatedAt` first |
| POST   | `/api/projects`                          | `{ title, bookText }` → 201; runs step 00      |
| GET    | `/api/projects/:id`                      | 404 on someone else's project, not 403         |
| POST   | `/api/projects/:id/steps/:stepIndex/run` | `stepIndex` 0–4; body may carry `{ style }`    |
| GET    | `/api/projects/:id/portraits/:charId`    | streams PNG                                    |
| GET    | `/api/projects/:id/illustrations/:chId`  | streams PNG                                    |

`projectsRouter.use(requireAuth)` guards the whole router; ownership is re-checked per route
against `project.userId`. The two media routes are what `character.portraitUrl` and
`chapter.illustrationUrl` point at — the runner writes those relative paths onto the project, so
the client renders them as plain `<img src>` with no extra fetch.

### Cross-cutting rules

- **A step failure is HTTP 200, not an error status.** `executeStep` catches a thrown Gemini
  error, records it on the project (`statuses[i] = 'failed'`, `error = message`), and *returns*
  the project — so the route responds 200 and `res.ok` is worthless as a success signal. The
  real signal is `project.statuses[stepIndex]`. Only the pre-flight guards (409 done, 409
  running, 400 locked) produce non-2xx. `StepFailedError` in `client/src/api/projects.ts` is the
  single place that converts this back into a throw; keep it that way rather than re-checking
  statuses in each caller.
- **There is no module-level `app`** — `createApp()` is a factory so tests can drive it with
  supertest without binding a port. Mount new routers inside it; don't build a second app.
- **The two sides talk over a Vite proxy, not CORS, in dev.** `client/vite.config.ts` calls
  `loadEnv(mode, cwd, '')` — the empty prefix is deliberate, so unprefixed `BACKEND_URL` and
  `CLIENT_PORT` are readable in Node without being inlined into the bundle — and proxies `/api`
  → `BACKEND_URL` (default `http://localhost:4000`) for both `server` and `preview`. Shell env
  wins over the file. Client code calls relative `/api/...` paths and never hardcodes a host;
  keep it that way. `VITE_API_BASE` exists only to bypass the proxy against a deployed API and
  must stay empty in dev. The server also enables `cors({ origin: true, credentials: true })`,
  which is what makes a direct `:4000` hit work — `origin: true` reflects the caller because
  browsers refuse `*` alongside credentials. **Never put a secret in a `VITE_` var** — it ships
  to every visitor.
- **Storage is JSON files on disk**, no database: `data/users.json`, `data/projects/*.json`,
  binaries under `data/storage/{projectId}/{portraits,illustrations}/`, rooted at
  `STORAGE_DIR` — which resolves to `server/data` under `npm run dev`.
  **`data/` itself is NOT gitignored** — only `data/storage/`, `data/projects/`, and
  `data/users.json` are. Any *other* file left in `server/data/` is visible to git and gets
  swept up by `git add -A`. `lantern-corridor.txt` sits there deliberately; the directory is
  otherwise not a safe dumping ground.
- **`updateJson(file, fallback, mutate)` is the only sanctioned way to mutate a file.** It runs
  read-modify-write inside that file's lock — a per-path promise chain that survives a rejected
  holder — and writes go to `<file>.<uuid>.tmp` then `rename` over the target, which is atomic
  on both POSIX and NTFS. **Do the lookup inside the mutator, not before it**: `findOrCreate`
  does exactly that, and it is what stops two simultaneous first-time logins from creating two
  users. `mutateProject` is the projects-side wrapper — use it, not `saveProject`, for anything
  that reads-then-writes. The lock is per-process — correct for one server, not for two
  processes sharing one `data/`.
- **Auth is passwordless**: email + name only. Known email loads that user's projects, unknown
  email creates the user. No password, no OAuth (`PRD.md:118`). Email is normalized (trim +
  lowercase) and is the identity key; an existing user's stored name is never overwritten by a
  later sign-in.
- **The session is an `httpOnly` cookie** (`cw_session`), not a bearer token. Three rules that
  follow from that choice and are each covered by a test — don't undo them casually:
  the token is **never** returned in the response body; `requireAuth` reads the cookie **only**
  and ignores `Authorization: Bearer`; and **logout must be a server call**
  (`POST /api/auth/logout`), because the client physically cannot clear an `httpOnly` cookie.
  Cookie `Max-Age` is derived from `JWT_EXPIRES_IN` so browser and token expire together, and
  `secure` is set only when `NODE_ENV === 'production'` so dev over plain http keeps the cookie.
  `requireAuth` re-reads the user from the store on every request, so a token that outlives its
  user fails closed instead of authorizing a ghost. CSRF defence is `SameSite=Lax` alone — no
  CSRF token, deliberately (see `TESTING.md`). `useAuth`'s `localStorage['cw_user']` write is a
  display cache only — the cookie is the actual session.
- **Env lives beside the code that reads it.** The server's template and live file are
  `server/.env.example` and `server/.env`; `dotenv.config()` in `server/src/index.ts` resolves
  against the server's cwd, so `server/.env` is the one that loads under `npm run dev`. The
  root-level `.env`/`.env.example` duplicates were removed — they never loaded and drifted from
  the copies that did. `client/.env.example` is separate and documents the Vite-side vars.
  **Do not reintroduce a root `.env`.**
- **Installed-but-unused deps encode the intended design**, not accidents: `multer`
  (`.txt` upload — the client currently reads files with `FileReader` and posts text instead),
  `uuid`, and on the client `clsx`, `tailwind-merge`, `lucide-react`. `zod` is in use for
  request bodies; Gemini's structured JSON is currently parsed and sliced by hand in
  `pipeline-runner.ts` rather than validated with zod, which is a gap worth closing.

## Gemini integration

`server/src/gemini/client.ts` is a thin REST client for the Gemini **Interactions** API
(`POST {base}/interactions`, `x-goog-api-key` header) — not chat/`generateContent`. That choice
is what satisfies the PRD's send-the-book-once rule: `ingestBook` posts the manuscript and keeps
the returned interaction id, and every later step passes `previous_interaction_id` instead of
re-uploading the text.

The chain is stored on the project as `interactions.{ingestionId, styleId, charactersId,
portraitsId, chaptersId, illustrationId}` — each step reads the previous step's id and writes
its own. Breaking a link means a later step silently loses the book's context.

- **Everything goes through `createInteraction`,** so tests stub that one module
  (`vi.mock('../src/gemini/client.js')`) rather than intercepting HTTP. Keep new Gemini calls
  inside this module for the same reason.
- **No retry loop exists anywhere on the server**, deliberately — the PRD forbids auto-retry.
  A `GeminiError` propagates to `executeStep`, which records it on the project and stops.
- Helpers: `outputText`, `outputImage` (base64 → `Buffer`), `jsonSchemaFormat(schema)` +
  `parseJsonOutput` for structured steps. A model that answers with prose where JSON was asked
  for is a step failure, not something to repair with a regex.
- Models come from `getTextModel()` / `getImageModel()`, defaulting to `gemini-3.7-flash` and
  `gemini-3.1-flash-image` (the "Nano Banana" conversational image model — the portrait and
  illustration steps chain off the *same* interaction so the cast stays visually consistent).
- `SYSTEM_INSTRUCTIONS` at the top of `pipeline-runner.ts` (no text on the image, no cover page,
  no panels, family-friendly) is prepended to image prompts — it is the reason plates come back
  as single borderless illustrations. Don't drop it when editing prompts.

## Pipeline state model

**This changed from the two-field `status` + `stepState` design written up in `PRD.md:54`.**
The shipped shape is a five-element array, one slot per step:

```ts
statuses: StepStatus[]   // 'locked' | 'ready' | 'running' | 'done' | 'failed' | 'stale'
stepStartedAt?: number | null
error?: string | null
```

A new project starts `['ready', 'locked', 'locked', 'locked', 'locked']`. A step that succeeds
sets its own slot to `done`, clears `stepStartedAt`, and promotes the next slot from `locked`
to `ready`. This expresses "step 3 done, step 4 running" directly, which is exactly what a
mid-step refresh has to read. If you change this, update `PRD.md`/`Pipeline.md` to match rather
than re-introducing the old two-field wording.

Step indices in the API are **0–4**, mapping to steps 01–05. Ingestion is "step 00" and has no
slot — it runs inside `POST /api/projects` and is visible only as `interactions.ingestionId`.

`executeStep` is the single entry point and enforces, in order:

1. `done` → **409**. **A completed step is final and cannot be re-run.** Retries exist for
   `failed`, not for `done`. This also closes a silent bug: `runStep1Style` only calls Gemini
   when `!styleText` or `!interactionId`, so re-running a finished step 01 made no API call at
   all yet still returned 200 with `done` — and passing a *different* style override overwrote
   `project.style` while leaving `interactions.styleId` pointing at the interaction that
   registered the old style, so every downstream step chained off a style the model was never
   told about.
2. `running` and not yet stale → **409**. Staleness is `Date.now() - stepStartedAt >=
   getStepStaleMs()` (default 5 min), which merely *permits* a user-triggered retry — nothing
   in the codebase fires a call on a timer, and nothing should.
3. `locked` → **400** ("preceding step must be completed first").
4. Otherwise: mark `running` + `stepStartedAt`, clear `error`, run, and on throw mark `failed`
   with the message so the project stays usable and that one step can be retried — returned as
   **200 with a failed project**, per the cross-cutting rule above.

Because `done` is terminal, nothing invalidates downstream steps and `'stale'` is never written
as a status anywhere — it exists in the `StepStatus` union only. Staleness is always *computed*
from `stepStartedAt`.

Step mechanics come from the notebook the PRD links, not from guesswork — sections 1–5 only:
`https://colab.research.google.com/github/google-gemini/cookbook/blob/main/examples/Book_illustration.ipynb`
Gemini REST docs: `https://ai.google.dev/gemini-api/docs`

## Hard requirements that constrain implementation

Graded, from `docs/spec/PRD.md`. Do not quietly relax them.

- **Caps: max 2 characters (adults only) and max 1 chapter, enforced server-side.** Today that
  is the `.slice(0, 2)` in `runStep2Characters`, and `runStep4Chapters` asking the model for a
  single scene and storing one chapter, plus
  "only the adults" in the prompt. They bound API cost, and both are covered by
  `tests/pipeline.test.ts` (step 02 caps the cast; step 04 truncates an array answer to one
  chapter) as well as the sequential test in `projects.test.ts`.
- **Send the book text to Gemini once** and reuse it across steps. Never re-send the full text
  per step — that is what the `previous_interaction_id` chain is for.
- **Never auto-retry a Gemini call.** All retries are user-triggered.
- **Steps run in order, each on an explicit user action**, and a step cannot start until the
  prior ones succeeded.
- **Resumable**: refresh, logout, or server restart mid-step must reopen to the true state with
  no lost results.
- **No duplicate calls**: refresh, second tab, or double-click during a running step must not
  fire Gemini twice — the guard belongs on the server, not in one browser tab. The mechanism is
  a `409 Conflict` when the step's slot is `running`.
- **Retryable failures**: a failed step leaves the project usable and retries that step alone.
- **No stuck-forever state**: a step stranded "in progress" needs a user-reachable recovery
  path — no manual file surgery. A timeout that *clears* the lock so the user can press retry is
  sanctioned; a timeout that fires a fresh Gemini call on its own violates the no-auto-retry
  rule. Keep the distinction explicit in the code.
- Gemini key via env var, never committed; ship `server/.env.example`. Images and book text on the
  local filesystem, served through our own API — no S3/CDN.
- Out of scope, do not build: Veo animation, Lyria music, TTS narration, audiobook.

## Traps in the current scaffold

- **`executeStep` awaits the whole Gemini call before the HTTP response returns.** The `running`
  status is persisted first, so the cross-tab 409 guard genuinely works, but the initiating
  request blocks for 10–30s+ (longer for images). That is why `http.ts` sets no timeout; any
  move to a fire-and-poll shape must keep the write-`running`-before-returning ordering.
- **`POST /api/projects` swallows Gemini failures with an empty `catch`.** If the key is missing
  or the network is down the project is still created — just with no `interactions.ingestionId`,
  so step 01 chains from `undefined` and the model never sees the book. The client compensates
  (`createProject` returns `ingestionFailed` and `useProjects` toasts it), but the **server**
  still reports a clean 201; fixing it properly belongs on the server.
- **Steps 03 and 05 mutate objects read before the call** (`updatedChars`, `ch`) and then write
  them wholesale inside `mutateProject`, so a concurrent edit to those arrays would be lost.
  Prefer doing the merge inside the mutator, the way `findOrCreate` does.
- **`server/tsconfig.json` includes only `src/`,** but tests live in `server/tests/`. They run
  under vitest but are never type-checked by `npm run build`. The client is the opposite: its
  tests live under `client/src/test/`, which `include: ["src"]` covers, so `npm run build` does
  type-check them.
- **The server has no vitest config**, so it runs in the default `node` environment — correct
  for supertest. The client has `client/vitest.config.ts` (jsdom + globals + `src/test/setup.ts`).
- **Imports inside `server/src` must carry the `.js` extension** (`'./app.js'`), because the
  server is ESM with `moduleResolution: NodeNext`. Extensionless imports pass under `tsx` in dev
  and then break `node dist/index.js` in production. Client relative imports use `.js` too, for
  consistency.
- **Env accessors in `config.ts` read `process.env` lazily on every call**, so `dotenv.config()`
  at startup and per-test `STORAGE_DIR` overrides both work. Don't hoist them into module-level
  constants — tests set the env before importing the app.
- **Server tests set `process.env` and register `vi.mock`, then `await import('../src/app.js')`
  at top level.** Keep that shape in new server tests: a static import buries the ordering and
  leaves the suite one careless module-level `process.env` read away from breaking.
- **Six committed files start with a UTF-8 BOM** — `server/.env.example`, `client/index.html`,
  `client/postcss.config.js`, `client/tailwind.config.js`, and both `tsconfig.json`s. An
  exact-match edit against the first line of one of those has to account for it, and a rewrite
  shouldn't strip it silently. (`Index.md`, `Pipeline.md`, and `Progress.md` had one and have
  already lost it — that stripping is why those three show as modified.)
- **Both sides still carry a placeholder `health.test.ts` asserting `true === true`.** Replace
  them rather than accumulating around them; they inflate the counts above by one each.

## Reading `app-demo.html`

Cover everything it does, but it is a mock and stops short in three places that are ours to solve:

1. It never fails — there is no error state to copy.
2. Its duplicate-click guard lives in one browser tab; ours belongs server-side.
3. Its timings are fake (~2s steps, 8s stale threshold). Real calls are 10–30s+, images longer.

Do not port its `localStorage` store or its numbers. The `useProjects`/`usePipeline` hooks once
did exactly that and have since been rewritten against the API — don't reintroduce it.

## Deliverables that are graded as much as the code

- **`DECISIONS.md`** — 4–6 decisions, a heading and a paragraph each, in the user's own voice:
  who proposed it, who pushed back, where it landed, what it cost. Must include **at least 3
  places the AI was overridden** (wrong, unsafe, or overcomplicated) and must cover stack +
  storage choice, how pipeline progress is modeled, and how duplicate execution on refresh is
  stopped. Closes with a one-more-day answer. Three are written; the remaining topics are the
  stack/storage choice, the `statuses[]` progress model, and the server-side 409 guard. **This
  is the user's writeup — draft only when asked, never invent decisions that did not happen.**
- **`TESTING.md`** — written, and the pattern it sets is the one to extend: a table per side
  with an automated-coverage column *and* a "human check" column, an explicit
  deliberately-not-tested list, and real pasted run output (colour codes stripped, nothing else
  altered). Its pasted run predates the current suite — re-run and re-paste rather than editing
  the numbers by hand.
- **`README.md`** — written. Reviewer guide, prerequisites, the single start command, and the
  single test command, plus a requirements-to-code table and an honest known-gaps list. Keep the
  test counts and the known-gaps list true as the code moves.
- **Git history** — small, meaningful, incremental commits with real messages, committed as
  work happens. No single giant commit; reviewers look at timestamps. Note in the message body
  when a commit was mostly AI-authored — the PRD says honesty scores and hiding it doesn't.

## What is deliberately not tested & known gaps

1. **Live Gemini Network Calls**: All automated tests mock `createInteraction` to avoid quota exhaustion and allow hermetic CI runs without API keys. Live network latency, rate limits (HTTP 429), and quota exhaustion are not covered in `npm test`.
2. **Client-Side WebSocket Reconnect Loop**: Server WebSocket upgrade and broadcast delivery are tested in `websocket.test.ts`, but the client hook's (`usePipeline.ts`) 3-second reconnect loop on unexpected socket drop is not tested in Vitest.
3. **Isolated `PipelineStudio.test.tsx`**: Studio behavior is tested end-to-end via `App.test.tsx`, but isolated unit assertions on attempt history drawer badges (`✓ Succeeded` / `✕ Failed`) and custom style text inputs are not in a standalone component test file.
4. **Cross-Tenant Media Authorization**: `/api/projects/:id/portraits/:charId` and `/illustrations/:chId` stream files without requiring authentication cookies (designed for simple `<img src="..." />` tags without blob headers), so isolation relies on unpredictable UUID paths.
5. **Slide Presentation Empty States**: Opening the presentation modal on an empty project before Step 02 or Step 04 has completed relies on fallback labels.
6. **Non-text file upload validation**: Dropping binary files into `NewProjectView` relies on client file reader parsing.

## Working style for this repo

- **Right-sized beats thorough.** Over-engineering is explicitly penalized. Prefer the smallest
  thing that fully works; JSON files on disk are an accepted storage choice at this scope if
  isolated per user/project and safe against overlapping writes.
- **Harness first.** Improve the test/run loop as you go.
- **Write tests that can fail.** The lost-update test was verified by deleting `withFileLock`
  from `updateJson` and watching it go red. A concurrency test that passes either way is
  decoration. `projects.test.ts` covers the auth guard, creation, the locked-step 400, the
  terminal-`done` 409, and retry-after-failure; the **409 duplicate-run guard while a step is
  actually `running`** and the **caps** are covered by `tests/pipeline.test.ts`, which also
  covers steps 01–05 individually, the media-streaming routes, retry-after-failure, ownership
  isolation, and the send-the-book-once chain. The 409-while-running test was verified by
  disabling the guard and watching it go red (200 instead of 409) — keep it falsifiable.
- Mock Gemini in tests — do not burn free-tier quota, which is tighter on the image model.
- Keep `docs/tracking/Progress.md` and `docs/tracking/Files.md` current as work lands. They are
  only useful if they can be trusted.
