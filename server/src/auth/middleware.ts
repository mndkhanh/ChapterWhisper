import type { NextFunction, Request, Response } from 'express';
import { SESSION_COOKIE } from './cookie.js';
import { verifyToken } from './jwt.js';
import { findById, type User } from '../users/user-store.js';

/** A request that has cleared `requireAuth`. */
export interface AuthedRequest extends Request {
  user: User;
}

/**
 * Rejects anything without a valid session.
 *
 * The token is read *only* from the httpOnly cookie — never from a header or the
 * request body. Accepting a bearer header as well would hand any XSS payload a
 * way to present a stolen token, which is the exact attack httpOnly exists to
 * prevent, so the extra convenience is not worth it.
 *
 * The user is re-read from the store on every request rather than trusted from
 * the token body, so a token outliving its user (a wiped `data/`) fails closed
 * instead of authorizing a ghost.
 */
export async function requireAuth(req: Request, res: Response, next: NextFunction): Promise<void> {
  const token = req.cookies?.[SESSION_COOKIE];
  if (!token) {
    res.status(401).json({ error: 'Not signed in' });
    return;
  }

  let userId: string;
  try {
    userId = verifyToken(token).sub;
  } catch {
    res.status(401).json({ error: 'Invalid or expired session' });
    return;
  }

  const user = await findById(userId);
  if (!user) {
    res.status(401).json({ error: 'User no longer exists' });
    return;
  }

  (req as AuthedRequest).user = user;
  next();
}
