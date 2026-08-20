---
title: Project Progress & Milestone Tracker
aliases:
  - Progress
  - Roadmap
tags:
  - chapterwhisper
  - roadmap
  - tracking
type: tracker
status: in-progress
---

# Project Progress & Roadmap

Tracking active implementation milestones, verification status, and deliverable readiness.

## Milestone 1: Harness & Scaffolding
- [x] Monorepo npm workspaces configured (`client`, `server`)
- [x] Single start command (`npm run dev`) and single test command (`npm test`)
- [x] Obsidian vault configuration & ignore filters (`.obsidian/app.json`)
- [x] Environment configuration (`.env.example`)

## Milestone 2: Backend Architecture & Storage
- [x] User authentication (passwordless, email + name; JWT in an `httpOnly` cookie) — login / me / logout
- [x] Local JSON file storage engine with per-file mutex locks and atomic write-rename
- [x] Projects API (create, list, get, step state validation, ownership isolation)
- [x] Media & file streaming storage for portraits and chapter illustrations

## Milestone 3: Gemini Pipeline & Concurrency Safety
- [x] Gemini REST client (`/interactions` endpoint with context chaining)
- [x] Step 00 book ingestion (single text transmission anchor)
- [x] Step 01 art style generation & custom style override
- [x] Step 02 character extraction (strictly capped to **max 2 adults**)
- [x] Step 03 character portrait generation via conversational image model (`gemini-3.1-flash-image`)
- [x] Step 04 chapter extraction (strictly capped to **max 1 chapter**)
- [x] Step 05 chapter illustration generation with multi-image conditioning
- [x] Server-side concurrency guard (blocking duplicate runs with 409)
- [x] Stranded / stuck step timeout and stale recovery (`getStepStaleMs()`)
- [x] Zero auto-retry rule (all failures require user-triggered retry)

## Milestone 4: Frontend UI / UX (Amrit Palace Design System)
- [x] Tailwind CSS configuration with Amrit Palace design tokens
- [x] Studio authentication & user session handling (`LoginScreen`)
- [x] Project dashboard with step progress stepper and status badges (`LibraryView`)
- [x] New project creation supporting `.txt` file upload and text pasting (`NewProjectView`)
- [x] Interactive 5-step manuscript pipeline runner screen (`PipelineStudio`)
- [x] Character cards with live adult cap callout and portrait loading states
- [x] Chapter illustration presentation & result plate view (`ResultView`)
- [x] In-progress step indicator, state machines, and retry affordances

## Milestone 5: Testing & Deliverables
- [x] Backend tests for identity and the concurrency-safe JSON store (23 backend tests passing; 33 across both workspaces)
- [ ] Backend tests for step ordering, state machine, caps, and retry safety — `projects.test.ts` covers ordering (locked 400), the terminal-`done` 409, and retry-after-failure; **the caps are still untested**
- [ ] Frontend tests for component loading, empty, and error states — `usePipeline.test.ts` covers the hook's failed/409/locked/done paths; component-level loading and empty states are still uncovered
- [x] Real test run captured and recorded in [[TESTING]]
- [ ] Technical decisions and AI overrides documented in [[DECISIONS]]
- [ ] Reviewer instructions and architecture written in [[README]]
