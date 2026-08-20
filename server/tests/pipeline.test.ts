import { describe, it, expect, vi, beforeEach, afterAll } from 'vitest';
import { promises as fs } from 'node:fs';
import { randomUUID } from 'node:crypto';
import os from 'node:os';
import path from 'node:path';
import supertest from 'supertest';
import type * as gemini from '../src/gemini/client.js';

const dataDir = path.join(os.tmpdir(), `chapterwhisper-pipeline-${randomUUID()}`);
process.env.STORAGE_DIR = dataDir;
process.env.JWT_SECRET = 'test-secret';
process.env.JWT_EXPIRES_IN = '7d';
process.env.GEMINI_API_KEY = 'test-gemini-key';

vi.mock('../src/gemini/client.js', async (importOriginal) => {
  const actual = await importOriginal<typeof gemini>();
  return { ...actual, createInteraction: vi.fn() };
});

const { createApp } = await import('../src/app.js');
const geminiClient = await import('../src/gemini/client.js');
const spy = vi.mocked(geminiClient.createInteraction);

afterAll(async () => {
  await fs.rm(dataDir, { recursive: true, force: true });
});

const TRANSPARENT_PNG =
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

const text = (id: string, body: string) => ({
  id,
  status: 'completed',
  model: 'gemini-3.7-flash',
  steps: [{ type: 'model', content: [{ type: 'text', text: body }] }],
});
const json = (id: string, payload: unknown) => text(id, JSON.stringify(payload));
const image = (id: string) => ({
  id,
  status: 'completed',
  model: 'gemini-3.1-flash-image',
  steps: [{ type: 'model', content: [{ type: 'image', data: TRANSPARENT_PNG, mime_type: 'image/png' }] }],
});

const queue = (...interactions: ReturnType<typeof text>[]) => {
  for (const i of interactions) spy.mockResolvedValueOnce(i as never);
};

const BOOK = 'Mole and Ratty set off along the riverbank one bright morning.';
const CAST = [
  { name: 'Mole', description: 'Gentle scholar', prompt: 'A gentle mole in round spectacles' },
  { name: 'Water Rat', description: 'Seasoned boatman', prompt: 'A water rat in a nautical waistcoat' },
];
const SCENE = {
  name: 'The River Bank',
  prompt: 'Mole and Water Rat rowing a wicker boat down a sun-dappled stream.',
  characters: ['Mole', 'Water Rat'],
};

const app = createApp();

async function signIn(email = 'pipeline@author.co') {
  const res = await supertest(app).post('/api/auth/login').send({ email, name: 'Pipeline Author' });
  const jar = res.headers['set-cookie'] as unknown as string[] | undefined;
  return (jar ?? []).find((c) => c.startsWith('cw_session=')) ?? '';
}

let cookie: string;
beforeEach(async () => {
  spy.mockReset();
  cookie = await signIn();
});

async function newProject(title = 'Riverbank') {
  queue(text('int_ingest', 'INGESTED'));
  const res = await supertest(app)
    .post('/api/projects')
    .set('Cookie', cookie)
    .send({ title, bookText: BOOK });
  expect(res.status).toBe(201);
  return res.body.project.id as string;
}

const run = (id: string, step: number, body: Record<string, unknown> = {}) =>
  supertest(app).post(`/api/projects/${id}/steps/${step}/run`).set('Cookie', cookie).send(body);

async function advanceTo(id: string, upTo: number) {
  if (upTo > 0) { queue(text('int_style', 'Victorian ink and wash')); await run(id, 0); }
  if (upTo > 1) { queue(json('int_cast', CAST)); await run(id, 1); }
  if (upTo > 2) { queue(image('int_p1'), image('int_p2')); await run(id, 2); }
  if (upTo > 3) { queue(json('int_scene', SCENE)); await run(id, 3); }
}

const callArg = (n: number) => spy.mock.calls[n][0] as gemini.InteractionRequest;
const inputText = (req: gemini.InteractionRequest) =>
  typeof req.input === 'string' ? req.input : JSON.stringify(req.input);

