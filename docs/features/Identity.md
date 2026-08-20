---
title: Identity & Session
aliases:
  - Identity
  - Auth
  - Session
tags:
  - chapterwhisper
  - feature
  - backend
  - auth
type: feature
status: built
---

# Identity & Session

Passwordless sign-in: **email + name**. A known email loads that user, an unknown one creates
it. No password, no OAuth ([[PRD]] §4.1). Implements Milestone 2 of [[Progress]].

## API surface

| Endpoint | Purpose |
| --- | --- |
| `POST /api/auth/login` | Sign in **or** sign up; sets the session cookie, returns `{ user }` |
| `GET /api/auth/me` | Restore the session after a refresh |
| `POST /api/auth/logout` | Clear the cookie; idempotent, safe when not signed in |

Login returns 200 for both sign-in and sign-up. The client has no reason to care which
happened, and distinguishing them would leak which emails are registered.

## Session carrier: `httpOnly` cookie

> [!important] The token is never exposed to JavaScript
> `cw_session`, `HttpOnly`, `SameSite=Lax`, `Path=/`, `Secure` only in production (requiring
> TLS on localhost would silently drop the cookie). `Max-Age` is derived from `JWT_EXPIRES_IN`
> so the browser drops the cookie at the moment the token stops verifying — otherwise the
> client believes it is signed in while every request 401s.

Three rules follow from that choice. Each has a test; none should be undone casually.

1. **The token is never in the response body.** Echoing it back would let page JS read and
   stash it, undoing the reason for choosing a cookie at all.
2. **The cookie is the only accepted carrier.** `requireAuth` ignores `Authorization: Bearer`
   entirely — a bearer fallback would hand an XSS payload a way to present a stolen token.
3. **Logout must be a server call.** With `httpOnly` the client physically cannot clear its own
   session, so the endpoint is required rather than a convenience.

## Invariants

- **The existence check runs inside the write lock.** Checking first and writing after lets two
  simultaneous first-time logins with the same email both miss and create duplicate users.
- **An existing user's name is not overwritten** on later sign-ins. The login form is not an
  account editor.
- **The user is re-read from disk on every request**, not trusted from the token body, so a
  token outliving its user (a wiped `data/`) fails closed instead of authorizing a ghost.
- **Email is the identity key**, matched case- and whitespace-insensitively.
- **No tokens are stored server-side.** JWTs are stateless, verified by signature.
  `data/users.json` holds `id`, `email`, `name`, `createdAt` and nothing else.

## Known limit

CSRF defence is `SameSite=Lax` alone — there is no CSRF token. A deliberate stopping point for
a locally-run single-user assessment; a real deployment would add double-submit tokens. Recorded
in [[TESTING]] under *Deliberately not tested*.

## Code & tests

- `server/src/auth/routes.ts`, `middleware.ts`, `jwt.ts`, `cookie.ts`
- `server/src/users/user-store.ts` — persistence, on top of [[Storage]]
- `server/tests/auth.test.ts` — 12 tests: sign-up, sign-in, cookie flags, bearer rejection,
  session restore, logout, races

Related: [[Storage]] · [[Architecture]] · [[TESTING]] · [[DECISIONS]]
