import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useProjects } from '../hooks/useProjects.js';
import type { Project, User } from '../types.js';

function jsonResponse(status: number, body: unknown): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    text: () => Promise.resolve(JSON.stringify(body)),
  } as unknown as Response;
}

const mockUser: User = {
  id: 'u_1',
  email: 'ada@example.com',
  name: 'Ada Lovelace',
  createdAt: new Date().toISOString(),
};

const sampleProject: Project = {
  id: 'p_1',
  title: 'The Secret Garden',
  bookText: 'Once upon a time...',
  wordCount: 150,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  style: 'Ink & Wash',
  chapterIndex: 0,
  statuses: ['ready', 'locked', 'locked', 'locked', 'locked'],
  characters: [],
  chapters: [],
  interactions: { ingestionId: 'int_0' },
};

describe('useProjects hook', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('fetches and populates project list when user is present', async () => {
    global.fetch = vi.fn().mockResolvedValue(jsonResponse(200, { projects: [sampleProject] }));

    const onToast = vi.fn();
    const { result } = renderHook(() => useProjects(mockUser, onToast));

    await waitFor(() => expect(result.current.projects).toHaveLength(1));
    expect(result.current.projects[0].title).toBe('The Secret Garden');
  });

  it('clears project shelf when user is null / signs out', async () => {
    global.fetch = vi.fn().mockResolvedValue(jsonResponse(200, { projects: [sampleProject] }));

    const onToast = vi.fn();
    let currentUser: User | null = mockUser;
    const { result, rerender } = renderHook(() => useProjects(currentUser, onToast));

    await waitFor(() => expect(result.current.projects).toHaveLength(1));

    currentUser = null;
    rerender();

    expect(result.current.projects).toEqual([]);
    expect(result.current.activeProject).toBeUndefined();
  });

  it('creates project, applies it to the list, and sets it active', async () => {
    global.fetch = vi.fn().mockResolvedValueOnce(jsonResponse(200, { projects: [] }));

    const onToast = vi.fn();
    const { result } = renderHook(() => useProjects(mockUser, onToast));

    await waitFor(() => expect(result.current.loading).toBe(false));

    global.fetch = vi.fn().mockResolvedValueOnce(jsonResponse(201, { project: sampleProject }));

    let created: Project | null = null;
    await act(async () => {
      created = await result.current.createProject('The Secret Garden', 'Full manuscript text');
    });

    expect(created).toEqual(sampleProject);
    expect(result.current.projects).toContainEqual(sampleProject);
    expect(result.current.activeProject).toEqual(sampleProject);
    expect(onToast).toHaveBeenCalledWith('Manuscript ingested · ready for step one');
  });

  it('validates blank title and manuscript text before posting', async () => {
    global.fetch = vi.fn().mockResolvedValue(jsonResponse(200, { projects: [] }));

    const onToast = vi.fn();
    const { result } = renderHook(() => useProjects(mockUser, onToast));

    await act(async () => {
      const res = await result.current.createProject('   ', 'some text');
      expect(res).toBeNull();
    });
    expect(onToast).toHaveBeenCalledWith('Please provide a title');

    await act(async () => {
      const res = await result.current.createProject('Valid Title', '   ');
      expect(res).toBeNull();
    });
    expect(onToast).toHaveBeenCalledWith('Please paste or upload the manuscript text');
  });

  it('opens project by id and syncs fresh data from server', async () => {
    global.fetch = vi.fn().mockResolvedValueOnce(jsonResponse(200, { projects: [sampleProject] }));

    const onToast = vi.fn();
    const { result } = renderHook(() => useProjects(mockUser, onToast));

    await waitFor(() => expect(result.current.projects).toHaveLength(1));

    const updatedProject: Project = {
      ...sampleProject,
      statuses: ['done', 'ready', 'locked', 'locked', 'locked'],
    };
    global.fetch = vi.fn().mockResolvedValueOnce(jsonResponse(200, { project: updatedProject }));

    let opened: Project | null = null;
    await act(async () => {
      opened = await result.current.openProject('p_1');
    });

    expect(opened).toEqual(updatedProject);
    expect(result.current.activeProject).toEqual(updatedProject);
    expect(result.current.projects[0].statuses[0]).toBe('done');
  });
});
