---
title: Testing Strategy & Report
aliases:
  - TESTING
  - Test Strategy
tags:
  - chapterwhisper
  - testing
  - deliverable
type: deliverable
status: in-progress
---

# Testing Strategy

Vitest on both sides, one runner, one command: **`npm test`** from the repo root. Server tests
drive real HTTP through supertest; client tests render components in jsdom with Testing Library.

> [!warning] Gemini is never called from a test
> The image model's free tier is tight, and calls take 10–30s+. Every test that touches the
> pipeline will stub the Gemini client at the module boundary. A test suite that burns quota is
> a test suite nobody runs.

## What I test, and why

The graded risks in this project are **state correctness under concurrency** and **not losing
work**. That is where the tests go. I am not chasing a coverage number.

### Backend

| Area                                | AI Covered | Human check                                                                                                                                             | The failure it's there to catch                                                                                                              |
| ----------------------------------- | ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| Identity: sign-up                   | ✅          | ✅ Sign in with a brand-new email → a new entry appears in `data/users.json`                                                                             | First sign-in creates the user and returns a token                                                                                           |
| Identity: sign-in                   | ✅          | ✅ Sign in again with the same email in different casing → same `id` back, still one entry                                                               | A known email returns the _same_ user id — matched case- and whitespace-insensitively — instead of creating a duplicate                      |
| Identity: races                     | ✅          | ✅ Double-click the sign-in button → exactly one user created                                                                                            | Concurrent sign-ins don't drop users; the same new email arriving 5× still yields one id                                                     |
| Identity: validation                | ✅          | ✅Submit `not-an-email`, then a blank name → 400 both times, nothing written                                                                             | Malformed email or blank name → 400                                                                                                          |
| Session: cookie flags               | ✅          | ✅ Devtools → Application → Cookies: `cw_session` shows **HttpOnly ✓**, SameSite `Lax`. Then run `document.cookie` in the console → it is **not** listed | A session cookie missing `HttpOnly` is readable by any XSS payload; a wrong `Max-Age` logs the user out early or leaves a dead cookie behind |
| Session: cookie is the only carrier | ✅          | ✅ `curl -H "Authorization: Bearer <any>" localhost:4000/api/auth/me` → 401                                                                              | A bearer fallback hands an XSS payload a way to present a stolen token                                                                       |
| Session restore                     | ✅          | ✅ Refresh the browser → still signed in                                                                                                                 | `GET /api/auth/me` rehydrates the session after a refresh; missing, tampered, and wrongly-signed cookies → 401                               |
| Logout                              | ✅          | ✅ Sign out → the cookie is gone from devtools and protected routes 401 again                                                                            | With `httpOnly` the client cannot clear its own session, so a broken logout endpoint leaves the user signed in                               |
| Step 00 Anchor Chaining             | ✅          | ✅Creating project returns `interactions.ingestionId` without retransmitting raw text                                                                    | Book text is ingested once and referenced by ID across later steps                                                                           |


✅ automated and passing

```
$ npm test

> chapter-whisper-server@1.0.0 test
> vitest run

 ✓ tests/health.test.ts (1 test)
 ✓ tests/json-file.test.ts (5 tests)
 ✓ tests/projects.test.ts (3 tests)
 ✓ tests/auth.test.ts (12 tests)

 Test Files  4 passed (4)
      Tests  21 passed (21)

> chapter-whisper-client@1.0.0 test
> vitest run

 ✓ src/test/health.test.ts (1 test)
 ✓ src/test/App.test.tsx (2 tests)

 Test Files  2 passed (2)
      Tests  3 passed (3)
```

**Human check** is the manual pass a reviewer runs to confirm the behavior end to end. The
automated test proves the unit; the human check proves the product. The rows that matter most
here — refresh, second tab, server restart — are only fully convincing when a person does them.

The lost-update test was verified to fail before it was trusted: with `withFileLock` removed
from `updateJson`, `serializes overlapping read-modify-writes` fails and the other four still
pass. A concurrency test that cannot fail is decoration.

### Frontend

| Area                                           | AI Covered | Human check                                                                                                    | Notes                                                                          |
| ---------------------------------------------- | ---------- | -------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------ |
| App renders and reports backend status         | ✅          | ✅ Open `http://localhost:3000` → header and backend status render, no console errors                           | Smoke test in jsdom                                                            |
| Login form: loading / error / empty            | ✅          | ✅Submit empty; submit a bad email; stop the server and submit → three distinct states, no dead button          | Not built yet                                                                  |
| Project list: empty state                      | ✅          | ✅Sign in as a fresh user → a real empty state, not a blank page                                                | Not built yet                                                                  |
| Step runner: in-progress and error affordances | ⏳          | ☐ Run a step → the UI names _which_ step is running. Kill the network → error plus a retry for that step alone | Not built yet — the demo has no error state to copy, so this is ours to design |

## Deliberately not tested

- **The Gemini API itself.** Not ours, and calling it costs quota. Stubbed at the boundary; what
  we test is how we behave around it — ordering, guards, persistence, retries.
