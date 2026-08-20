import { useState, useEffect, useCallback, useRef } from 'react';
import type { Project, User } from '../types.js';
import * as api from '../api/projects.js';

/**
 * Projects, backed by the server.
 *
 * There is deliberately no localStorage here. The server's JSON store is the
 * only source of truth, which is what makes the pipeline resumable across a
 * refresh, a logout, or a server restart — a cached copy in the browser would
 * just be a second, staler answer.
 */
export function useProjects(user: User | null, onToast: (msg: string) => void) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);

  const activeProject = projects.find((p) => p.id === activeId);

  // Held in a ref so an unmemoized callback from the caller cannot churn the
  // dependencies of `refresh` and re-fire the load effect on every render.
  const toastRef = useRef(onToast);
  toastRef.current = onToast;

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      setProjects(await api.listProjects());
    } catch (err: any) {
      if (err?.status !== 401) toastRef.current(err?.message || 'Could not load your library');
    } finally {
      setLoading(false);
    }
  }, []);

  // Load on sign-in; drop everything on sign-out so the next user never sees
  // the previous user's shelf.
  useEffect(() => {
    if (!user) {
      setProjects([]);
      setActiveId(null);
      return;
    }
    void refresh();
  }, [user, refresh]);

  /** Merge a server response back into the list. The server's copy always wins. */
  const applyProject = useCallback((updated: Project) => {
    setProjects((prev) => {
      const found = prev.some((p) => p.id === updated.id);
      return found ? prev.map((p) => (p.id === updated.id ? updated : p)) : [updated, ...prev];
    });
  }, []);

  const createProject = useCallback(
    async (title: string, text: string): Promise<Project | null> => {
      if (!title.trim()) {
        toastRef.current('Please provide a title');
        return null;
      }
      if (!text.trim()) {
        toastRef.current('Please paste or upload the manuscript text');
        return null;
      }

      setCreating(true);
      try {
        const { project, ingestionFailed } = await api.createProject(title.trim(), text.trim());
        applyProject(project);
        setActiveId(project.id);
        // A 201 does not mean the book reached Gemini — the server swallows an
        // ingestion failure. Say so now rather than letting step 01 quietly run
        // against a model that never saw the manuscript.
        toastRef.current(
          ingestionFailed
            ? 'Project created, but the manuscript never reached Gemini — check the server key'
            : 'Manuscript ingested · ready for step one',
        );
        return project;
      } catch (err: any) {
        toastRef.current(err?.message || 'Could not create the project');
        return null;
      } finally {
        setCreating(false);
      }
    },
    [applyProject],
  );

  /** Opens a project, re-fetching it so a mid-step refresh shows the true state. */
  const openProject = useCallback(
    async (id: string): Promise<Project | null> => {
      setActiveId(id);
      try {
        const fresh = await api.getProject(id);
        applyProject(fresh);
        return fresh;
      } catch (err: any) {
        toastRef.current(err?.message || 'Could not open that project');
        return null;
      }
    },
    [applyProject],
  );

  return {
    projects,
    loading,
    creating,
    activeProject,
    activeId,
    setActiveId,
    createProject,
    openProject,
    applyProject,
    refresh,
  };
}
