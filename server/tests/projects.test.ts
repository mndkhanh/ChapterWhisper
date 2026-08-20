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

  it('executes Step 1 (Style), Step 2 (Characters), Step 3 (Portraits), and Step 4 (Chapters) sequentially', async () => {
    const gemini = await import('../src/gemini/client.js');
    const spy = vi.mocked(gemini.createInteraction);

    // Mock Step 0 (ingest)
    spy.mockResolvedValueOnce({
      id: 'int_step0',
      status: 'completed',
      model: 'gemini-3.7-flash',
      steps: [{ type: 'model', content: [{ type: 'text', text: 'INGESTED' }] }],
    });

    const created = await supertest(app)
      .post('/api/projects')
      .set('Cookie', authCookie)
      .send({
        title: 'The Great Pipeline Voyage',
        bookText: 'Mole and Ratty set off on a voyage along the riverbanks.',
      });
    const pId = created.body.project.id;
    expect(created.body.project.statuses[0]).toBe('ready');

    // ── Test Step 1: Art Style ──
    spy.mockResolvedValueOnce({
      id: 'int_step1',
      status: 'completed',
      model: 'gemini-3.7-flash',
      steps: [{ type: 'model', content: [{ type: 'text', text: 'Victorian Storybook Ink & Wash with rich sepia lines' }] }],
    });
    const step1Res = await supertest(app)
      .post(`/api/projects/${pId}/steps/0/run`)
      .set('Cookie', authCookie);
    expect(step1Res.status).toBe(200);
    expect(step1Res.body.project.style).toContain('Victorian Storybook');
    expect(step1Res.body.project.statuses[0]).toBe('done');
    expect(step1Res.body.project.statuses[1]).toBe('ready');

    // ── Test Step 2: Characters (Max 2 Adults) ──
    spy.mockResolvedValueOnce({
      id: 'int_step2',
      status: 'completed',
      model: 'gemini-3.7-flash',
      steps: [{
        type: 'model',
        content: [{
          type: 'text',
          text: JSON.stringify([
            { name: 'Mole', description: 'Gentle scholar in velvet coat', prompt: 'A gentle mole with round spectacles' },
            { name: 'Water Rat', description: 'Seasoned boatman with waistcoat', prompt: 'A water rat in nautical attire' },
            { name: 'Extra Third Character', description: 'Should be sliced by server', prompt: 'Extra' },
          ]),
        }],
      }],
    });
    const step2Res = await supertest(app)
      .post(`/api/projects/${pId}/steps/1/run`)
      .set('Cookie', authCookie);
    expect(step2Res.status).toBe(200);
    expect(step2Res.body.project.characters).toHaveLength(2); // Enforced max 2
    expect(step2Res.body.project.characters[0].name).toBe('Mole');
    expect(step2Res.body.project.characters[1].name).toBe('Water Rat');
    expect(step2Res.body.project.statuses[1]).toBe('done');
    expect(step2Res.body.project.statuses[2]).toBe('ready');

    // ── Test Step 3: Character Portraits ──
    // Spy for 2 characters: returns 1x1 transparent PNG base64
    const samplePng = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
    spy.mockResolvedValueOnce({
      id: 'int_step3_char1',
      status: 'completed',
      model: 'gemini-3.1-flash-image',
      steps: [{
        type: 'model',
        content: [{ type: 'image', data: samplePng, mime_type: 'image/png' }],
      }],
    });
    spy.mockResolvedValueOnce({
      id: 'int_step3_char2',
      status: 'completed',
      model: 'gemini-3.1-flash-image',
      steps: [{
        type: 'model',
        content: [{ type: 'image', data: samplePng, mime_type: 'image/png' }],
      }],
    });
    const step3Res = await supertest(app)
      .post(`/api/projects/${pId}/steps/2/run`)
      .set('Cookie', authCookie);
    expect(step3Res.status).toBe(200);
    expect(step3Res.body.project.characters[0].portraitUrl).toBe(`/api/projects/${pId}/portraits/c1`);
    expect(step3Res.body.project.characters[1].portraitUrl).toBe(`/api/projects/${pId}/portraits/c2`);
    expect(step3Res.body.project.statuses[2]).toBe('done');
    expect(step3Res.body.project.statuses[3]).toBe('ready');

    // ── Test Step 4: Chapters (Max 1 Chapter Scene) ──
    spy.mockResolvedValueOnce({
      id: 'int_step4',
      status: 'completed',
      model: 'gemini-3.7-flash',
      steps: [{
        type: 'model',
        content: [{
          type: 'text',
          text: JSON.stringify([
            {
              name: 'Chapter I: The River Bank',
              prompt: 'Mole and Water Rat rowing a wicker boat along a sun-dappled stream.',
              characters: ['Mole', 'Water Rat'],
            },
            {
              name: 'Chapter II: The Open Road',
              prompt: 'Should be sliced by server',
              characters: ['Toad'],
            },
          ]),
        }],
      }],
    });
    const step4Res = await supertest(app)
      .post(`/api/projects/${pId}/steps/3/run`)
      .set('Cookie', authCookie);
    expect(step4Res.status).toBe(200);
    expect(step4Res.body.project.chapters).toHaveLength(1); // Enforced max 1 chapter
    expect(step4Res.body.project.chapters[0].name).toBe('Chapter I: The River Bank');
    expect(step4Res.body.project.chapters[0].characters).toEqual(['Mole', 'Water Rat']);
    expect(step4Res.body.project.statuses[3]).toBe('done');
    expect(step4Res.body.project.statuses[4]).toBe('ready');

    // ── Check Attempts / History ──
    expect(step4Res.body.project.attempts).toBeDefined();
    expect(step4Res.body.project.attempts.length).toBeGreaterThanOrEqual(4);
    expect(step4Res.body.project.attempts[0].status).toBe('done');
    expect(step4Res.body.project.attempts[0].durationMs).toBeGreaterThanOrEqual(0);
  });

  it('connects to SSE endpoint and receives connection confirmation', async () => {
    const created = await supertest(app)
      .post('/api/projects')
      .set('Cookie', authCookie)
      .send({ title: 'SSE Test', bookText: 'Testing events stream...' });
    const pId = created.body.project.id;

    const res = await supertest(app)
      .get(`/api/projects/${pId}/events`)
      .set('Cookie', authCookie)
      .buffer(true)
      .parse((res, cb) => {
        let data = '';
        res.on('data', (chunk) => {
          data += chunk.toString();
          if (data.includes('connected')) {
            res.destroy(); // Close stream after connection packet
            cb(null, data);
          }
        });
      });

    expect(res.status).toBe(200);
    expect(res.header['content-type']).toContain('text/event-stream');
    expect(res.body).toContain('connected');
  });
});
