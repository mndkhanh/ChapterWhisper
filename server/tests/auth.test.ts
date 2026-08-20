import { promises as fs } from 'node:fs';
import { randomUUID } from 'node:crypto';
import os from 'node:os';
import path from 'node:path';
import request from 'supertest';
import { afterAll, describe, expect, it } from 'vitest';

// Set before importing the app — config reads env lazily, but keep it obvious.
const dataDir = path.join(os.tmpdir(), `chapterwhisper-auth-${randomUUID()}`);
process.env.STORAGE_DIR = dataDir;
process.env.JWT_SECRET = 'test-secret';

const { createApp } = await import('../src/app.js');
const app = createApp();

afterAll(async () => {
  await fs.rm(dataDir, { recursive: true, force: true });
});

function login(email: string, name: string) {
  return request(app).post('/api/auth/login').send({ email, name });
}

describe('POST /api/auth/login', () => {
  it('creates a user on first sign-in and returns a token', async () => {
    const res = await login('ada@example.com', 'Ada Lovelace');

    expect(res.status).toBe(200);
    expect(res.body.token).toEqual(expect.any(String));
    expect(res.body.user).toMatchObject({ email: 'ada@example.com', name: 'Ada Lovelace' });
    expect(res.body.user.id).toEqual(expect.any(String));
  });

  it('returns the same user for a known email instead of creating a second one', async () => {
    const first = await login('grace@example.com', 'Grace Hopper');
    // Different casing and padding, different name — still the same identity.
    const second = await login('  GRACE@example.com  ', 'Someone Else');

    expect(second.status).toBe(200);
    expect(second.body.user.id).toBe(first.body.user.id);
    // The login form is not an account editor: the stored name stands.
    expect(second.body.user.name).toBe('Grace Hopper');
  });

  it('rejects a malformed email or a blank name', async () => {
    expect((await login('not-an-email', 'Ada')).status).toBe(400);
    expect((await login('ada2@example.com', '   ')).status).toBe(400);
  });

  it('does not lose users when sign-ins arrive concurrently', async () => {
    const emails = Array.from({ length: 12 }, (_, i) => `racer${i}@example.com`);
    await Promise.all(emails.map((email) => login(email, 'Racer')));

    const stored = JSON.parse(await fs.readFile(path.join(dataDir, 'users.json'), 'utf8'));
    for (const email of emails) {
      expect(stored.filter((user: { email: string }) => user.email === email)).toHaveLength(1);
    }
  });

  it('creates exactly one user when the same new email races itself', async () => {
    const attempts = await Promise.all(
      Array.from({ length: 5 }, () => login('twin@example.com', 'Twin')),
    );
    const ids = new Set(attempts.map((res) => res.body.user.id));

    expect(ids.size).toBe(1);
  });
});

describe('GET /api/auth/me', () => {
  it('restores the session from a valid token', async () => {
    const { body } = await login('alan@example.com', 'Alan Turing');

    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${body.token}`);

    expect(res.status).toBe(200);
    expect(res.body.user).toEqual(body.user);
  });

  it('rejects a missing, malformed, or tampered token', async () => {
    expect((await request(app).get('/api/auth/me')).status).toBe(401);

    const noScheme = await request(app).get('/api/auth/me').set('Authorization', 'abc');
    expect(noScheme.status).toBe(401);

    const tampered = await request(app)
      .get('/api/auth/me')
      .set('Authorization', 'Bearer not.a.jwt');
    expect(tampered.status).toBe(401);
  });
});
