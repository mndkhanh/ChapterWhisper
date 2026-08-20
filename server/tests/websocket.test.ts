import { describe, it, expect, vi, beforeEach, afterEach, afterAll } from 'vitest';
import http from 'node:http';
import { WebSocket } from 'ws';
import { randomUUID } from 'node:crypto';
import os from 'node:os';
import path from 'node:path';
import { promises as fs } from 'node:fs';
import { createApp } from '../src/app.js';
import { setupWebSocketServer } from '../src/websocket.js';
import { signToken } from '../src/auth/jwt.js';
import { SESSION_COOKIE } from '../src/auth/cookie.js';
import { projectEvents } from '../src/projects/events.js';
import type { Project } from '../src/projects/types.js';

const dataDir = path.join(os.tmpdir(), `chapterwhisper-ws-${randomUUID()}`);
process.env.STORAGE_DIR = dataDir;
process.env.JWT_SECRET = 'test-secret';

afterAll(async () => {
  await fs.rm(dataDir, { recursive: true, force: true });
});

describe('WebSocket Server', () => {
  let server: http.Server;
  let port: number;
  const user = { id: 'u_ws_1', email: 'ws@atelier.co', name: 'WebSocket Tester' };
  const validToken = signToken(user);

  beforeEach(async () => {
    const app = createApp();
    server = http.createServer(app);
    setupWebSocketServer(server);

    await new Promise<void>((resolve) => {
      server.listen(0, () => {
        const addr = server.address();
        if (typeof addr === 'object' && addr) {
          port = addr.port;
        }
        resolve();
      });
    });
  });

  afterEach(async () => {
    await new Promise<void>((resolve) => server.close(() => resolve()));
  });

  it('rejects connection without valid session cookie', async () => {
    const ws = new WebSocket(`ws://localhost:${port}/ws`);
    const errorPromise = new Promise((resolve) => {
      ws.on('unexpected-response', (_req, res) => {
        expect(res.statusCode).toBe(401);
        resolve(true);
      });
      ws.on('error', () => {
        resolve(true);
      });
    });

    await errorPromise;
  });

  it('authenticates and receives connected message with valid session cookie', async () => {
    const ws = new WebSocket(`ws://localhost:${port}/ws?projectId=p_ws_100`, {
      headers: {
        Cookie: `${SESSION_COOKIE}=${validToken}`,
      },
    });

    const messagePromise = new Promise<any>((resolve) => {
      ws.on('message', (data) => {
        resolve(JSON.parse(data.toString()));
      });
    });

    const msg = await messagePromise;
    expect(msg.type).toBe('connected');
    expect(msg.user.id).toBe(user.id);
    ws.close();
  });

  it('receives broadcast project update event when subscribed', async () => {
    const ws = new WebSocket(`ws://localhost:${port}/ws?projectId=p_broadcast_1`, {
      headers: {
        Cookie: `${SESSION_COOKIE}=${validToken}`,
      },
    });

    const messages: any[] = [];
    const receivedExpectedEvent = new Promise<void>((resolve) => {
      ws.on('message', (data) => {
        const parsed = JSON.parse(data.toString());
        messages.push(parsed);
        if (parsed.type === 'project_updated' && parsed.project.id === 'p_broadcast_1') {
          resolve();
        }
      });
    });

    // Wait until connected message arrives
    await new Promise((r) => setTimeout(r, 50));

    const sampleProject: Project = {
      id: 'p_broadcast_1',
      userId: user.id,
      title: 'Broadcasted Tale',
      bookText: 'Story',
      wordCount: 100,
      style: 'Ink & Wash',
      chapterIndex: 0,
      statuses: ['done', 'ready', 'locked', 'locked', 'locked'],
      characters: [],
      chapters: [],
      interactions: {},
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    projectEvents.emitProjectUpdate(sampleProject, 'project_updated');

    await receivedExpectedEvent;
    expect(messages.some((m) => m.type === 'project_updated' && m.project.title === 'Broadcasted Tale')).toBe(true);
    ws.close();
  });
});
