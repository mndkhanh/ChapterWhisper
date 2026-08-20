import { renderHook, act, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { usePipeline } from '../hooks/usePipeline.js';
import type { Project } from '../types.js';

function jsonResponse(status: number, body: unknown): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    text: () => Promise.resolve(JSON.stringify(body)),
  } as unknown as Response;
}

const baseProject = (over: Partial<Project> = {}): Project => ({
  id: 'p_1',
  title: 'The Lantern Corridor',
  bookText: '...',
  wordCount: 672,
  style: null,
  chapterIndex: null,
  statuses: ['ready', 'locked', 'locked', 'locked', 'locked'],
  characters: [],
  chapters: [],
  interactions: { ingestionId: 'int_0' },
  createdAt: '',
  updatedAt: '',
  ...over,
});

describe('usePipeline — step 0 wiring', () => {
  beforeEach(() => vi.restoreAllMocks());

  it('posts the chosen style and applies the returned project', async () => {
    const done = baseProject({
      style: 'Ink & Wash',
      statuses: ['done', 'ready', 'locked', 'locked', 'locked'],
      interactions: { ingestionId: 'int_0', styleId: 'int_1' },
    });
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse(200, { project: done }));
    global.fetch = fetchMock;

    const applyProject = vi.fn();
    const toast = vi.fn();
    const { result } = renderHook(() => usePipeline(baseProject(), applyProject, toast));

    act(() => result.current.updateStyle('Ink & Wash'));
    await act(async () => {
      await result.current.runStep();
    });

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe('/api/projects/p_1/steps/0/run');
    expect(init.method).toBe('POST');
    // The cookie is the session — without this the server answers 401.
    expect(init.credentials).toBe('include');
    // The style reaches the server only when the step runs.
    expect(JSON.parse(init.body)).toEqual({ style: 'Ink & Wash' });

    expect(applyProject).toHaveBeenCalledWith(done);
    expect(toast).toHaveBeenCalledWith('Art Style complete');
  });

  it('omits the style so the model derives one from the book', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(jsonResponse(200, { project: baseProject({ statuses: ['done', 'ready', 'locked', 'locked', 'locked'] }) }));
    global.fetch = fetchMock;

    const { result } = renderHook(() => usePipeline(baseProject(), vi.fn(), vi.fn()));
    await act(async () => {
      await result.current.runStep();
    });

    expect(JSON.parse(fetchMock.mock.calls[0][1].body)).toEqual({});
  });

  it('treats HTTP 200 with a failed status as a failure, not a success', async () => {
    // The server returns 200 here: executeStep catches the Gemini error, records
    // it, and returns the project instead of rethrowing. Trusting res.ok would
    // report this as a completed step.
    const failed = baseProject({
      statuses: ['failed', 'locked', 'locked', 'locked', 'locked'],
      error: 'Gemini returned 500: high demand',
    });
    global.fetch = vi.fn().mockResolvedValue(jsonResponse(200, { project: failed }));

    const applyProject = vi.fn();
    const toast = vi.fn();
    const { result } = renderHook(() => usePipeline(baseProject(), applyProject, toast));
    await act(async () => {
      await result.current.runStep();
    });

    expect(applyProject).toHaveBeenCalledWith(failed);
    expect(toast).toHaveBeenCalledWith(expect.stringContaining('failed'));
    expect(toast).not.toHaveBeenCalledWith('Art Style complete');
  });

  it('surfaces the 409 duplicate-run guard and resyncs from the server', async () => {
    const running = baseProject({ statuses: ['running', 'locked', 'locked', 'locked', 'locked'] });
    global.fetch = vi.fn().mockImplementation((_url: string, init?: any) => {
      if (init?.method === 'POST') {
        return Promise.resolve(jsonResponse(409, { error: 'Step is already in progress' }));
      }
      return Promise.resolve(jsonResponse(200, { project: running }));
    });

    const applyProject = vi.fn();
    const toast = vi.fn();
    const { result } = renderHook(() => usePipeline(baseProject(), applyProject, toast));
    await act(async () => {
      await result.current.runStep();
    });

    expect(toast).toHaveBeenCalledWith(expect.stringContaining('409'));
    // It re-reads the true state rather than guessing locally.
    await waitFor(() => expect(applyProject).toHaveBeenCalledWith(running));
  });

  it('refuses to re-run a completed step without calling the server', async () => {
    const fetchMock = vi.fn();
    global.fetch = fetchMock;

    const done = baseProject({ statuses: ['done', 'ready', 'locked', 'locked', 'locked'] });
    const toast = vi.fn();
    const { result } = renderHook(() => usePipeline(done, vi.fn(), toast));

    await act(async () => {
      await result.current.runStep();
    });

    expect(fetchMock).not.toHaveBeenCalled();
    expect(toast).toHaveBeenCalledWith('This step is already complete');
  });

  it('refuses to run a locked step without calling the server', async () => {
    const fetchMock = vi.fn();
    global.fetch = fetchMock;

    const locked = baseProject({ statuses: ['done', 'locked', 'locked', 'locked', 'locked'] });
    const toast = vi.fn();
    const { result } = renderHook(() => usePipeline(locked, vi.fn(), toast));

    act(() => result.current.selectStep(1));
    await act(async () => {
      await result.current.runStep();
    });

    expect(fetchMock).not.toHaveBeenCalled();
    expect(toast).toHaveBeenCalledWith('Complete the preceding step first');
  });

  it('wires and executes Step 1 (Characters), Step 2 (Portraits), and Step 3 (Chapters) through usePipeline', async () => {
    // ── Step 2: Characters ──
    const step2Done = baseProject({
      statuses: ['done', 'done', 'ready', 'locked', 'locked'],
      characters: [
        { id: 'c1', name: 'Mole', description: 'A mole', prompt: 'A mole' },
        { id: 'c2', name: 'Ratty', description: 'A rat', prompt: 'A rat' },
      ],
    });
    let fetchMock = vi.fn().mockResolvedValue(jsonResponse(200, { project: step2Done }));
    global.fetch = fetchMock;

    let applyProject = vi.fn();
    let toast = vi.fn();
    const { result } = renderHook(() =>
      usePipeline(baseProject({ statuses: ['done', 'ready', 'locked', 'locked', 'locked'] }), applyProject, toast),
    );

    act(() => result.current.selectStep(1));
    await act(async () => {
      await result.current.runStep();
    });

    expect(fetchMock.mock.calls[0][0]).toBe('/api/projects/p_1/steps/1/run');
    expect(applyProject).toHaveBeenCalledWith(step2Done);
    expect(toast).toHaveBeenCalledWith('Characters complete');

    // ── Step 3: Portraits ──
    const step3Done = baseProject({
      statuses: ['done', 'done', 'done', 'ready', 'locked'],
      characters: [
        { id: 'c1', name: 'Mole', description: 'A mole', prompt: 'A mole', portraitUrl: '/api/projects/p_1/portraits/c1' },
        { id: 'c2', name: 'Ratty', description: 'A rat', prompt: 'A rat', portraitUrl: '/api/projects/p_1/portraits/c2' },
      ],
    });
    fetchMock = vi.fn().mockResolvedValue(jsonResponse(200, { project: step3Done }));
    global.fetch = fetchMock;

    const hook3 = renderHook(() =>
      usePipeline(step2Done, applyProject, toast),
    );
    act(() => hook3.result.current.selectStep(2));
    await act(async () => {
      await hook3.result.current.runStep();
    });

    expect(fetchMock.mock.calls[0][0]).toBe('/api/projects/p_1/steps/2/run');
    expect(applyProject).toHaveBeenCalledWith(step3Done);
    expect(toast).toHaveBeenCalledWith('Character Portraits complete');

    // ── Step 4: Chapters ──
    const step4Done = baseProject({
      statuses: ['done', 'done', 'done', 'done', 'ready'],
      chapters: [
        { id: 'ch1', name: 'Chapter I', prompt: 'Mole and Ratty on river', characters: ['Mole', 'Ratty'] },
      ],
    });
    fetchMock = vi.fn().mockResolvedValue(jsonResponse(200, { project: step4Done }));
    global.fetch = fetchMock;

    const hook4 = renderHook(() =>
      usePipeline(step3Done, applyProject, toast),
    );
    act(() => hook4.result.current.selectStep(3));
    await act(async () => {
      await hook4.result.current.runStep();
    });

    expect(fetchMock.mock.calls[0][0]).toBe('/api/projects/p_1/steps/3/run');
    expect(applyProject).toHaveBeenCalledWith(step4Done);
    expect(toast).toHaveBeenCalledWith('Chapter Scene complete');
  });
});
