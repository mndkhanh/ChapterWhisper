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
- [[PRD.md|docs/PRD.md]] — Full assessment requirements brief (Source of truth)
- [[Architecture.md|docs/Architecture.md]] — System architecture & data flow
- [[Progress.md|docs/Progress.md]] — Milestone tracker & roadmap
- [[DESIGN.md|docs/DESIGN.md]] — Amrit Palace visual design tokens
- [[Files.md|docs/Files.md]] — This file registry

## ⚙️ Backend Server (`server/`)
- [[server/src/index.ts]] — Express server entry point & HTTP router
- [[server/tests/health.test.ts]] — Server sanity test
- [[server/package.json]] — Server dependencies & build scripts
- [[server/tsconfig.json]] — TypeScript compiler options for Node

## 🎨 Frontend Client (`client/`)
- [[client/src/App.tsx]] — Main React application root component
- [[client/src/main.tsx]] — React DOM client entry point
- [[client/src/index.css]] — Global stylesheet & design token classes
- [[client/src/test/health.test.ts]] — Client sanity test
- [[client/index.html]] — HTML page container
- [[client/vite.config.ts]] — Vite bundler & API proxy configuration
- [[client/package.json]] — Client dependencies & scripts
- [[client/tsconfig.json]] — Client TypeScript configuration
