export type StepStatus = 'ready' | 'running' | 'done' | 'failed' | 'stale' | 'locked';

export interface User {
  id: string;
  name: string;
  email: string;
  createdAt: string;
}

export interface CharacterItem {
  id: string;
  name: string;
  description: string;
  prompt: string;
  portraitUrl?: string;
}

export interface ChapterItem {
  id: string;
  name: string;
  prompt: string;
  characters: string[];
  illustrationUrl?: string;
}

export interface StepAttempt {
  id: string;
  stepIndex: number;
  startedAt: string;
  finishedAt: string;
  durationMs: number;
  status: 'done' | 'failed';
  error?: string | null;
}

/** The chain of Gemini interaction ids; each step reads the previous one. */
export interface ProjectInteractions {
  ingestionId?: string;
  styleId?: string;
  charactersId?: string;
  portraitsId?: string;
  chaptersId?: string;
  illustrationId?: string;
}

export interface Project {
  id: string;
  title: string;
  bookText: string;
  wordCount: number;
  style: string | null;
  chapterIndex: number | null;
  statuses: StepStatus[];
  characters: CharacterItem[];
  chapters: ChapterItem[];
  interactions: ProjectInteractions;
  attempts?: StepAttempt[];
  /** Message from the last failed step; cleared when a step starts. */
  error?: string | null;
  stepStartedAt?: number | null;
  createdAt: string;
  updatedAt: string;
}
