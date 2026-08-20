import { useState, useEffect, useCallback } from 'react';
import type { Project } from '../types.js';

const INITIAL_PROJECTS: Project[] = [
  {
    id: 'p1',
    title: 'The Whisperwood Codex',
    bookText: 'A wizarding-school tale of alchemy and shadows...',
    wordCount: 41200,
    style: 'Ink & Wash',
    chapterIndex: 0,
    statuses: ['done', 'done', 'done', 'done', 'done'],
    characters: [
      { id: 'c1', name: 'Prof. Adelaide Crane', description: 'Elder alchemist in velvet robes', prompt: 'Portrait of Prof. Adelaide Crane' },
      { id: 'c2', name: 'Silas Vane', description: 'Curator of forbidden manuscripts', prompt: 'Portrait of Silas Vane' },
    ],
    chapters: [
      { id: 'ch1', name: 'I. The Letter Beneath the Door', prompt: 'Adelaide finding the letter', characters: ['Prof. Adelaide Crane'] },
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

export function useProjects(onToast: (msg: string) => void) {
  const [projects, setProjects] = useState<Project[]>(() => {
    const saved = localStorage.getItem('cw_projects');
    if (saved) {
      try { return JSON.parse(saved); } catch {}
    }
    return INITIAL_PROJECTS;
  });

  const [activeId, setActiveId] = useState<string | null>(null);

  useEffect(() => {
    localStorage.setItem('cw_projects', JSON.stringify(projects));
  }, [projects]);

  const activeProject = projects.find((p) => p.id === activeId) || projects[0];

  const createProject = useCallback((title: string, text: string) => {
    if (!title.trim()) {
      onToast('Please provide a title');
      return null;
    }
    const id = 'p' + Date.now();
    const newProj: Project = {
      id,
      title: title.trim(),
      bookText: text.trim() || 'Sample manuscript content...',
      wordCount: text.trim() ? text.trim().split(/\s+/).length : 5000,
      style: null,
      chapterIndex: null,
      statuses: ['ready', 'locked', 'locked', 'locked', 'locked'],
      characters: [
        { id: 'c1', name: 'Prof. Adelaide Crane', description: 'Adult · principal alchemist', prompt: 'Close-up portrait of Prof. Adelaide Crane' },
        { id: 'c2', name: 'Silas Vane', description: 'Adult · scholar of ancient seals', prompt: 'Close-up portrait of Silas Vane' },
      ],
      chapters: [
        { id: 'ch1', name: 'I. The Letter Beneath the Door', prompt: 'Scene illustrating the discovery of the seal', characters: ['Prof. Adelaide Crane', 'Silas Vane'] },
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setProjects((prev) => [newProj, ...prev]);
    setActiveId(id);
    onToast('Manuscript project created');
    return id;
  }, [onToast]);

  const updateActiveProject = useCallback((updater: (p: Project) => void) => {
    setProjects((prev) =>
      prev.map((p) => {
        if (p.id === activeId) {
          const clone = { ...p, statuses: [...p.statuses] };
          updater(clone);
          clone.updatedAt = new Date().toISOString();
          return clone;
        }
        return p;
      })
    );
  }, [activeId]);

  return { projects, setProjects, activeProject, activeId, setActiveId, createProject, updateActiveProject };
}

