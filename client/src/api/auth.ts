import type { User } from '../types.js';
import { ApiError, request } from './http.js';

export async function fetchCurrentUser(): Promise<User | null> {
  try {
    const { user } = await request<{ user: User }>('GET', '/api/auth/me');
    return user;
  } catch (err) {
    // 401 is the normal "not signed in" answer, not a failure worth surfacing.
    if (err instanceof ApiError && err.status === 401) return null;
    throw err;
  }
}

export async function loginUser(name: string, email: string): Promise<User> {
  const { user } = await request<{ user: User }>('POST', '/api/auth/login', { name, email });
  return user;
}

/**
 * Must be a server call: the session cookie is httpOnly, so the client
 * physically cannot clear it on its own.
 */
export async function logoutUser(): Promise<void> {
  await request<void>('POST', '/api/auth/logout').catch(() => {});
}
