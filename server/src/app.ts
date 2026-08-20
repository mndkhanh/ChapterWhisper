import cookieParser from 'cookie-parser';
import cors from 'cors';
import express from 'express';
import { authRouter } from './auth/routes.js';

/**
 * The app is built here and listened to in `index.ts`, so tests can drive it
 * with supertest without binding a port.
 */
export function createApp() {
  const app = express();

  // In dev the browser only ever talks to Vite on :3000, which proxies /api to
  // this server — same origin, so the session cookie travels without CORS being
  // involved. `credentials: true` covers a reviewer who skips the proxy and hits
  // :4000 directly; `origin: true` reflects the caller rather than using `*`,
  // which browsers refuse to combine with credentials.
  app.use(cors({ origin: true, credentials: true }));
  app.use(cookieParser());
  app.use(express.json({ limit: '5mb' })); // book text arrives in a JSON body

  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', message: 'ChapterWhisper Server is running' });
  });

  app.use('/api/auth', authRouter);

  return app;
}
