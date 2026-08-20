# ChapterWhisper

Paste or upload a book's text, then illustrate it with Gemini one step at a time —
art style → characters → character portraits → chapter scene → final illustration.

Each step runs only on an explicit click, in order, and the whole thing survives a
refresh, a logout, or a server restart mid-run.

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

Server on **http://localhost:4000**, client on **http://localhost:3000**. Open the
client. That is the only command needed to start the stack.

## Test

```bash
npm test
```

35 server tests + 32 client tests (67 total). No network, no API key, no `.env` required — the
Gemini client is mocked and the storage tests run against a temp directory, so your
real `data/` and your quota are never touched.

Single file or single test:

```bash
npm test --workspace=server -- tests/projects.test.ts
npm test --workspace=server -- -t "refuses to re-run a completed step"
```

---
## More



## More

- [`DECISIONS.md`](DECISIONS.md) — the design calls, and where the AI was overridden
- [`TESTING.md`](TESTING.md) — what is covered, what is deliberately not, real run output
- [`docs/Index.md`](docs/Index.md) — the Obsidian vault: PRD, pipeline contract, architecture
