import { promises as fs } from 'node:fs';
import { randomUUID } from 'node:crypto';
import os from 'node:os';
import path from 'node:path';
import { afterAll, describe, expect, it } from 'vitest';
import { readJson, updateJson, writeJsonAtomic } from '../src/storage/json-file.js';

const dataDir = path.join(os.tmpdir(), `chapterwhisper-store-${randomUUID()}`);

afterAll(async () => {
  await fs.rm(dataDir, { recursive: true, force: true });
});

function tempFile(): string {
  return path.join(dataDir, `${randomUUID()}.json`);
}

describe('json-file store', () => {
  it('returns the fallback for a file that does not exist yet', async () => {
    expect(await readJson(tempFile(), [])).toEqual([]);
  });

  it('creates missing parent directories on write', async () => {
    const file = path.join(dataDir, 'nested', 'deeper', 'projects.json');
    await writeJsonAtomic(file, { ok: true });

    expect(await readJson(file, null)).toEqual({ ok: true });
  });

  it('leaves no temp files behind', async () => {
    const file = path.join(dataDir, 'tidy.json');
    await writeJsonAtomic(file, { a: 1 });

    const leftovers = (await fs.readdir(dataDir)).filter((name) => name.endsWith('.tmp'));
    expect(leftovers).toEqual([]);
  });

  it('serializes overlapping read-modify-writes instead of losing them', async () => {
    const file = tempFile();

    // Without the lock these interleave: each read sees the same short array and
    // the last write wins, so most appends vanish.
    await Promise.all(
      Array.from({ length: 25 }, (_, i) =>
        updateJson<number[]>(file, [], (current) => [...current, i]),
      ),
    );

    const stored = await readJson<number[]>(file, []);
    expect(stored).toHaveLength(25);
    expect([...stored].sort((a, b) => a - b)).toEqual(Array.from({ length: 25 }, (_, i) => i));
  });

  it('keeps the queue moving after a failed update', async () => {
    const file = tempFile();
    await updateJson<string[]>(file, [], () => ['first']);

    await expect(
      updateJson<string[]>(file, [], () => {
        throw new Error('mutation blew up');
      }),
    ).rejects.toThrow('mutation blew up');

    // A rejected holder must not wedge the lock for everyone behind it.
    await updateJson<string[]>(file, [], (current) => [...current, 'second']);
    expect(await readJson<string[]>(file, [])).toEqual(['first', 'second']);
  });
});
