import type { Project } from '../types.js';
import { ApiError, request } from './http.js';

/**
 * A step that ran but did not succeed.
 *
 * The server answers **HTTP 200 with a `failed` project** when a Gemini call
 * throws: `executeStep` catches, records the error on the project, and returns
 * it rather than rethrowing, so the route never sees an exception. `res.ok` is
 * therefore not a usable success signal — the real signal is
 * `project.statuses[stepIndex]`. This class exists so that trap is handled in
 * exactly one place instead of in every caller.
 */
export class StepFailedError extends Error {
  constructor(
    message: string,
    readonly project: Project,
    readonly stepIndex: number,
  ) {
    super(message);
    this.name = 'StepFailedError';
  }
}

export function listProjects(): Promise<Project[]> {
  return request<{ projects: Project[] }>('GET', '/api/projects').then((r) => r.projects);
}

export function getProject(id: string): Promise<Project> {
  return request<{ project: Project }>('GET', `/api/projects/${id}`).then((r) => r.project);
}

/**
 * Creates the project and, server-side, runs "step 00" — the one and only time
 * the manuscript is sent to Gemini. Every later step chains off the interaction
 * id this produces.
 *
 * Note the server swallows an ingestion failure and still returns 201, just
 * without `interactions.ingestionId`. Callers should check `ingestionFailed`.
 */
export async function createProject(title: string, bookText: string): Promise<{
  project: Project;
  ingestionFailed: boolean;
}> {
  const { project } = await request<{ project: Project }>('POST', '/api/projects', {
    title,
    bookText,
  });
  return { project, ingestionFailed: !project.interactions?.ingestionId };
}

/**
 * Runs one pipeline step. Blocks for the full Gemini call.
 *
 * Throws `ApiError(409)` if the step is already running (the server-side
 * duplicate guard — a second tab or a double-click), `ApiError(400)` if a
 * preceding step has not completed, and `StepFailedError` if the call ran and
 * failed. `style` is only meaningful for step 0; omit it to have the model
 * derive a style from the book instead.
 */
export async function runStep(
  projectId: string,
  stepIndex: number,
  style?: string,
): Promise<Project> {
  const { project } = await request<{ project: Project }>(
    'POST',
    `/api/projects/${projectId}/steps/${stepIndex}/run`,
    style ? { style } : {},
  );

  if (project.statuses[stepIndex] === 'failed') {
    throw new StepFailedError(project.error || 'The step failed', project, stepIndex);
  }
  return project;
}

export { ApiError };
