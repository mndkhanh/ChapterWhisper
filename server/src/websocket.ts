import { WebSocketServer, WebSocket } from 'ws';
import type { Server as HttpServer, IncomingMessage } from 'node:http';
import { parse as parseUrl } from 'node:url';
import { SESSION_COOKIE } from './auth/cookie.js';
import { verifyToken } from './auth/jwt.js';
import { projectEvents, type ProjectEvent } from './projects/events.js';
import type { User } from './users/user-store.js';

interface AuthenticatedSocket extends WebSocket {
  user?: User;
  isAlive?: boolean;
  subscribedProjects?: Set<string>;
}

function parseCookies(cookieHeader?: string): Record<string, string> {
  const list: Record<string, string> = {};
  if (!cookieHeader) return list;

  cookieHeader.split(';').forEach((cookie) => {
    const parts = cookie.split('=');
    const name = parts.shift()?.trim();
    if (name) {
      list[name] = decodeURIComponent(parts.join('='));
    }
  });

  return list;
}

export function setupWebSocketServer(httpServer: HttpServer): WebSocketServer {
  const wss = new WebSocketServer({ noServer: true });

  httpServer.on('upgrade', (req: IncomingMessage, socket, head) => {
    const { pathname } = parseUrl(req.url || '', true);

    if (pathname !== '/ws') {
      socket.destroy();
      return;
    }

    const cookies = parseCookies(req.headers.cookie);
    const token = cookies[SESSION_COOKIE];
    let user: User | null = null;

    if (token) {
      try {
        const payload = verifyToken(token);
        user = {
          id: payload.sub,
          email: payload.email,
          name: '',
          createdAt: new Date().toISOString(),
        };
      } catch {
        user = null;
      }
    }

    if (!user) {
      socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n');
      socket.destroy();
      return;
    }

    wss.handleUpgrade(req, socket, head, (ws) => {
      const authWs = ws as AuthenticatedSocket;
      authWs.user = user!;
      authWs.isAlive = true;
      authWs.subscribedProjects = new Set<string>();

      const { query } = parseUrl(req.url || '', true);
      if (typeof query.projectId === 'string' && query.projectId) {
        authWs.subscribedProjects.add(query.projectId);
      }

      wss.emit('connection', authWs, req);
    });
  });

  wss.on('connection', (ws: AuthenticatedSocket) => {
    ws.isAlive = true;

    ws.on('pong', () => {
      ws.isAlive = true;
    });

    ws.send(
      JSON.stringify({
        type: 'connected',
        user: ws.user,
        timestamp: new Date().toISOString(),
      }),
    );

    ws.on('message', (data) => {
      try {
        const msg = JSON.parse(data.toString());
        if (msg.type === 'subscribe' && typeof msg.projectId === 'string') {
          ws.subscribedProjects?.add(msg.projectId);
          ws.send(JSON.stringify({ type: 'subscribed', projectId: msg.projectId }));
        } else if (msg.type === 'unsubscribe' && typeof msg.projectId === 'string') {
          ws.subscribedProjects?.delete(msg.projectId);
          ws.send(JSON.stringify({ type: 'unsubscribed', projectId: msg.projectId }));
        }
      } catch {
        /* ignore invalid messages */
      }
    });
  });

  // Broadcast project updates to subscribed sockets
  const broadcastProjectUpdate = (event: ProjectEvent) => {
    const message = JSON.stringify(event);
    wss.clients.forEach((client) => {
      const authWs = client as AuthenticatedSocket;
      if (
        authWs.readyState === WebSocket.OPEN &&
        (authWs.subscribedProjects?.has(event.project.id) || authWs.subscribedProjects?.size === 0)
      ) {
        authWs.send(message);
      }
    });
  };

  // Wire event bus to websocket broadcasting
  projectEvents.on('project_update_broadcast', broadcastProjectUpdate);

  const heartbeat = setInterval(() => {
    wss.clients.forEach((client) => {
      const authWs = client as AuthenticatedSocket;
      if (!authWs.isAlive) {
        authWs.terminate();
        return;
      }
      authWs.isAlive = false;
      authWs.ping();
    });
  }, 30000);

  wss.on('close', () => {
    clearInterval(heartbeat);
    projectEvents.off('project_update_broadcast', broadcastProjectUpdate);
    wss.clients.forEach((c) => c.terminate());
  });

  return wss;
}