describe('Step 01 - art style', () => {
  it('stores a user-supplied style and registers it with the model', async () => {
    const id = await newProject();
    queue(text('int_style', 'acknowledged'));

    const res = await run(id, 0, { style: 'Bauhaus woodcut' });

    expect(res.status).toBe(200);
    expect(res.body.project.style).toBe('Bauhaus woodcut');
    expect(res.body.project.interactions.styleId).toBe('int_style');
    // The override must reach the model, or every later step chains off a style
    // it was never told about.
    expect(inputText(callArg(1))).toContain('Bauhaus woodcut');
    expect(callArg(1).previous_interaction_id).toBe('int_ingest');
  });

  it('derives a style from the book when none is supplied', async () => {
    const id = await newProject();
    queue(text('int_style', 'Golden-age oil, amber highlight, deep shadow'));

    const res = await run(id, 0);

    expect(res.status).toBe(200);
    expect(res.body.project.style).toContain('Golden-age oil');
    expect(res.body.project.statuses[0]).toBe('done');
    expect(res.body.project.statuses[1]).toBe('ready');
  });
});

describe('Step 02 - characters', () => {
  it('chains off the style interaction', async () => {
    const id = await newProject();
    await advanceTo(id, 1);
    queue(json('int_cast', CAST));

    const res = await run(id, 1);

    expect(res.status).toBe(200);
    expect(res.body.project.characters.map((c: { id: string }) => c.id)).toEqual(['c1', 'c2']);
    expect(callArg(2).previous_interaction_id).toBe('int_style');
    expect(res.body.project.interactions.charactersId).toBe('int_cast');
  });

  it('fails the step when the model answers with prose instead of JSON', async () => {
    const id = await newProject();
    await advanceTo(id, 1);
    queue(text('int_cast', 'Sorry, I cannot list the characters.'));

    const res = await run(id, 1);

    // A step failure is reported as 200 with a failed project, not an error status.
    expect(res.status).toBe(200);
    expect(res.body.project.statuses[1]).toBe('failed');
    expect(res.body.project.error).toMatch(/valid JSON/i);
    expect(res.body.project.statuses[2]).toBe('locked');
  });
});

describe('Step 03 - portraits', () => {
  it('writes one PNG per character and serves it back through the API', async () => {
    const id = await newProject();
    await advanceTo(id, 2);
    queue(image('int_p1'), image('int_p2'));

    const res = await run(id, 2);

    expect(res.status).toBe(200);
    expect(res.body.project.characters[0].portraitUrl).toBe(`/api/projects/${id}/portraits/c1`);
    expect(res.body.project.characters[1].portraitUrl).toBe(`/api/projects/${id}/portraits/c2`);

    // The URL the client renders must actually stream bytes.
    const png = await supertest(app).get(`/api/projects/${id}/portraits/c1`).set('Cookie', cookie);
    expect(png.status).toBe(200);
    expect(png.headers['content-type']).toContain('image/png');

    const missing = await supertest(app).get(`/api/projects/${id}/portraits/c9`).set('Cookie', cookie);
    expect(missing.status).toBe(404);
  });
});

describe('Step 04 - chapter scene', () => {
  it('stores exactly one scene and unlocks step 05', async () => {
    const id = await newProject();
    await advanceTo(id, 3);
    queue(json('int_scene', SCENE));

    const res = await run(id, 3);

    expect(res.status).toBe(200);
    expect(res.body.project.chapters).toHaveLength(1);
    expect(res.body.project.chapters[0].id).toBe('ch1');
    expect(res.body.project.chapters[0].name).toBe('The River Bank');
    expect(res.body.project.chapterIndex).toBe(0);
    expect(res.body.project.statuses[3]).toBe('done');
    expect(res.body.project.statuses[4]).toBe('ready');
  });

  it('truncates an array answer to one chapter, so the cap holds either way', async () => {
    const id = await newProject();
    await advanceTo(id, 3);
    queue(json('int_scene', [SCENE, { name: 'Second', prompt: 'Dropped', characters: [] }]));

    const res = await run(id, 3);

    expect(res.body.project.chapters).toHaveLength(1);
    expect(res.body.project.chapters[0].name).toBe('The River Bank');
  });
});

