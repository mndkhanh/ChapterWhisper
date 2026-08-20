---
title: Project File Index & Registry
aliases:
  - Files
  - Codebase Map
tags:
  - chapterwhisper
  - index
  - files
type: registry
status: active
---

# Project File Index & Registry

Complete map of all tracked source code, configuration, scripts, and documentation files across **ChapterWhisper**.

## 📁 Repository Root
- [[CLAUDE.md]] — Claude Code project guidance & instructions
- [[DECISIONS.md]] — Architectural decisions, trade-offs & AI overrides (Graded deliverable)
- [[TESTING.md]] — Frontend & Backend testing strategy + test output log (Graded deliverable)
- [[README.md]] — Project overview, start/test instructions & architecture
- [[package.json]] — Root workspace configuration & orchestration scripts
- [[app-demo.html]] — Reference interactive prototype

## 📚 Documentation & Obsidian Vault (`docs/`)
- [[Index.md|docs/Index.md]] — Main vault hub & Map of Content (MOC)
- [[PRD.md|docs/spec/PRD.md]] — Full assessment requirements brief (Source of truth)
- [[Pipeline.md|docs/spec/Pipeline.md]] — 5-step Gemini pipeline contract & prompt schemas
- [[Architecture.md|docs/architecture/Architecture.md]] — System architecture, cross-cutting rules & feature index
- [[Storage.md|docs/features/Storage.md]] — Feature: JSON storage engine, locks & atomic writes
- [[Identity.md|docs/features/Identity.md]] — Feature: passwordless auth & `httpOnly` session
- [[Projects.md|docs/features/Projects.md]] — Feature: projects API, pipeline runner & media streaming
- [[Progress.md|docs/tracking/Progress.md]] — Milestone tracker & roadmap
- [[DESIGN.md|docs/design/DESIGN.md]] — Amrit Palace visual design tokens
- [[Files.md|docs/tracking/Files.md]] — This file registry

## ⚙️ Backend Server (`server/`)
- [[server/src/index.ts]] — Server entry point: loads env, starts listening
- [[server/src/app.ts]] — Express app factory & route mounting (importable by tests)
- [[server/src/config.ts]] — Lazy env accessors (`STORAGE_DIR`, `JWT_SECRET`, `JWT_EXPIRES_IN`, `GEMINI_API_KEY`, `GEMINI_TEXT_MODEL`, `GEMINI_IMAGE_MODEL`)
- [[server/src/storage/json-file.ts]] — JSON store: per-file mutex + atomic write-rename
- [[server/src/users/user-store.ts]] — `User` model & find-or-create by email
- [[server/src/auth/jwt.ts]] — Token signing & verification
- [[server/src/auth/cookie.ts]] — `httpOnly` session cookie name, flags & max-age
- [[server/src/auth/middleware.ts]] — `requireAuth` session-cookie guard (rejects bearer headers)
- [[server/src/auth/routes.ts]] — `POST /api/auth/login`, `GET /api/auth/me`, `POST /api/auth/logout`
- [[server/src/gemini/client.ts]] — Gemini REST client (`/interactions` endpoint, structured JSON, output parsing)
- [[server/src/projects/types.ts]] — Project, StepStatus, Character, Chapter interfaces & contracts
- [[server/src/projects/project-store.ts]] — Thread-safe project JSON persistence & mutations
- [[server/src/projects/pipeline-runner.ts]] — 5-step state machine runner, step 00 anchor ingestion & concurrency guards
- [[server/src/projects/routes.ts]] — `POST /api/projects`, `GET /api/projects`, `POST /api/projects/:id/steps/:stepIndex/run`, media streaming routes
- [[server/tests/health.test.ts]] — Server sanity test
- [[server/tests/auth.test.ts]] — Identity: sign-in/sign-up, cookie flags, session restore, logout, races
- [[server/tests/json-file.test.ts]] — Storage: lost-update, atomicity, lock recovery
- [[server/tests/projects.test.ts]] — Projects & Pipeline API: step validation, step 00 anchor, auth guard
- [[server/tests/pipeline.test.ts]] — Per-step coverage 01–05 plus the graded guarantees: caps, retry, 409-while-running, media streaming, book-sent-once
- [[server/package.json]] — Server dependencies & build scripts
- [[server/.env.example]] — Server env template: `PORT`, `JWT_SECRET`, `JWT_EXPIRES_IN`, `GEMINI_API_KEY`, model ids, `STORAGE_DIR`
- [[server/tsconfig.json]] — TypeScript compiler options for Node

