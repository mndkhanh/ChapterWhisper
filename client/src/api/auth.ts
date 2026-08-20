import type { User } from '../types.js';

export async function fetchCurrentUser(): Promise<User | null> {
  const res = await fetch('/api/auth/me', {
    credentials: 'include',
  });
  if (!res.ok) return null;
  const data = await res.json();
  return data.user;
}

export async function loginUser(name: string, email: string): Promise<User> {
  const res = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ name, email }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => null);
    throw new Error(err?.error || 'Failed to sign in');
  }
  const data = await res.json();
  return data.user;
}

export async function logoutUser(): Promise<void> {
  await fetch('/api/auth/logout', {
    method: 'POST',
    credentials: 'include',
  }).catch(() => {});
}
