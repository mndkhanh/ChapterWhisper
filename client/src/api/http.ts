/**
 * Shared fetch plumbing for every API module.
 *
 * `API_BASE` is empty in normal development, so calls go to relative `/api/...`
 * paths and Vite's proxy forwards them to the server. That keeps the request
 * same-origin, which is what lets the httpOnly session cookie travel without
 * CORS being involved. See `client/.env.example`.
 */
const API_BASE = (import.meta.env.VITE_API_BASE ?? '').replace(/\/+$/, '');

/** A non-2xx response. Carries the status so callers can branch on 401/409. */
export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export async function request<T>(
  method: string,
  path: string,
  body?: unknown,
): Promise<T> {
  let res: Response;
  try {
    res = await fetch(API_BASE + path, {
      method,
      headers: body ? { 'Content-Type': 'application/json' } : undefined,
      // The session is an httpOnly cookie, not a bearer token — without this
      // the browser omits it and every guarded route answers 401.
      credentials: 'include',
      body: body === undefined ? undefined : JSON.stringify(body),
      // No AbortSignal.timeout here on purpose: a step run blocks for the whole
      // Gemini call (10-30s, longer for images) before the server responds.
    });
  } catch (err) {
    throw new ApiError(`Could not reach the server: ${(err as Error).message}`, 0);
  }

  if (res.status === 204) return undefined as T;

  const text = await res.text();
  let json: any = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    /* server sent something that is not JSON */
  }

  if (!res.ok) {
    throw new ApiError(json?.error || `Request failed (${res.status})`, res.status);
  }
  return json as T;
}
