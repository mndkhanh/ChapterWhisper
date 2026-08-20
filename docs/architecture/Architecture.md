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

High-level architecture for **ChapterWhisper**, designed for minimal overhead, strong concurrency safety, and full pipeline resumability.

```
┌──────────────────────────────────────────────────────────┐
│                      Client Layer                        │
│   React (Vite + TypeScript + Tailwind "Amrit Palace")    │
└────────────────────────────┬─────────────────────────────┘
                             │  REST / JSON (JWT Auth)
┌────────────────────────────▼─────────────────────────────┐
│                      Server Layer                        │
│   Node.js (Express + TypeScript)                         │
│   ├─ Auth Controller & JWT Verification                  │
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

## 1. Storage & State Model

- **Zero Database Dependency**: Uses local JSON files on disk (`data/`), safe against concurrent writes via file mutex locks and atomic write-rename patterns.
- **State Decomposition**:
  - `status`: Discrete milestone (`CREATED` → `STYLE_SET` → `CHARACTERS_GENERATED` → `PORTRAITS_GENERATED` → `CHAPTERS_GENERATED` → `DONE`).
  - `stepState`: Execution state (`IDLE`, `RUNNING`, `ERROR`).
  - `stepStartedAt`: Timestamp for detecting and auto-recovering stranded/stale runs (> 2 minutes).

## 2. Gemini Pipeline Constraints (Enforced Server-Side)

1. **Step 1 (Style)**: Text analysis or custom user style.
2. **Step 2 (Characters)**: Max **2 adult characters** extracted with structured JSON schema.
3. **Step 3 (Portraits)**: Sequential portrait image generation for identified characters.
4. **Step 4 (Chapters)**: Max **1 chapter** prompt extracted referencing character visuals.
5. **Step 5 (Illustrations)**: Scene composition illustration generated referencing character portraits.

## 3. Concurrency & Reliability Guards

- **Duplicate Call Guard**: When `stepState === 'RUNNING'`, all subsequent requests to run steps return `409 Conflict`, preventing duplicate Gemini API calls from double-clicks or multiple tabs.
- **Crash Recovery**: Mid-step server restarts or browser refreshes preserve the exact state and provide a user-triggerable step retry without losing existing progress.
