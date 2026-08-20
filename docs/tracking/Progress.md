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
status: completed
---

# Project Progress & Roadmap

Tracking active implementation milestones, verification status, and deliverable readiness.

## Milestone 1: Harness & Scaffolding
- [x] Monorepo npm workspaces configured (`client`, `server`)
- [x] Single start command (`npm run dev`) and single test command (`npm test`)
- [x] Obsidian vault configuration & ignore filters (`.obsidian/app.json`)
- [x] Environment configuration (`.env.example`)
- [x] GitHub Actions CI pipeline running builds and multi-node test matrix on push/PR (`.github/workflows/ci.yml`)

## Milestone 2: Backend Architecture & Storage
- [x] User authentication (passwordless, email + name; JWT in an `httpOnly` cookie) — login / me / logout
- [x] Local JSON file storage engine with per-file mutex locks and atomic write-rename
- [x] Projects API (create, list, get, step state validation, ownership isolation)
- [x] Media & file streaming storage for portraits and chapter illustrations
- [x] WebSocket server (`/ws`) broadcasting real-time step progress and state updates to all connected tabs

## Milestone 3: Gemini Pipeline & Concurrency Safety
- [x] Gemini REST client (`/interactions` endpoint with context chaining)
- [x] Step 00 book ingestion (single text transmission anchor)
- [x] Step 01 art style generation & custom style override
- [x] Step 02 character extraction (strictly capped to **max 2 adults** with rich visual descriptions)
- [x] Step 03 character portrait generation via conversational image model (`gemini-3.1-flash-image`)
- [x] Step 04 chapter formulation (strictly capped to **max 1 chapter** with character awareness)
- [x] Step 05 chapter illustration generation with strict character visual consistency guidelines
- [x] Per-step execution & retry history recording (`attempts: StepAttempt[]`) with duration, timestamp, and error diagnostics
- [x] Server-side concurrency guard (blocking duplicate runs with 409)
- [x] Stranded / stuck step timeout and stale recovery (`getStepStaleMs()`)
- [x] Zero auto-retry rule (all failures require user-triggered retry)

## Milestone 4: Frontend UI / UX (Amrit Palace Design System)
- [x] Tailwind CSS configuration with Amrit Palace design tokens
- [x] Studio authentication & user session handling (`LoginScreen`)
- [x] Project dashboard with step progress stepper and status badges (`LibraryView`)
- [x] Artwork preview on completed chapter cards in Library view
- [x] Direct `✦ Present Slides` access from each chapter box in Library view
- [x] New project creation supporting `.txt` file upload and text pasting (`NewProjectView`)
- [x] Interactive 5-step manuscript pipeline runner screen (`PipelineStudio`)
- [x] Per-step attempt history drawer showing attempt number, duration, timestamp, and error logs
- [x] Chapter illustration presentation & result plate view (`ResultView`)
- [x] Fullscreen 5-slide interactive reading and artwork deck (`SlidePresentationModal`)
- [x] Real-time WebSocket hook synchronization (`usePipeline`)

## Milestone 5: Testing & Deliverables
- [x] Backend tests for identity, WebSocket upgrade/broadcast, and concurrency-safe JSON store (39 backend tests passing; 73 across both workspaces)
- [x] Backend tests for step ordering, state machine, caps, and retry safety (`projects.test.ts`, `pipeline.test.ts`, `websocket.test.ts`, `auth.test.ts`, `json-file.test.ts`)
- [x] Frontend tests for all views, hooks, presentation mode, and pipeline state machine (34 client tests passing)
- [x] Real test run captured and recorded in [[TESTING]]
- [x] Technical decisions and AI overrides documented in [[DECISIONS]]
- [x] Reviewer instructions, features, and setup written in [[README]]
- [x] Orientation and cross-cutting rules updated in [[CLAUDE.md]]
