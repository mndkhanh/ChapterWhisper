---
title: Storage Engine
aliases:
  - Storage
  - JSON Store
tags:
  - chapterwhisper
  - feature
  - backend
  - storage
type: feature
status: built
---

# Storage Engine

JSON files on disk, no database. [[PRD]] §05 accepts this at our scope **if** state is isolated
per user/project and safe against overlapping writes — those two conditions are the whole design.

## Layout

```
data/                        ← STORAGE_DIR, gitignored
├── users.json               all users
├── projects/{id}.json       one file per project
└── storage/{projectId}/
    ├── portraits/{characterId}.png
    └── illustrations/{chapterId}.png
```

One file per project rather than one big `projects.json` — the unit of locking is the file, so
per-project files mean two users' projects never contend.

## The two guarantees

> [!important] No interleaved writes
> Every mutation of a file runs inside a promise chain keyed by that file's path, so
> read-modify-write is serialized within the process. Two requests updating the same file queue
> instead of racing and clobbering each other. A rejected holder does **not** wedge the queue
> for everyone behind it.

> [!important] No torn files
> Writes go to a unique temp file and are then `rename`d over the target. Rename is atomic on
> both POSIX and NTFS, so a reader — or a crash — sees either the whole old file or the whole
> new one, never a half-written one.

`updateJson(file, fallback, mutate)` is the only sanctioned way to mutate: it combines the lock,
the read, the mutation, and the atomic write. Callers should not reach for `writeJsonAtomic`
directly unless they are replacing a file wholesale.

## Known limit

The mutex is **per-process**. Correct for the single-server deployment that is this project's
whole scope; two server processes sharing one `data/` directory would need file-descriptor
locks. Noted as a limit, not defended against.

## Code & tests

- `server/src/storage/json-file.ts` — `withFileLock`, `readJson`, `writeJsonAtomic`, `updateJson`
- `server/tests/json-file.test.ts` — 5 tests: lost updates, atomicity, temp-file cleanup,
  missing parents, lock recovery after a throw

The lost-update test was verified to fail before it was trusted: with `withFileLock` removed
from `updateJson` it fails while the other four still pass. A concurrency test that cannot fail
is decoration.

Related: [[Identity]] · [[Architecture]] · [[TESTING]]
