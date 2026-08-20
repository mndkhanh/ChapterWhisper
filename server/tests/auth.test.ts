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
process.env.JWT_EXPIRES_IN = '7d';

const { createApp } = await import('../src/app.js');
const app = createApp();

afterAll(async () => {
  await fs.rm(dataDir, { recursive: true, force: true });
});

function login(email: string, name: string) {
  return request(app).post('/api/auth/login').send({ email, name });
}

/** The raw `Set-Cookie` header for the session, so its flags can be asserted. */
function sessionCookie(res: request.Response): string {
  const header = res.headers['set-cookie'] as unknown as string[] | undefined;
  return (header ?? []).find((cookie) => cookie.startsWith('cw_session=')) ?? '';
}

describe('POST /api/auth/login', () => {
  it('creates a user on first sign-in and returns the user', async () => {
    const res = await login('ada@example.com', 'Ada Lovelace');

    expect(res.status).toBe(200);
    expect(res.body.user).toMatchObject({ email: 'ada@example.com', name: 'Ada Lovelace' });
    expect(res.body.user.id).toEqual(expect.any(String));
  });

  it('never puts the token in the response body', async () => {
    const res = await login('nobody@example.com', 'Nobody');

    // Echoing the token back would let client JS read and stash it, which is
    // precisely what the httpOnly cookie exists to prevent.
    expect(res.body.token).toBeUndefined();
    expect(JSON.stringify(res.body)).not.toContain('eyJ'); // no JWT anywhere in the body
  });

  it('sets an httpOnly, sameSite session cookie', async () => {
    const cookie = sessionCookie(await login('flags@example.com', 'Flags'));

    expect(cookie).toContain('HttpOnly');
    expect(cookie).toContain('SameSite=Lax');
    expect(cookie).toContain('Path=/');
    expect(cookie).toContain('Max-Age=604800'); // 7d, matching JWT_EXPIRES_IN
    // Dev runs on plain http; requiring TLS here would silently drop the cookie.
    expect(cookie).not.toContain('Secure');
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
  it('restores the session from the cookie, as a refresh would', async () => {
    // `agent` keeps a cookie jar across requests — this is the browser's behavior.
    const agent = request.agent(app);
    const { body } = await agent
      .post('/api/auth/login')
      .send({ email: 'alan@example.com', name: 'Alan Turing' });

    const res = await agent.get('/api/auth/me');

    expect(res.status).toBe(200);
    expect(res.body.user).toEqual(body.user);
  });

  it('rejects a missing, tampered, or wrongly-signed cookie', async () => {
    expect((await request(app).get('/api/auth/me')).status).toBe(401);

    const garbage = await request(app)
      .get('/api/auth/me')
      .set('Cookie', 'cw_session=not.a.jwt');
    expect(garbage.status).toBe(401);

    // A structurally valid JWT signed with the wrong key must not be accepted.
    const { default: jwt } = await import('jsonwebtoken');
    const forged = jwt.sign({ email: 'mallory@example.com' }, 'wrong-secret', {
      subject: 'some-id',
    });
    const tampered = await request(app)
      .get('/api/auth/me')
      .set('Cookie', `cw_session=${forged}`);
    expect(tampered.status).toBe(401);
  });

  it('ignores a bearer header — the cookie is the only accepted carrier', async () => {
    const { default: jwt } = await import('jsonwebtoken');
    const { body } = await login('header@example.com', 'Header');
    const token = jwt.sign({ email: body.user.email }, 'test-secret', { subject: body.user.id });

    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(401);
  });
});

describe('POST /api/auth/logout', () => {
  it('clears the session so protected routes reject again', async () => {
    const agent = request.agent(app);
    await agent.post('/api/auth/login').send({ email: 'bye@example.com', name: 'Bye' });
    expect((await agent.get('/api/auth/me')).status).toBe(200);

    const res = await agent.post('/api/auth/logout');
    expect(res.status).toBe(204);

    expect((await agent.get('/api/auth/me')).status).toBe(401);
  });

  it('is safe to call when not signed in', async () => {
    expect((await request(app).post('/api/auth/logout')).status).toBe(204);
  });
});
