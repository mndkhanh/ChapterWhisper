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

| Area                   | Covered | Human check                                                                                          | The failure it's there to catch                                                                                                                  |
| ---------------------- | ------- | ---------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| Storage: lost updates  | ✅      | ☐ After the suite runs, `data/users.json` still parses as valid JSON and holds every user            | 25 overlapping read-modify-writes on one file. Without the per-file lock each read sees a stale array and the last write wins, so appends vanish |
| Storage: atomicity     | ✅      | ☐ `ls data/` shows no leftover `*.tmp` files                                                         | Temp-file-plus-rename leaves no `.tmp` litter and creates parent dirs                                                                            |
| Storage: lock recovery | ✅      | ☐ Not reachable by hand — trust the test                                                             | A mutation that throws must not wedge the queue for everyone behind it                                                                           |
| Identity: sign-up      | ✅      | ☐ Sign in with a brand-new email → a new entry appears in `data/users.json`                          | First sign-in creates the user and returns a token                                                                                               |
| Identity: sign-in      | ✅      | ☐ Sign in again with the same email in different casing → same `id` back, still one entry            | A known email returns the _same_ user id — matched case- and whitespace-insensitively — instead of creating a duplicate                          |
| Identity: races        | ✅      | ☐ Double-click the sign-in button → exactly one user created                                         | Concurrent sign-ins don't drop users; the same new email arriving 5× still yields one id                                                         |
| Identity: validation   | ✅      | ☐ Submit `not-an-email`, then a blank name → 400 both times, nothing written                         | Malformed email or blank name → 400                                                                                                              |
| Session restore        | ✅      | ☐ Refresh the browser → still signed in. Corrupt the token in devtools → signed out                  | `GET /api/auth/me` rehydrates the session after a refresh; missing, malformed, and tampered tokens → 401                                         |
| Step ordering          | ⏳      | ☐ `curl` step 4 on a project sitting at step 1 → refused                                             | Running step _n_ before step _n−1_ succeeded must be refused                                                                                     |
| Duplicate-run guard    | ⏳      | ☐ Start a step, hit run again in a second tab → 409, and the server log shows **one** Gemini call    | A second run request while `stepState === 'RUNNING'` must get 409, not a second Gemini call                                                      |
| Retry isolation        | ⏳      | ☐ Break the API key to force a failure, retry that step → earlier portraits still on screen          | Retrying a failed step must not disturb completed steps                                                                                          |
| Stranded-step recovery | ⏳      | ☐ `Ctrl-C` the server mid-step, restart, reopen the project → a retry affordance, not a dead spinner | A `RUNNING` step past the stale threshold must become retryable                                                                                  |
| Server-side caps       | ⏳      | ☐ `curl` the step directly asking for 5 characters → at most 2 come back                             | Max 2 characters and max 1 chapter enforced on the server, not just the UI                                                                       |

✅ automated and passing · ⏳ planned, pipeline not built yet

**Human check** is the manual pass a reviewer runs to confirm the behavior end to end. The
automated test proves the unit; the human check proves the product. The rows that matter most
here — refresh, second tab, server restart — are only fully convincing when a person does them.

The lost-update test was verified to fail before it was trusted: with `withFileLock` removed
from `updateJson`, `serializes overlapping read-modify-writes` fails and the other four still
pass. A concurrency test that cannot fail is decoration.

### Frontend

| Area                                           | Covered | Human check                                                                                                    | Notes                                                                          |
| ---------------------------------------------- | ------- | -------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------ |
| App renders and reports backend status         | ✅      | ☐ Open `http://localhost:3000` → header and backend status render, no console errors                           | Smoke test in jsdom                                                            |
| Login form: loading / error / empty            | ⏳      | ☐ Submit empty; submit a bad email; stop the server and submit → three distinct states, no dead button         | Not built yet                                                                  |
| Project list: empty state                      | ⏳      | ☐ Sign in as a fresh user → a real empty state, not a blank page                                               | Not built yet                                                                  |
| Step runner: in-progress and error affordances | ⏳      | ☐ Run a step → the UI names _which_ step is running. Kill the network → error plus a retry for that step alone | Not built yet — the demo has no error state to copy, so this is ours to design |