## 🎨 Frontend Client (`client/`)
- [[client/src/api/auth.ts]] — API client for authentication
- [[client/src/api/http.ts]] — Shared `fetch` wrapper: `ApiError` with status, credentialed same-origin calls, no timeout
- [[client/src/api/projects.ts]] — Projects & pipeline API client + `StepFailedError` (server answers 200 with a failed step)
- [[client/src/hooks/useAuth.ts]] — Auth state management hook
- [[client/src/hooks/useProjects.ts]] — Projects CRUD hook
- [[client/src/hooks/usePipeline.ts]] — Pipeline orchestration hook
- [[client/src/components/common/Toast.tsx]] — Global notification component
- [[client/src/components/layout/Header.tsx]] — Main navigation & auth status
- [[client/src/components/auth/LoginScreen.tsx]] — Authentication entry point
- [[client/src/components/library/LibraryView.tsx]] — Project management dashboard
- [[client/src/components/new-project/NewProjectView.tsx]] — Project creation wizard
- [[client/src/components/pipeline/PipelineStudio.tsx]] — Gemini pipeline orchestration
- [[client/src/components/result/ResultView.tsx]] — Generation output visualization
- [[client/src/App.tsx]] — Main React application root component
- [[client/src/main.tsx]] — React DOM client entry point
- [[client/src/types.ts]] — TypeScript interfaces for User, Project, Characters, Chapters & StepStatus
- [[client/src/index.css]] — Global stylesheet & design token classes
- [[client/src/vite-env.d.ts]] — Vite client type declarations (`import.meta.env`)
- [[client/src/test/health.test.ts]] — Client environment sanity & ApiError test
- [[client/src/test/useAuth.test.ts]] — Auth hook unit test: session hydration, login, logout & localStorage sync
- [[client/src/test/useProjects.test.ts]] — Projects hook unit test: listing, creation, validation & project loading
- [[client/src/test/usePipeline.test.ts]] — Pipeline hook: style post, 200-with-failed trap, 409 resync, locked/done guards
- [[client/src/test/LoginScreen.test.tsx]] — LoginScreen component unit test: input handlers & validation
- [[client/src/test/LibraryView.test.tsx]] — LibraryView component unit test: project progress cards & actions
- [[client/src/test/NewProjectView.test.tsx]] — NewProjectView component unit test: form inputs & ingestion state
- [[client/src/test/ResultView.test.tsx]] — ResultView component unit test: first edition plate & cast rendering
- [[client/src/test/App.test.tsx]] — Client App component test
- [[client/src/test/setup.ts]] — Client test setup with `@testing-library/jest-dom`
- [[client/index.html]] — HTML page container
- [[client/vite.config.ts]] — Vite bundler & API proxy configuration
- [[client/.env.example]] — Client env template: `BACKEND_URL`, `CLIENT_PORT`, `VITE_API_BASE`
- [[client/vitest.config.ts]] — Vitest configuration with `jsdom`
- [[client/tailwind.config.js]] — Tailwind theme: Amrit Palace palette & font stacks
- [[client/postcss.config.js]] — PostCSS pipeline wiring Tailwind + Autoprefixer
- [[client/package.json]] — Client dependencies & scripts
- [[client/tsconfig.json]] — Client TypeScript configuration
