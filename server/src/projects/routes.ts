import { Router } from 'express';
import { z } from 'zod';
import path from 'node:path';
import { promises as fs } from 'node:fs';
import { getDataDir } from '../config.js';
import { requireAuth, type AuthedRequest } from '../auth/middleware.js';
import { getProject, saveProject, listUserProjects, mutateProject } from './project-store.js';
import { ingestBook, executeStep } from './pipeline-runner.js';
import type { Project } from './types.js';

export const projectsRouter = Router();

projectsRouter.use(requireAuth);

const createProjectSchema = z.object({
  title: z.string().trim().min(1).max(120),
  bookText: z.string().trim().min(1),
});

projectsRouter.get('/', async (req, res) => {
  const user = (req as AuthedRequest).user;
  const projects = await listUserProjects(user.id);
  res.json({ projects });
});

projectsRouter.post('/', async (req, res) => {
  const user = (req as AuthedRequest).user;
  const parsed = createProjectSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'A title and manuscript text are required' });
    return;
  }

  const id = 'p_' + Date.now();
  const wordCount = parsed.data.bookText.split(/\s+/).length;
  const newProject: Project = {
    id,
    userId: user.id,
    title: parsed.data.title,
    bookText: parsed.data.bookText,
    wordCount,
    style: null,
    chapterIndex: null,
    statuses: ['ready', 'locked', 'locked', 'locked', 'locked'],
    characters: [],
    chapters: [],
    interactions: {},
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  try {
    const ingestionId = await ingestBook(newProject);
    newProject.interactions.ingestionId = ingestionId;
  } catch (err: any) {
    // If Gemini key is not configured or offline during creation, skip anchor
  }

  await saveProject(newProject);
  res.status(201).json({ project: newProject });
});

projectsRouter.get('/:id', async (req, res) => {
  const user = (req as unknown as AuthedRequest).user;
  const project = await getProject(req.params.id);
  if (!project || project.userId !== user.id) {
    res.status(404).json({ error: 'Project not found' });
    return;
  }
  res.json({ project });
});

projectsRouter.post('/:id/steps/:stepIndex/run', async (req, res) => {
  const user = (req as unknown as AuthedRequest).user;
  const stepIndex = Number(req.params.stepIndex);
  if (isNaN(stepIndex) || stepIndex < 0 || stepIndex > 4) {
    res.status(400).json({ error: 'Step index must be between 0 and 4' });
    return;
  }

  const project = await getProject(req.params.id);
  if (!project || project.userId !== user.id) {
    res.status(404).json({ error: 'Project not found' });
    return;
  }

  try {
    const updated = await executeStep(project, stepIndex, req.body?.style);
    res.json({ project: updated });
  } catch (err: any) {
    res.status(err.status || 500).json({ error: err.message || 'Step execution failed' });
  }
});

projectsRouter.get('/:id/portraits/:charId', async (req, res) => {
  const user = (req as unknown as AuthedRequest).user;
  const project = await getProject(req.params.id);
  if (!project || project.userId !== user.id) {
    res.status(404).json({ error: 'Not found' });
    return;
  }
  const filePath = path.join(getDataDir(), 'storage', project.id, 'portraits', `${req.params.charId}.png`);
  try {
    await fs.access(filePath);
    res.setHeader('Content-Type', 'image/png');
    res.sendFile(filePath);
  } catch {
    res.status(404).json({ error: 'Portrait image not found' });
  }
});

projectsRouter.get('/:id/illustrations/:chId', async (req, res) => {
  const user = (req as unknown as AuthedRequest).user;
  const project = await getProject(req.params.id);
  if (!project || project.userId !== user.id) {
    res.status(404).json({ error: 'Not found' });
    return;
  }
  const filePath = path.join(getDataDir(), 'storage', project.id, 'illustrations', `${req.params.chId}.png`);
  try {
    await fs.access(filePath);
    res.setHeader('Content-Type', 'image/png');
    res.sendFile(filePath);
  } catch {
    res.status(404).json({ error: 'Illustration image not found' });
  }
});
