import { describe, it, expect, vi, beforeEach, afterAll } from 'vitest';
import { promises as fs } from 'node:fs';
import { randomUUID } from 'node:crypto';
import os from 'node:os';
import path from 'node:path';
import supertest from 'supertest';
import type * as gemini from '../src/gemini/client.js';

const dataDir = path.join(os.tmpdir(), `chapterwhisper-projects-${randomUUID()}`);
process.env.STORAGE_DIR = dataDir;
process.env.JWT_SECRET = 'test-secret';
process.env.JWT_EXPIRES_IN = '7d';
process.env.GEMINI_API_KEY = 'test-gemini-key';

vi.mock('../src/gemini/client.js', async (importOriginal) => {
  const actual = await importOriginal<typeof gemini>();
  return {
    ...actual,
    createInteraction: vi.fn().mockResolvedValue({
      id: 'int_12345',
      status: 'completed',
      model: 'gemini-3.7-flash',
      steps: [
        { type: 'model', content: [{ type: 'text', text: 'Ink & Wash' }] },
      ],
    }),
  };
});

const { createApp } = await import('../src/app.js');
const { SESSION_COOKIE } = await import('../src/auth/cookie.js');
const { signToken } = await import('../src/auth/jwt.js');

afterAll(async () => {
  await fs.rm(dataDir, { recursive: true, force: true });
});

describe('Projects & Pipeline API', () => {
  let authCookie: string;
  const app = createApp();

  beforeEach(async () => {
    const loginRes = await supertest(app)
      .post('/api/auth/login')
      .send({ email: 'test@author.co', name: 'Test Author' });
    const setCookie = loginRes.headers['set-cookie'] as unknown as string[] | undefined;
    authCookie = (setCookie ?? []).find((c) => c.startsWith('cw_session=')) ?? '';
  });

  it('rejects unauthenticated requests', async () => {
    const res = await supertest(app).get('/api/projects');
    expect(res.status).toBe(401);
  });

  it('creates a new project with step 00 anchor id & sliced statuses', async () => {
    const res = await supertest(app)
      .post('/api/projects')
      .set('Cookie', authCookie)
      .send({
        title: 'The Cyclical Codex',
        bookText: 'A chapter on eternal regression in an alchemical vault.',
      });

    expect(res.status).toBe(201);
    expect(res.body.project).toHaveProperty('id');
    expect(res.body.project.title).toBe('The Cyclical Codex');
    expect(res.body.project.statuses[0]).toBe('ready');
    expect(res.body.project.statuses[1]).toBe('locked');
  });

  it('prevents running locked steps', async () => {
    const created = await supertest(app)
      .post('/api/projects')
      .set('Cookie', authCookie)
      .send({ title: 'Locked Project', bookText: 'Content...' });

    const pId = created.body.project.id;
    const runLocked = await supertest(app)
      .post(`/api/projects/${pId}/steps/2/run`)
      .set('Cookie', authCookie);
    expect(runLocked.status).toBe(400);
  });

  it('refuses to re-run a completed step', async () => {
    const created = await supertest(app)
      .post('/api/projects')
      .set('Cookie', authCookie)
      .send({ title: 'Finality', bookText: 'A short manuscript about endings.' });
    const pId = created.body.project.id;

    const first = await supertest(app)
      .post(`/api/projects/${pId}/steps/0/run`)
      .set('Cookie', authCookie);
    expect(first.status).toBe(200);
    expect(first.body.project.statuses[0]).toBe('done');
    const styleId = first.body.project.interactions.styleId;

    // A completed step is final: no second Gemini call, no overwrite.
    const second = await supertest(app)
      .post(`/api/projects/${pId}/steps/0/run`)
      .set('Cookie', authCookie);
    expect(second.status).toBe(409);

    // And the stored result is untouched.
    const after = await supertest(app).get(`/api/projects/${pId}`).set('Cookie', authCookie);
    expect(after.body.project.statuses[0]).toBe('done');
    expect(after.body.project.interactions.styleId).toBe(styleId);
  });

  it('still allows retrying a failed step', async () => {
    const created = await supertest(app)
      .post('/api/projects')
      .set('Cookie', authCookie)
      .send({ title: 'Retryable', bookText: 'A manuscript that fails once.' });
    const pId = created.body.project.id;

    const gemini = await import('../src/gemini/client.js');
    const spy = vi.mocked(gemini.createInteraction);
    spy.mockRejectedValueOnce(new Error('Gemini returned 500: high demand'));

    const failed = await supertest(app)
      .post(`/api/projects/${pId}/steps/0/run`)
      .set('Cookie', authCookie);
    expect(failed.body.project.statuses[0]).toBe('failed');

    // `failed` is not `done`, so the guard must not block the retry.
    const retried = await supertest(app)
      .post(`/api/projects/${pId}/steps/0/run`)
      .set('Cookie', authCookie);
    expect(retried.status).toBe(200);
    expect(retried.body.project.statuses[0]).toBe('done');
  });
});
