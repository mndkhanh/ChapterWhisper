import { Router } from 'express';
import { z } from 'zod';
import { SESSION_COOKIE, sessionCookieOptions } from './cookie.js';
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
 *
 * The token goes out **only** as an httpOnly cookie and is never put in the
 * response body — echoing it back would let client JS read and stash it, which
 * would undo the whole reason for choosing a cookie.
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
  res.cookie(SESSION_COOKIE, signToken(user), sessionCookieOptions());
  res.json({ user });
});

/** Who am I — lets the client restore a session after a refresh. */
authRouter.get('/me', requireAuth, (req, res) => {
  res.json({ user: (req as AuthedRequest).user });
});

/**
 * Sign out. With an httpOnly cookie the client cannot clear the session itself,
 * so this endpoint is required rather than optional. The options must match the
 * ones the cookie was set with or the browser will not remove it.
 */
authRouter.post('/logout', (_req, res) => {
  const { maxAge: _maxAge, ...options } = sessionCookieOptions();
  res.clearCookie(SESSION_COOKIE, options);
  res.status(204).end();
});
