---
title: ChapterWhisper
aliases:
  - Home
  - ChapterWhisper MOC
tags:
  - chapterwhisper
  - moc
type: index
status: not-started
cssclasses:
  - dashboard
---

# ChapterWhisper

Turn a book's text into character portraits and a chapter illustration with the Gemini API, five user-driven steps at a time.

> [!abstract] Where things stand
> Docs only. No stack chosen, no source, no build or test commands yet. `DECISIONS.md` and `TESTING.md` exist but are empty.

## The pipeline

`Style → Characters → Portraits → Chapters → Illustrations`

Each step needs an explicit user action and cannot start until the previous one succeeded. Mechanics come from the reference notebook, not from guesswork — see [[PRD#03 · The Reference Pipeline|§03]].

## Notes in this vault

- [[PRD]] — the assessment brief. **Source of truth**; read before any design call.
- [[DESIGN]] — Amrit Palace style reference. Status `unconfirmed` — see [[#Open questions]].
- [[app-demo.html]] — the mock that ships with the brief. Open it in a browser; it is the behavior floor for the UI.
- [[README]] — reviewer's entry point. Empty.
- [[CLAUDE]] — working agreement for Claude Code.
- [[DECISIONS]] — graded deliverable. Empty.
- [[TESTING]] — graded deliverable. Empty.

## Hard constraints

Full detail in [[PRD]]. These are graded, so do not quietly relax them.

> [!danger] Cost discipline
> Max **2 characters**, max **1 chapter**, enforced server-side. Send the book text to Gemini **once** and reuse it across steps. Never auto-retry a Gemini call — retries are user-triggered only. See [[PRD#4.3 Pipeline behavior|§4.3]].

> [!warning] Correctness the reviewer will actually test
> Resumable across refresh, logout, and server restart. No duplicate Gemini call from a refresh, a second tab, or a double-click — the guard belongs server-side, not in one browser tab. A failed step is retryable on its own. A step stranded mid-call has a user-reachable recovery path.

> [!note] Right-sized beats thorough
> Over-engineering is explicitly penalized. JSON files on disk are an accepted storage choice at this scope, if isolated per user/project and safe against overlapping writes. See [[PRD#05 · Technical Requirements|§05]].

## Deliverables

- [ ] `README.md` — one start command, one test command, prerequisites, env vars, architecture overview
- [ ] [[DECISIONS]] — 4–6 decisions, ≥3 AI overrides, plus the one-more-day answer
- [ ] [[TESTING]] — FE + BE strategy and a **real** test run's output
- [ ] `.env.example` — required env vars, no real secrets
- [ ] Start + test scripts — one command each
- [ ] AI artifacts committed ([[CLAUDE]], `.claude/`, plans, prompts)
- [ ] Git history — small, incremental, honest about AI authorship

## Open questions

- [ ] Which design system does the real UI follow — [[DESIGN]] (Amrit Palace parchment) or the orange/paper Gradion tokens in [[app-demo.html]]?
- [ ] Stack choice, and storage: real DB or JSON files on disk?
- [ ] Current Gemini text model and image model (Nano Banana family) IDs — check image-model free-tier limits first.
