import { promises as fs } from 'node:fs';
import { randomUUID } from 'node:crypto';
import path from 'node:path';

/**
 * JSON-files-on-disk storage. Two guarantees the PRD requires of it (§05):
 *
 * - **No interleaved writes.** Every mutation of a given file runs inside a
 *   promise chain keyed by that file's path, so read-modify-write is serialized
 *   within the process. Two requests updating the same file queue instead of
 *   racing and clobbering each other's changes.
 * - **No torn files.** Writes go to a unique temp file and are then `rename`d
 *   over the target. Rename is atomic on both POSIX and NTFS, so a reader (or a
 *   crash) sees either the whole old file or the whole new one, never a partial.
 */

const chains = new Map<string, Promise<unknown>>();

/** Serialize `fn` against every other holder of this file's lock. */
export function withFileLock<T>(file: string, fn: () => Promise<T>): Promise<T> {
  const key = path.resolve(file);
  const previous = chains.get(key) ?? Promise.resolve();
  // Run after the previous holder settles, whether it resolved or rejected —
  // one failed write must not wedge the queue for the file.
  const next = previous.then(fn, fn);
  chains.set(
    key,
    next.catch(() => undefined),
  );
  return next;
}

export async function readJson<T>(file: string, fallback: T): Promise<T> {
  try {
    return JSON.parse(await fs.readFile(file, 'utf8')) as T;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return fallback;
    throw error;
  }
}

export async function writeJsonAtomic(file: string, data: unknown): Promise<void> {
  await fs.mkdir(path.dirname(file), { recursive: true });
  const temp = `${file}.${randomUUID()}.tmp`;
  await fs.writeFile(temp, JSON.stringify(data, null, 2), 'utf8');
  await fs.rename(temp, file);
}

/** Read-modify-write under the file's lock. The only way callers should mutate. */
export async function updateJson<T>(
  file: string,
  fallback: T,
  mutate: (current: T) => T | Promise<T>,
): Promise<T> {
  return withFileLock(file, async () => {
    const next = await mutate(await readJson(file, fallback));
    await writeJsonAtomic(file, next);
    return next;
  });
}
