import path from 'node:path';
import { promises as fs } from 'node:fs';
import { getDataDir } from '../config.js';
import { readJson, updateJson, writeJsonAtomic } from '../storage/json-file.js';
import type { Project } from './types.js';

import { projectEvents } from './events.js';

function projectFilePath(id: string): string {
  return path.join(getDataDir(), 'projects', `${id}.json`);
}

export async function getProject(id: string): Promise<Project | null> {
  const file = projectFilePath(id);
  const proj = await readJson<Project | null>(file, null);
  return proj;
}

export async function saveProject(project: Project): Promise<Project> {
  const file = projectFilePath(project.id);
  project.updatedAt = new Date().toISOString();
  await writeJsonAtomic(file, project);
  projectEvents.emitProjectUpdate(project);
  return project;
}

export async function mutateProject(
  id: string,
  mutate: (current: Project) => Project | Promise<Project>
): Promise<Project> {
  const file = projectFilePath(id);
  const updated = await updateJson<Project>(file, null as unknown as Project, async (current) => {
    if (!current) {
      throw new Error(`Project ${id} not found`);
    }
    const next = await mutate(current);
    next.updatedAt = new Date().toISOString();
    return next;
  });
  projectEvents.emitProjectUpdate(updated);
  return updated;
}

export async function listUserProjects(userId: string): Promise<Project[]> {
  const dir = path.join(getDataDir(), 'projects');
  await fs.mkdir(dir, { recursive: true });
  const entries = await fs.readdir(dir);
  const jsonFiles = entries.filter((e) => e.endsWith('.json'));
  const list: Project[] = [];
  for (const f of jsonFiles) {
    const p = await readJson<Project | null>(path.join(dir, f), null);
    if (p && p.userId === userId) {
      list.push(p);
    }
  }
  return list.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
}
