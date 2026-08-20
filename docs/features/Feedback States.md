---
title: Client Feedback States
aliases:
  - Feedback States
  - Loading States
  - Empty States
tags:
  - chapterwhisper
  - feature
  - frontend
  - ux
type: feature
status: built
---

# Client Feedback States

What the client shows while it does not yet have an answer: waiting on the session, waiting on
the library, waiting on a Gemini step, and failing. Everything here is presentation — no state
is invented in the browser, and the server stays the source of truth ([[Projects]]).

## The rule

> [!important] Never render a terminal state you have not confirmed
> Every screen that can be reached before its data arrives paints a *loading* state, not its
> *empty* state and not a signed-out state. An unconfirmed answer shown as a confirmed one is
> the whole class of bug this note exists to close.

Three places broke that rule and were fixed together:

| Screen | Was | Now |
| --- | --- | --- |
| App root | Login screen painted while `GET /api/auth/me` was in flight — it flashed at every returning author on every refresh | A splash, but **only** when `localStorage['cw_user']` says a session is plausible. A genuinely signed-out visitor still gets the login screen on first paint, with no round trip |
| Library | Empty grid — a first-time author saw a heading and a void | Skeleton cards while loading, then either the shelf or a real empty state with its own call to action |
| Pipeline studio | Blank page under the header while `GET /api/projects/:id` resolved | Rail + body skeleton, captioned "Opening the atelier…" |

`useProjects` starts with `loading: true` for the same reason — starting `false` guaranteed one
frame of the empty state before the first fetch resolved.

## The wait itself

A step is one blocking call for 10–60s ([[Architecture]]), so the studio shows a running banner
above the step body with an elapsed clock. It counts from the server's `stepStartedAt` when there
is one, so a tab opened mid-step shows the true elapsed time instead of restarting at zero, and
it names the last successful duration for that step as an anchor. The copy states that the step
is held on the server and the tab can be closed — which is true, and is the visible half of the
resumability guarantee.

## Failure

The toast is the only error surface, so it carries `role="alert"` + `aria-live="assertive"` for
failures and `role="status"` + `polite` otherwise, is dismissible, and errors live 12s rather
than 5s. Failure is inferred from the message text, because all three hooks emit a bare string —
if a hook ever needs a guaranteed classification, give `showToast` a second argument rather than
extending the regex.

> [!note] Not covered
> Focus-visible styling, the four click-handling `div`s that should be buttons (header logo,
> library card, stepper rail row, style preset), and dialog semantics for
> [[Projects|the slide modal]] are all still open. See [[TESTING]]'s deliberately-not-tested list.

## Code & tests

- `client/src/App.tsx` — splash gate, skeletons, toast classification, remembered active project
- `client/src/hooks/useProjects.ts` — `loading` starts `true`
- `client/src/components/library/LibraryView.tsx` — skeleton + empty state
- `client/src/components/pipeline/PipelineStudio.tsx` — `RunningBanner`
- `client/src/components/common/Toast.tsx` — live region, error variant, dismiss
- `client/src/components/new-project/NewProjectView.tsx` — the drop target is real now; the copy
  promised one long before there were `onDragOver`/`onDrop` handlers
- `client/src/index.css` — `fadeIn` (`animate-fade-in` was used by the slide modal before this
  keyframe existed, so it silently did nothing), `shimmer`/`.skeleton`, and a
  `prefers-reduced-motion` block

Covered indirectly by `App.test.tsx`, `LibraryView.test.tsx` and `NewProjectView.test.tsx`;
none of them assert the new states yet.

Related: [[Projects]] · [[Architecture]] · [[DESIGN]] · [[TESTING]]
