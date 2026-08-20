---
title: System Architecture & Data Flow
aliases:
  - Architecture
  - System Design
tags:
  - chapterwhisper
  - architecture
  - backend
  - frontend
type: spec
status: active
---

# System Architecture & Data Flow

The system-level view: layers, cross-cutting rules, and where each feature lives. **Per-feature
detail belongs in the feature notes below, not here** — this note stays readable as the app grows.

```
┌──────────────────────────────────────────────────────────┐
│                      Client Layer                        │
│   React (Vite + TypeScript + Tailwind "Amrit Palace")    │
└────────────────────────────┬─────────────────────────────┘
                             │  REST / JSON  ·  httpOnly session cookie
┌────────────────────────────▼─────────────────────────────┐
│                      Server Layer                        │
│   Node.js (Express + TypeScript)                         │
│   ├─ Auth Controller & Session Guard                     │
│   ├─ Project Controller & In-Flight Concurrency Guard    │
│   ├─ Pipeline State Machine (Steps 1–5 Runner)           │
│   └─ File & Media Streaming Controller                   │
└────────────────────────────┬─────────────────────────────┘
                             │
            ┌────────────────┴────────────────┐
            ▼                                 ▼
┌───────────────────────┐         ┌───────────────────────┐
│     Gemini API        │         │   Local File Storage  │
│  - gemini-2.5-flash   │         │   - data/users.json   │
│  - imagen-3.0-gen-002 │         │   - data/projects/*.json
│  - Context caching    │         │   - data/storage/*/   │
└───────────────────────┘         └───────────────────────┘
```

## Feature notes

Each feature owns its own note: API surface, invariants, known limits, and the tests that cover
it. Add a row here when a new feature note is created.

| Feature | Status | Note |
| --- | --- | --- |
| Storage engine — JSON on disk, locks, atomic writes | ✅ built | [[Storage]] |
| Identity & session — passwordless login, `httpOnly` cookie | ✅ built | [[Identity]] |
| Projects — create from pasted/uploaded text, list, ownership | ✅ built | [[Projects]] |
| Pipeline runner — step state machine, guards, retry, recovery | ✅ built | [[Projects]] |
| Real-time WebSocket — live step synchronization across tabs (`/ws`) | ✅ built | [[Projects]] |
| Media delivery — serving portraits and illustrations through our API | ✅ built | [[Projects]] |
| Slide Presentation Mode — 5-slide interactive reading deck & cards | ✅ built | [[Projects]] |
| Client feedback — loading, empty, in-progress and error states | ✅ built | [[Feedback States]] |

The step-by-step Gemini contract (models, prompts, JSON schemas, output paths) lives in
[[Pipeline]], which is a spec rather than a feature note — it is derived from the cookbook and
does not change as our code changes.

## Cross-cutting: state model

One slot per step, deliberately. A single milestone enum cannot express "step 3 done, step 4
currently running" — which is exactly what a mid-step refresh has to read.

```ts
statuses: StepStatus[]   // 'locked' | 'ready' | 'running' | 'done' | 'failed' | 'stale'
stepStartedAt?: number | null
error?: string | null
```

- A new project starts `['ready', 'locked', 'locked', 'locked', 'locked']`.
- A step that succeeds sets its own slot to `done`, clears `stepStartedAt`, and promotes the
  next slot from `locked` to `ready`.
- `done` is terminal, so nothing invalidates downstream steps. `'stale'` is consequently never
  *written*: staleness is always computed from `stepStartedAt`.
- Step indices in the API are 0–4. Ingestion is "step 00", has no slot, runs inside
  `POST /api/projects`, and is visible only as `interactions.ingestionId`.

> [!warning] The two-field `status` + `stepState` shape was never a requirement
> It appears in [[PRD]] §2.1 only as a **sample `DECISIONS.md` entry** — an illustration of how
> to write a decision up, not a spec of our state model. Nothing in the brief asks for it, and
> nothing in the codebase implements it. `server/src/projects/types.ts` is the authority; read
> `statuses[]` anywhere that sample is mistaken for a contract.

## Cross-cutting: concurrency & reliability guards

- **Duplicate call guard.** While `statuses[stepIndex] === 'running'`, further run requests for that
  project return **409 Conflict**. This lives on the server, not in one browser tab, so a
  refresh, a second tab, and a double-click are all covered.
- **Crash recovery.** A mid-step server restart or browser refresh preserves the exact state and
  offers a user-triggered retry without losing completed results.
- **Stale runs clear the lock, they do not re-fire.** A `running` step past the stale threshold
  becomes retryable by the user. A timeout that clears the slot is sanctioned; a timeout that
  starts a fresh Gemini call on its own would violate the no-auto-retry rule in [[PRD]] §4.3.

Related: [[Index]] · [[PRD]] · [[Pipeline]] · [[Progress]]
