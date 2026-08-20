---
title: Projects & Pipeline Runner
aliases:
  - Projects
  - Pipeline Runner
tags:
  - chapterwhisper
  - feature
  - backend
  - pipeline
type: feature
status: built
---

# Projects & Pipeline Runner

Manages manuscript projects, step progression state machine, conversational Gemini chaining, WebSocket real-time updates, and asset storage. Implements Milestone 2 & 3 of [[Progress]].

## API Surface

| Endpoint | Method / Protocol | Purpose |
| --- | --- | --- |
| `/api/projects` | GET | List all projects belonging to the authenticated user |
| `/api/projects` | POST | Create a new project, ingest book text once (Step 00 anchor) |
| `/api/projects/:id` | GET | Retrieve full project details, attempt history & step statuses |
| `/api/projects/:id/steps/:stepIndex/run` | POST | Execute step 0..4 against Gemini with optional custom style override |
| `/api/projects/:id/portraits/:charId` | GET | Stream character portrait PNG image |
| `/api/projects/:id/illustrations/:chId` | GET | Stream chapter illustration plate PNG image |
| `/ws` | WebSocket | Full-duplex real-time synchronization of step execution & project updates |

---

## The 5-Step Pipeline State Machine

Every project tracks a 5-element array `statuses: StepStatus[]` (`'locked'` | `'ready'` | `'running'` | `'done'` | `'failed'` | `'stale'`).

1. **Step 00 — Manuscript Ingestion**: Executed automatically upon project creation. The full manuscript is transmitted once to establish `interactions.ingestionId`.
2. **Step 01 — Art Style**: Analyzes narrative tone, genre, and mood to establish visual language, or registers a custom user style override. Unlocks Step 2.
3. **Step 02 — Characters**: Extracts primary adult characters with detailed visual traits (strictly enforced to **max 2 adults**). Unlocks Step 3.
4. **Step 03 — Portraits**: Generates individual character portraits using `gemini-3.1-flash-image` (Nano Banana conversational model) and caches PNG binaries in `data/storage/{projectId}/portraits/`. Unlocks Step 4.
5. **Step 04 — Chapter Scene**: Formulates detailed chapter illustration prompt with character consistency (strictly enforced to **max 1 chapter**). Unlocks Step 5.
6. **Step 05 — Illustration Plate**: Synthesizes the final composition plate referencing established style and character visuals, saving to `data/storage/{projectId}/illustrations/`. Project complete.

---

## Real-Time Updates & Execution History

- **WebSocket Sync (`/ws`)**: Authenticates via `cw_session` cookie; immediately broadcasts `project_updated` events when steps start, finish, or fail. Multiple browser tabs stay in perfect sync without polling.
- **Per-Step Attempt History (`attempts: StepAttempt[]`)**: Records start timestamp, completion timestamp, duration in milliseconds, status (`done`/`failed`), and error diagnostics for every run.
- **Slide-Like Presentation Mode**: Dedicated 5-slide interactive reading and artwork deck accessible from both the Result view and each chapter card in the Library.

---

## Concurrency & Safety Invariants

- **Single Text Transmission**: Raw book text is only uploaded in Step 00. Later steps chain `previous_interaction_id` to eliminate repetitive token transmission.
- **Completed Steps Are Final**: A step whose status is `done` returns **409 Conflict** and is never re-run. Regeneration is deliberately not offered — a finished plate is not spent again.
- **Duplicate Run Guard**: If a step is currently running, any duplicate execution request returns **409 Conflict**.
- **Lock Ordering Guard**: Calling step *n* before step *n-1* is completed returns **400 Bad Request**.
- **No Auto-Retries**: All step failures mark the step `failed` with the error message and wait for user-driven retry.
- **Stranded Step Recovery**: Steps running longer than `STEP_STALE_MS` (default 5 minutes) are considered stale and can be safely retried.
- **Thread-Safe Mutex**: Every project mutation runs inside `withFileLock` and writes via atomic rename.
