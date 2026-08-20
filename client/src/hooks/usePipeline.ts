import { useState, useCallback } from 'react';
import type { Project } from '../types.js';

const STEP_NAMES = ['Art Style', 'Characters', 'Character Portraits', 'Chapter Scene', 'Illustration'];

export function usePipeline(
  activeProject: Project | undefined,
  updateActiveProject: (updater: (p: Project) => void) => void,
  onToast: (msg: string) => void
) {
  const [stepIndex, setStepIndex] = useState(0);
  const [customStyle, setCustomStyle] = useState('');

  const selectStep = useCallback((idx: number) => {
    setStepIndex(idx);
  }, []);

  const updateStyle = useCallback((style: string) => {
    updateActiveProject((p) => {
      p.style = style;
    });
    onToast(`Art style set to ${style}`);
  }, [updateActiveProject, onToast]);

  const applyCustomStyle = useCallback(() => {
    if (!customStyle.trim()) return;
    updateStyle(customStyle.trim());
    setCustomStyle('');
  }, [customStyle, updateStyle]);

  const selectChapter = useCallback((idx: number) => {
    updateActiveProject((p) => {
      p.chapterIndex = idx;
    });
    onToast(`Chapter scene selected`);
  }, [updateActiveProject, onToast]);

  const runStep = useCallback(() => {
    if (!activeProject) return;
    const currentStatus = activeProject.statuses[stepIndex];
    if (currentStatus === 'running') {
      onToast('409 Conflict · step is already in progress');
      return;
    }
    if (currentStatus === 'locked') {
      onToast('Complete preceding step first');
      return;
    }
    if (stepIndex === 0 && !activeProject.style) {
      onToast('Please select or specify an art style');
      return;
    }

    updateActiveProject((p) => {
      p.statuses[stepIndex] = 'running';
    });

    window.setTimeout(() => {
      updateActiveProject((p) => {
        p.statuses[stepIndex] = 'done';
        if (stepIndex < 4 && p.statuses[stepIndex + 1] === 'locked') {
          p.statuses[stepIndex + 1] = 'ready';
        }
      });
      onToast(`${STEP_NAMES[stepIndex]} complete`);
    }, 1800);
  }, [activeProject, stepIndex, updateActiveProject, onToast]);

  const nextStep = useCallback(() => {
    if (stepIndex < 4) setStepIndex((prev) => prev + 1);
  }, [stepIndex]);

  const prevStep = useCallback(() => {
    if (stepIndex > 0) setStepIndex((prev) => prev - 1);
  }, [stepIndex]);

  return {
    stepIndex,
    setStepIndex,
    customStyle,
    setCustomStyle,
    selectStep,
    updateStyle,
    applyCustomStyle,
    selectChapter,
    runStep,
    nextStep,
    prevStep,
  };
}