## Deliberately not tested

- **The Gemini API itself.** Not ours, and calling it costs quota. Stubbed at the boundary; what
  we test is how we behave around it — ordering, guards, persistence, retries.
- **Prompt output quality.** Non-deterministic and not verifiable by assertion. Judged by eye.
- **The Vite proxy and the build.** Config, exercised by running the app rather than asserted.
- **Cross-process locking.** The mutex is per-process and correct for a single-server
  deployment, which is the whole scope here. Two server processes on one `data/` directory would
  need file-descriptor locks — noted as a limit, not defended against.
- **`app-demo.html`.** A vendor mock and the behavior reference, not our code.

## Test run

Two real runs, pasted as emitted. The only modification is that terminal colour escape
codes were stripped (`sed 's/\x1b\[[0-9;]*m//g'`) so the text is readable in markdown —
no lines added, removed, reordered, or reworded. Timestamps differ between the two blocks
because they are two separate invocations, minutes apart.

Per-test detail, from `npx vitest run --reporter=verbose` inside `server/`:

```
 RUN  v3.2.7 D:/CODE/SideRepos/ChapterWhisper/server

 ✓ tests/health.test.ts > Server health check > passes sanity check 1ms
 ✓ tests/json-file.test.ts > json-file store > returns the fallback for a file that does not exist yet 2ms
 ✓ tests/json-file.test.ts > json-file store > creates missing parent directories on write 5ms
 ✓ tests/json-file.test.ts > json-file store > leaves no temp files behind 3ms
 ✓ tests/json-file.test.ts > json-file store > serializes overlapping read-modify-writes instead of losing them 54ms
 ✓ tests/json-file.test.ts > json-file store > keeps the queue moving after a failed update 6ms
 ✓ tests/auth.test.ts > POST /api/auth/login > creates a user on first sign-in and returns a token 47ms
 ✓ tests/auth.test.ts > POST /api/auth/login > returns the same user for a known email instead of creating a second one 41ms
 ✓ tests/auth.test.ts > POST /api/auth/login > rejects a malformed email or a blank name 9ms
 ✓ tests/auth.test.ts > POST /api/auth/login > does not lose users when sign-ins arrive concurrently 64ms
 ✓ tests/auth.test.ts > POST /api/auth/login > creates exactly one user when the same new email races itself 25ms
 ✓ tests/auth.test.ts > GET /api/auth/me > restores the session from a valid token 12ms
 ✓ tests/auth.test.ts > GET /api/auth/me > rejects a missing, malformed, or tampered token 7ms

 Test Files  3 passed (3)
      Tests  13 passed (13)
   Start at  19:23:53
   Duration  920ms (transform 124ms, setup 0ms, collect 431ms, tests 288ms, environment 1ms, prepare 476ms)
```

Both workspaces through the single root command, `npm test`:

```
> chapter-whisper@1.0.0 test
> npm run test --workspace=server && npm run test --workspace=client


> chapter-whisper-server@1.0.0 test
> vitest run


 RUN  v3.2.7 D:/CODE/SideRepos/ChapterWhisper/server

 ✓ tests/health.test.ts (1 test) 2ms
 ✓ tests/json-file.test.ts (5 tests) 61ms
 ✓ tests/auth.test.ts (7 tests) 156ms

 Test Files  3 passed (3)
      Tests  13 passed (13)
   Start at  19:23:33
   Duration  791ms (transform 135ms, setup 0ms, collect 395ms, tests 219ms, environment 1ms, prepare 438ms)


> chapter-whisper-client@1.0.0 test
> vitest run


 RUN  v3.2.7 D:/CODE/SideRepos/ChapterWhisper/client

 ✓ src/test/health.test.ts (1 test) 2ms
 ✓ src/test/App.test.tsx (1 test) 55ms

 Test Files  2 passed (2)
      Tests  2 passed (2)
   Start at  19:23:35
   Duration  1.90s (transform 54ms, setup 197ms, collect 153ms, tests 57ms, environment 2.01s, prepare 166ms)
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
