import type { NextFunction, Request, Response } from 'express';
import { verifyToken } from './jwt.js';
import { findById, type User } from '../users/user-store.js';

/** A request that has cleared `requireAuth`. */
export interface AuthedRequest extends Request {
  user: User;
}

const BEARER = 'Bearer ';

/**
 * Rejects anything without a valid token. The user is re-read from the store on
 * every request rather than trusted from the token body, so a token outliving
 * its user (wiped `data/`) fails closed instead of authorizing a ghost.
 */
export async function requireAuth(req: Request, res: Response, next: NextFunction): Promise<void> {
  const header = req.headers.authorization;
  if (!header?.startsWith(BEARER)) {
    res.status(401).json({ error: 'Missing bearer token' });
    return;
  }

  let userId: string;
  try {
    userId = verifyToken(header.slice(BEARER.length)).sub;
  } catch {
    res.status(401).json({ error: 'Invalid or expired token' });
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
