import { Router } from 'express';
import { z } from 'zod';
import { signToken } from './jwt.js';
import { requireAuth, type AuthedRequest } from './middleware.js';
import { findOrCreate } from '../users/user-store.js';

const loginSchema = z.object({
  email: z.string().trim().email(),
  name: z.string().trim().min(1).max(80),
});

export const authRouter = Router();

/**
 * Sign in or sign up — one door, no password (PRD §4.1). Deliberately returns
 * 200 for both cases: the client has no reason to care which happened, and
 * distinguishing them would leak which emails are registered.
 */
authRouter.post('/login', async (req, res) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({
      error: 'A valid email and a name are required',
      details: parsed.error.flatten().fieldErrors,
    });
    return;
  }

  const user = await findOrCreate(parsed.data.email, parsed.data.name);
  res.json({ token: signToken(user), user });
});

/** Who am I — lets the client restore a session after a refresh. */
authRouter.get('/me', requireAuth, (req, res) => {
  res.json({ user: (req as AuthedRequest).user });
});
