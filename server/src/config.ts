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

export function getGeminiApiKey(): string {
  const key = process.env.GEMINI_API_KEY;
  if (!key) {
    throw new Error('GEMINI_API_KEY is not set — copy .env.example to server/.env');
  }
  return key;
}

export function getGeminiBaseUrl(): string {
  return process.env.GEMINI_BASE_URL || 'https://generativelanguage.googleapis.com/v1beta';
}

export function getTextModel(): string {
  return process.env.GEMINI_TEXT_MODEL || 'gemini-3.7-flash';
}

export function getImageModel(): string {
  return process.env.GEMINI_IMAGE_MODEL || 'gemini-3.1-flash-image';
}

/**
 * How long a `RUNNING` step may sit before the user is offered a retry.
 *
 * Only ever used to decide that a lock is *stale* — never to re-fire a call.
 * Real steps take 10–30s and images longer, so this is deliberately generous:
 * clearing a lock out from under a call that is still alive would let a second
 * Gemini call start, which is the exact thing the lock exists to prevent.
 */
export function getStepStaleMs(): number {
  return Number(process.env.STEP_STALE_MS || 5 * 60 * 1000);
}
