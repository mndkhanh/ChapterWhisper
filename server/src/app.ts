import cors from 'cors';
import express from 'express';
import { authRouter } from './auth/routes.js';

/**
 * The app is built here and listened to in `index.ts`, so tests can drive it
 * with supertest without binding a port.
 */
export function createApp() {
  const app = express();

  app.use(cors());
  app.use(express.json({ limit: '5mb' })); // book text arrives in a JSON body

  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', message: 'ChapterWhisper Server is running' });
  });

  app.use('/api/auth', authRouter);

  return app;
}
