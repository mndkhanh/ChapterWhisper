# ChapterWhisper

Paste or upload a book's text, then illustrate it with Gemini one step at a time —
art style → characters → character portraits → chapter scene → final illustration.

Each step runs only on an explicit click, in order, and the whole thing survives a
refresh, a logout, or a server restart mid-run.

---

## Highlights & Features

- **Sequential 5-Step Pipeline** — Ingest once, then chain Gemini interactions (`previous_interaction_id`).
- **Real-Time Step Updates (WebSocket)** — Two-way WebSocket channel (`ws://localhost:4000/ws`) keeps multi-tab and concurrent client state synchronized with zero polling.
- **Per-Step Attempt & Execution History** — Tracks execution timestamps, durations, success pills, and retry error logs per step.
- **Slide-Like Presentation Mode** — Interactive full-screen reader and slide deck (`✦ Present Chapter Slides`) showcasing the prologue, character dossier, scene formulation, masterwork composition plate, and side-by-side illustrated reading spread.
- **CI Pipeline (GitHub Actions)** — Automated build, type-check, and multi-version Node.js test runs on every push and pull request.

---

## Prerequisites

| Need | Version |
| --- | --- |
| Node.js | 20+ (developed on 22.14) |
| npm | 10+ (developed on 11.6) — workspaces are required |
| Gemini API key | https://aistudio.google.com/apikey |

## Setup

```bash
npm install                        # from the repo root — installs both workspaces
cp server/.env.example server/.env
```

Then open `server/.env` and set `GEMINI_API_KEY` to your key.

## Run

```bash
npm run dev
```

Server on **http://localhost:4000** (HTTP + WebSocket), client on **http://localhost:3000**. Open the
client. That is the only command needed to start the stack.

## Test

```bash
npm test
```

**39 server tests + 34 client tests (73 total)**. No network, no API key, no `.env` required — the
Gemini client is mocked and the storage tests run against a temp directory, so your
real `data/` and your quota are never touched.

Single file or single test:

```bash
npm test --workspace=server -- tests/projects.test.ts
npm test --workspace=server -- -t "refuses to re-run a completed step"
```

---

## More

- [`DECISIONS.md`](DECISIONS.md) — the design calls, and where the AI was overridden
- [`TESTING.md`](TESTING.md) — what is covered, what is deliberately not, real run output
- [`docs/Index.md`](docs/Index.md) — the Obsidian vault: PRD, pipeline contract, architecture
