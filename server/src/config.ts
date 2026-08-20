import path from 'node:path';

/**
 * Env is read lazily on every call rather than captured at import time, so that
 * `dotenv.config()` in the entry point and per-test overrides both take effect.
 */

export function getDataDir(): string {
  return path.resolve(process.env.STORAGE_DIR || './data');
}

export function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET is not set — copy .env.example to server/.env');
  }
  return secret;
}

export function getJwtExpiresIn(): string {
  return process.env.JWT_EXPIRES_IN || '7d';
}
