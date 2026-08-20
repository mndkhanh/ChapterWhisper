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
- [x] Single start script (`./start.sh` / `start.bat`)
- [x] Single test runner script (`./test.sh` / `test.bat`)
- [x] Obsidian vault configuration & ignore filters (`.obsidian/app.json`)
- [x] Environment configuration (`.env.example`)

## Milestone 2: Backend Architecture & Storage
- [ ] User authentication (passwordless JWT with email + name)
- [ ] Local JSON file storage engine with per-project mutex locks
- [ ] Media & file streaming storage for raw text, portraits, and illustrations
- [ ] Server-side validation for step transitions and project ownership

## Milestone 3: Gemini Pipeline & Concurrency Safety
- [ ] Gemini API integration (REST client, structured JSON schemas)
- [ ] Art style generation & custom style override (Step 1)
- [ ] Character extraction capped strictly to **max 2 adult characters** (Step 2)
- [ ] Character portrait generation & local caching (Step 3)
- [ ] Chapter extraction capped strictly to **max 1 chapter** (Step 4)
- [ ] Chapter illustration generation referencing portraits (Step 5)
- [ ] Server-side concurrency guard (blocking duplicate runs with 409)
- [ ] Stranded / stuck step timeout and recovery mechanism

## Milestone 4: Frontend UI / UX (Amrit Palace Design System)
- [ ] Tailwind CSS configuration with Amrit Palace design tokens
- [ ] Studio authentication & user session handling
- [ ] Project dashboard with step progress stepper and status badges
- [ ] New project modal supporting `.txt` file upload and text pasting
- [ ] Full book text reader modal
- [ ] Interactive 5-step manuscript pipeline screen
- [ ] Character cards with live portrait loading states
- [ ] Chapter illustration presentation
- [ ] In-progress step indicator and error retry affordance

## Milestone 5: Testing & Deliverables
- [ ] Backend tests for step ordering, state machine, caps, and retry safety
- [ ] Frontend tests for component loading, empty, and error states
- [ ] Real test run captured and recorded in [[TESTING]]
- [ ] Technical decisions and AI overrides documented in [[DECISIONS]]
- [ ] Reviewer instructions and architecture written in [[README]]
