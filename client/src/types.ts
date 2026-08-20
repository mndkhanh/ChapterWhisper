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
  createdAt: string;
  updatedAt: string;
}