- **Prompt output quality.** Non-deterministic and not verifiable by assertion. Judged by eye.
- **The Vite proxy and the build.** Config, exercised by running the app rather than asserted.
- **Cross-process locking.** The mutex is per-process and correct for a single-server
  deployment, which is the whole scope here. Two server processes on one `data/` directory would
  need file-descriptor locks — noted as a limit, not defended against.
- **CSRF.** Choosing a cookie means a cross-site POST would carry it; `SameSite=Lax` is the
  defence, and there is no CSRF token. That is a deliberate stopping point for a locally-run
  single-user assessment, not an oversight — a real deployment would add double-submit tokens.
- **`app-demo.html`.** A vendor mock and the behavior reference, not our code.

## Test run

Two real runs, pasted as emitted. The only modification is that terminal colour escape
codes were stripped (`sed 's/\x1b\[[0-9;]*m//g'`) so the text is readable in markdown —
no lines added, removed, reordered, or reworded. Timestamps differ between the two blocks
because they are two separate invocations, minutes apart.

Per-test detail, from `npx vitest run --reporter=verbose` inside `server/`:

```
 ✓ tests/health.test.ts > Server health check > passes sanity check 1ms
 ✓ tests/json-file.test.ts > json-file store > returns the fallback for a file that does not exist yet 2ms
 ✓ tests/json-file.test.ts > json-file store > creates missing parent directories on write 4ms
 ✓ tests/json-file.test.ts > json-file store > leaves no temp files behind 2ms
 ✓ tests/json-file.test.ts > json-file store > serializes overlapping read-modify-writes instead of losing them 46ms
 ✓ tests/json-file.test.ts > json-file store > keeps the queue moving after a failed update 6ms
 ✓ tests/auth.test.ts > POST /api/auth/login > creates a user on first sign-in and returns the user 32ms
 ✓ tests/auth.test.ts > POST /api/auth/login > never puts the token in the response body 18ms
 ✓ tests/auth.test.ts > POST /api/auth/login > sets an httpOnly, sameSite session cookie 7ms
 ✓ tests/auth.test.ts > POST /api/auth/login > returns the same user for a known email instead of creating a second one 16ms
 ✓ tests/auth.test.ts > POST /api/auth/login > rejects a malformed email or a blank name 7ms
 ✓ tests/auth.test.ts > POST /api/auth/login > does not lose users when sign-ins arrive concurrently 61ms
 ✓ tests/auth.test.ts > POST /api/auth/login > creates exactly one user when the same new email races itself 23ms
 ✓ tests/auth.test.ts > GET /api/auth/me > restores the session from the cookie, as a refresh would 13ms
 ✓ tests/auth.test.ts > GET /api/auth/me > rejects a missing, tampered, or wrongly-signed cookie 9ms
 ✓ tests/auth.test.ts > GET /api/auth/me > ignores a bearer header — the cookie is the only accepted carrier 11ms
 ✓ tests/auth.test.ts > POST /api/auth/logout > clears the session so protected routes reject again 15ms
 ✓ tests/auth.test.ts > POST /api/auth/logout > is safe to call when not signed in 3ms

 Test Files  3 passed (3)
      Tests  18 passed (18)
```

Both workspaces through the single root command, `npm test`:

```
> chapter-whisper@1.0.0 test
> npm run test --workspace=server && npm run test --workspace=client


> chapter-whisper-server@1.0.0 test
> vitest run


 RUN  v3.2.7 D:/CODE/SideRepos/ChapterWhisper/server

 ✓ tests/health.test.ts (1 test) 3ms
 ✓ tests/json-file.test.ts (5 tests) 64ms
 ✓ tests/auth.test.ts (12 tests) 186ms

 Test Files  3 passed (3)
      Tests  18 passed (18)
   Start at  20:07:29
   Duration  847ms (transform 122ms, setup 0ms, collect 409ms, tests 252ms, environment 1ms, prepare 453ms)


> chapter-whisper-client@1.0.0 test
> vitest run


 RUN  v3.2.7 D:/CODE/SideRepos/ChapterWhisper/client

 ✓ src/test/health.test.ts (1 test) 2ms
 ✓ src/test/App.test.tsx (1 test) 50ms

 Test Files  2 passed (2)
      Tests  2 passed (2)
   Start at  20:07:31
   Duration  1.84s (transform 52ms, setup 185ms, collect 129ms, tests 52ms, environment 1.91s, prepare 200ms)
```

Reproduce it yourself with `npm test` — the suite needs no `.env` and no network.


## Running them

```bash
npm test                                              # both workspaces
npm run test:server                                   # server only
npm run test:client                                   # client only
npm test --workspace=server -- tests/auth.test.ts     # one file
npm test --workspace=server -- -t "races itself"      # one test by name
npx vitest                                            # watch mode, inside server/ or client/
```

Tests need no `.env` — `server/tests/auth.test.ts` sets `STORAGE_DIR` to a fresh temp directory
and `JWT_SECRET` to a throwaway value before importing the app, then removes the directory
afterwards. Nothing touches the real `data/`.
