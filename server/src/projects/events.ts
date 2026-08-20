import { EventEmitter } from 'node:events';
import type { Project } from './types.js';

export interface ProjectEvent {
  type: 'project_updated' | 'step_started' | 'step_completed' | 'step_failed';
  project: Project;
  stepIndex?: number;
  error?: string | null;
  timestamp: string;
}

class ProjectEventEmitter extends EventEmitter {
  emitProjectUpdate(project: Project, type: ProjectEvent['type'] = 'project_updated', stepIndex?: number, error?: string | null) {
    const event: ProjectEvent = {
      type,
      project,
      stepIndex,
      error,
      timestamp: new Date().toISOString(),
    };
    this.emit(`project:${project.id}`, event);
    this.emit('project_update_broadcast', event);
  }

  subscribe(projectId: string, listener: (event: ProjectEvent) => void) {
    const channel = `project:${projectId}`;
    this.on(channel, listener);
    return () => {
      this.off(channel, listener);
    };
  }
}

export const projectEvents = new ProjectEventEmitter();
