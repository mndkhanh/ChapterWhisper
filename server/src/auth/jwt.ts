import jwt, { type SignOptions } from 'jsonwebtoken';
import { getJwtExpiresIn, getJwtSecret } from '../config.js';
import type { User } from '../users/user-store.js';

export interface TokenPayload {
  sub: string;
  email: string;
}

export function signToken(user: Pick<User, 'id' | 'email'>): string {
  return jwt.sign({ email: user.email }, getJwtSecret(), {
    subject: user.id,
    expiresIn: getJwtExpiresIn() as SignOptions['expiresIn'],
  });
}

/** Throws if the token is malformed, tampered with, or expired. */
export function verifyToken(token: string): TokenPayload {
  const decoded = jwt.verify(token, getJwtSecret()) as jwt.JwtPayload;
  return { sub: String(decoded.sub), email: String(decoded.email) };
}
