---
title: ChapterWhisper Hub
aliases:
  - Home
  - ChapterWhisper MOC
tags:
  - chapterwhisper
  - moc
  - dashboard
type: index
status: in-progress
cssclasses:
  - dashboard
---

# 📖 ChapterWhisper — Obsidian Hub & Map of Content

Turn a book's text into character portraits and chapter illustrations with the Gemini API, five user-driven steps at a time.

```
Pipeline Flow:
Style (01) ──► Characters (02) ──► Portraits (03) ──► Chapters (04) ──► Illustrations (05)
```

---

## 🗂️ Vault Structure & Categorized Knowledge Map

### 1. Specifications & Pipeline (`docs/spec/`)
- [[PRD]] — The official assessment brief (**Source of Truth**).
- [[Pipeline]] — 5-Step Gemini pipeline mechanics, prompt schemas & server caps.

### 2. Design System (`docs/design/`)
- [[DESIGN]] — "Amrit Palace" visual reference (Warm parchment `#d8cbb8`, Saffron `#d49653`, Onyx `#2c2c2c`, serif typography).

### 3. Architecture & Data Flow (`docs/architecture/`)
- [[Architecture]] — System-level view: layers, cross-cutting state model and concurrency guards, and the index of feature notes.

### 3b. Features (`docs/features/`)
One note per feature — API surface, invariants, known limits, and the tests that cover it.
Add the note when the feature lands, and add a row to [[Architecture#Feature notes]].
- [[Storage]] — JSON-on-disk engine: per-file mutex, atomic write-rename. ✅ built
- [[Identity]] — Passwordless login, `httpOnly` session cookie, logout. ✅ built
- [[Projects]] — Create from text, list, ownership. ⏳ planned
- [[Pipeline Runner]] — Step state machine, 409 guard, retry, stranded recovery. ⏳ planned
- [[Media]] — Serving portraits and illustrations through our own API. ⏳ planned

### 4. Tracking & Registry (`docs/tracking/`)
- [[Progress]] — Milestone roadmap and interactive task checklist.
- [[Files]] — Master directory of all tracked repository files and code modules.

### 5. Graded Assessment Deliverables (Root)
- [[DECISIONS]] — 4–6 technical decisions, trade-offs & AI overrides (Required).
- [[TESTING]] — Frontend & backend testing strategy + actual test run report (Required).
- [[README]] — Reviewer guide, prerequisites, and single start/test commands (Required).
- [[CLAUDE]] — AI context & working agreement.

---

## ⚡ Active Stack & Key Decisions

- **Frontend**: React (Vite + TypeScript + Tailwind CSS with Amrit Palace theme).
- **Backend**: Node.js / Express.js (TypeScript).
- **Storage**: Local JSON files on disk (`data/`) with mutex-guarded atomic writes.
- **Harness**: Single start command (`npm run dev`) and single test command (`npm test`), both from the repo root.
- **Caps**: Max 2 characters, Max 1 chapter enforced server-side.
- **Guards**: Server-side in-flight step lock prevents duplicate Gemini calls on refresh/double-click.
