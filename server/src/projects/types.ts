export type StepStatus = 'locked' | 'ready' | 'running' | 'done' | 'failed' | 'stale';

export interface Character {
  id: string;
  name: string;
  description?: string;
  prompt: string;
  portraitUrl?: string;
}

export interface Chapter {
  id: string;
  name: string;
  prompt: string;
  /** Display names the model reported for the cast of this scene. */
  characters?: string[];
  /** The same cast as our own character ids — the authoritative link. */
  characterIds?: string[];
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

export interface Project {
  id: string;
  userId: string;
  title: string;
  bookText: string;
  wordCount: number;
  style: string | null;
  chapterIndex: number | null;
  statuses: StepStatus[];
  characters: Character[];
  chapters: Chapter[];
  interactions: {
    ingestionId?: string;
    styleId?: string;
    charactersId?: string;
    portraitsId?: string;
    chaptersId?: string;
    illustrationId?: string;
  };
  attempts?: StepAttempt[];
  error?: string | null;
  stepStartedAt?: number | null;
  createdAt: string;
  updatedAt: string;
}