describe('Step 05 - illustration', () => {
  it('renders the final plate and serves it', async () => {
    const id = await newProject();
    await advanceTo(id, 4);
    queue(image('int_plate'));

    const res = await run(id, 4);

    expect(res.status).toBe(200);
    expect(res.body.project.chapters[0].illustrationUrl).toBe(`/api/projects/${id}/illustrations/ch1`);
    expect(res.body.project.statuses[4]).toBe('done');
    expect(res.body.project.interactions.illustrationId).toBe('int_plate');

    const png = await supertest(app).get(`/api/projects/${id}/illustrations/ch1`).set('Cookie', cookie);
    expect(png.status).toBe(200);
    expect(png.headers['content-type']).toContain('image/png');
  });
});

describe('Pipeline guarantees', () => {
  it('sends the book text exactly once, at ingestion', async () => {
    const id = await newProject();
    await advanceTo(id, 4);
    queue(image('int_plate'));
    await run(id, 4);

    const carryingBook = spy.mock.calls.filter(([req]) =>
      inputText(req as gemini.InteractionRequest).includes(BOOK),
    );
    expect(carryingBook).toHaveLength(1);
    // Every later call rides the interaction chain instead of re-uploading it.
    for (let n = 1; n < spy.mock.calls.length; n += 1) {
      expect(callArg(n).previous_interaction_id).toBeTruthy();
    }
  });

  it('leaves a failed step retryable, with nothing else lost', async () => {
    const id = await newProject();
    spy.mockRejectedValueOnce(new geminiClient.GeminiError('Gemini returned 500: high demand', 500));

    const failed = await run(id, 0);
    expect(failed.status).toBe(200);
    expect(failed.body.project.statuses[0]).toBe('failed');
    expect(failed.body.project.error).toContain('high demand');

    queue(text('int_style', 'Ink and wash'));
    const retried = await run(id, 0);
    expect(retried.status).toBe(200);
    expect(retried.body.project.statuses[0]).toBe('done');
    expect(retried.body.project.style).toBe('Ink and wash');
    expect(retried.body.project.error).toBeFalsy();
  });

  it('answers 409 to a second run while the step is still running', async () => {
    const id = await newProject();

    // Hold the Gemini call open so the step stays `running`.
    let release!: (value: unknown) => void;
    spy.mockImplementationOnce(
      () => new Promise((resolve) => { release = resolve; }) as never,
    );

    // supertest only dispatches a request when it is awaited, so kick it off
    // explicitly before polling for the persisted `running` status.
    const inFlight = run(id, 0).then((res) => res);

    // `running` is persisted before the call is made, which is what lets another
    // request see it.
    let status = '';
    for (let attempt = 0; attempt < 100 && status !== 'running'; attempt += 1) {
      await new Promise((r) => setTimeout(r, 10));
      const peek = await supertest(app).get(`/api/projects/${id}`).set('Cookie', cookie);
      status = peek.body.project.statuses[0];
    }
    expect(status).toBe('running');

    const duplicate = await run(id, 0);
    expect(duplicate.status).toBe(409);

    release(text('int_style', 'Ink and wash'));
    const first = await inFlight;
    expect(first.status).toBe(200);
    expect(first.body.project.statuses[0]).toBe('done');
    // The duplicate never reached Gemini: one call to ingest, one for the step.
    expect(spy).toHaveBeenCalledTimes(2);
  });

  it('hides another users project behind a 404', async () => {
    const id = await newProject();
    cookie = await signIn('someone.else@author.co');

    const res = await supertest(app).get(`/api/projects/${id}`).set('Cookie', cookie);
    expect(res.status).toBe(404);
  });
});
