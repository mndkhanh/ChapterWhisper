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
- [[.env.example]] — Environment variables template
- [[app-demo.html]] — Reference interactive prototype

## 📚 Documentation & Obsidian Vault (`docs/`)
- [[Index.md|docs/Index.md]] — Main vault hub & Map of Content (MOC)
- [[PRD.md|docs/spec/PRD.md]] — Full assessment requirements brief (Source of truth)
- [[Pipeline.md|docs/spec/Pipeline.md]] — 5-step Gemini pipeline contract & prompt schemas
- [[Architecture.md|docs/architecture/Architecture.md]] — System architecture & data flow
- [[Progress.md|docs/tracking/Progress.md]] — Milestone tracker & roadmap
- [[DESIGN.md|docs/design/DESIGN.md]] — Amrit Palace visual design tokens
- [[Files.md|docs/tracking/Files.md]] — This file registry

## ⚙️ Backend Server (`server/`)
- [[server/src/index.ts]] — Server entry point: loads env, starts listening
- [[server/src/app.ts]] — Express app factory & route mounting (importable by tests)
- [[server/src/config.ts]] — Lazy env accessors (`STORAGE_DIR`, `JWT_SECRET`, `JWT_EXPIRES_IN`)
- [[server/src/storage/json-file.ts]] — JSON store: per-file mutex + atomic write-rename
- [[server/src/users/user-store.ts]] — `User` model & find-or-create by email
- [[server/src/auth/jwt.ts]] — Token signing & verification
- [[server/src/auth/middleware.ts]] — `requireAuth` bearer-token guard
- [[server/src/auth/routes.ts]] — `POST /api/auth/login`, `GET /api/auth/me`
- [[server/tests/health.test.ts]] — Server sanity test
- [[server/tests/auth.test.ts]] — Identity: sign-in/sign-up, session restore, races
- [[server/tests/json-file.test.ts]] — Storage: lost-update, atomicity, lock recovery
- [[server/package.json]] — Server dependencies & build scripts
- [[server/tsconfig.json]] — TypeScript compiler options for Node

## 🎨 Frontend Client (`client/`)
- [[client/src/App.tsx]] — Main React application root component
- [[client/src/main.tsx]] — React DOM client entry point
- [[client/src/index.css]] — Global stylesheet & design token classes
- [[client/src/test/health.test.ts]] — Client sanity test
- [[client/src/test/App.test.tsx]] — Client App component test
- [[client/src/test/setup.ts]] — Client test setup with `@testing-library/jest-dom`
- [[client/index.html]] — HTML page container
- [[client/vite.config.ts]] — Vite bundler & API proxy configuration
- [[client/vitest.config.ts]] — Vitest configuration with `jsdom`
- [[client/package.json]] — Client dependencies & scripts
- [[client/tsconfig.json]] — Client TypeScript configuration
