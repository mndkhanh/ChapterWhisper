import { useState, useCallback, useEffect } from 'react';
import type { Project } from '../types.js';
import * as api from '../api/projects.js';
import { ApiError, StepFailedError } from '../api/projects.js';

const STEP_NAMES = ['Art Style', 'Characters', 'Character Portraits', 'Chapter Scene', 'Illustration'];

/**
 * Drives the pipeline against the server.
 *
 * Every run is one blocking HTTP call — `executeStep` persists `running`, then
 * awaits the whole Gemini call before responding, so the browser sits on an
 * open request for 10-30s (longer for images). `busyStep` is the local mirror
 * of that wait; the authoritative `running` lives on the server, which is what
 * makes the duplicate guard work across tabs.
 *
 * Real-time state synchronization is delivered over SSE (`/api/projects/:id/events`).
 * Nothing here retries automatically. A failed step stays failed until the user
 * presses the button again — the PRD forbids automatic retries.
 */
export function usePipeline(
  activeProject: Project | undefined,
  applyProject: (p: Project) => void,
  onToast: (msg: string) => void,
) {
  const [stepIndex, setStepIndex] = useState(0);
  const [customStyle, setCustomStyle] = useState('');
  const [busyStep, setBusyStep] = useState<number | null>(null);

  // Real-time step and project updates via WebSocket
  useEffect(() => {
    if (!activeProject?.id || typeof WebSocket === 'undefined') return;

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws?projectId=${encodeURIComponent(activeProject.id)}`;
    let socket: WebSocket | null = null;
    let reconnectTimeout: ReturnType<typeof setTimeout> | null = null;
    let isDisposed = false;

    function connect() {
      if (isDisposed) return;
      try {
        socket = new WebSocket(wsUrl);

        socket.onopen = () => {
          socket?.send(JSON.stringify({ type: 'subscribe', projectId: activeProject!.id }));
        };

        socket.onmessage = (e) => {
          try {
            const payload = JSON.parse(e.data);
            if (payload?.project && payload.project.id === activeProject!.id) {
              applyProject(payload.project);
            }
          } catch {}
        };

        socket.onclose = () => {
          if (!isDisposed) {
            reconnectTimeout = setTimeout(connect, 3000);
          }
        };

        socket.onerror = () => {
          socket?.close();
        };
      } catch {}
    }

    connect();

    return () => {
      isDisposed = true;
      if (reconnectTimeout) clearTimeout(reconnectTimeout);
      if (socket) {
        socket.onclose = null;
        socket.close();
      }
    };
  }, [activeProject?.id, applyProject]);

  // Step 0's style is chosen in the browser and only reaches the server when the
  // step actually runs, as the `{ style }` body. Until then it is a selection,
  // not project state — the server has no "set style" endpoint.
  const [pendingStyle, setPendingStyle] = useState<string | null>(null);

  // Step 3 selection. Not yet persisted anywhere: the server sets chapterIndex
  // itself in step 04, and there is no endpoint to override it. Local only.
  const [pendingChapterIndex, setPendingChapterIndex] = useState<number | null>(null);

  const selectStep = useCallback((idx: number) => setStepIndex(idx), []);

  const updateStyle = useCallback(
    (style: string) => {
      setPendingStyle(style);
      onToast(`Art style set to ${style} · press Generate to apply it`);
    },
    [onToast],
  );

  const applyCustomStyle = useCallback(() => {
    const trimmed = customStyle.trim();
    if (!trimmed) return;
    setPendingStyle(trimmed);
    setCustomStyle('');
    onToast('Custom art style staged · press Generate to apply it');
  }, [customStyle, onToast]);

  const selectChapter = useCallback(
    (idx: number) => {
      setPendingChapterIndex(idx);
      onToast('Chapter scene selected');
    },
    [onToast],
  );

  const runStep = useCallback(async () => {
    if (!activeProject || busyStep !== null) return;

    const status = activeProject.statuses[stepIndex];
    if (status === 'locked') {
      onToast('Complete the preceding step first');
      return;
    }
    // A completed step is final — the server rejects a re-run with 409, so do
    // not spend a request discovering that.
    if (status === 'done') {
      onToast('This step is already complete');
      return;
    }

    // Step 0 only: send the chosen style, or nothing to let the model derive one
    // from the book.
    const style = stepIndex === 0 ? pendingStyle ?? undefined : undefined;

    setBusyStep(stepIndex);
    try {
      const updated = await api.runStep(activeProject.id, stepIndex, style);
      applyProject(updated);
      if (stepIndex === 0) setPendingStyle(null);
      onToast(`${STEP_NAMES[stepIndex]} complete`);
    } catch (err) {
      if (err instanceof StepFailedError) {
        // The step ran and failed. Keep the server's copy so the UI shows
        // `failed` and the stored message, and leave it retryable.
        applyProject(err.project);
        onToast(`${STEP_NAMES[stepIndex]} failed · ${err.message}`);
      } else if (err instanceof ApiError && err.status === 409) {
        // Another tab, or a double-click, is already running this step.
        onToast('409 · this step is already running somewhere else');
        try {
          applyProject(await api.getProject(activeProject.id));
        } catch {
          /* the toast already told the user */
        }
      } else if (err instanceof ApiError && err.status === 401) {
        onToast('Your session expired — please sign in again');
      } else {
        onToast((err as Error).message || 'Could not run the step');
      }
    } finally {
      setBusyStep(null);
    }
  }, [activeProject, busyStep, stepIndex, pendingStyle, applyProject, onToast]);

  const nextStep = useCallback(() => setStepIndex((i) => Math.min(i + 1, 4)), []);
  const prevStep = useCallback(() => setStepIndex((i) => Math.max(i - 1, 0)), []);

  return {
    stepIndex,
    setStepIndex,
    customStyle,
    setCustomStyle,
    busyStep,
    pendingStyle,
    pendingChapterIndex,
    selectStep,
    updateStyle,
    applyCustomStyle,
    selectChapter,
    runStep,
    nextStep,
    prevStep,
  };
}
