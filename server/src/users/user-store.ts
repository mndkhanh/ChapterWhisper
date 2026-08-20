import { randomUUID } from 'node:crypto';
import path from 'node:path';
import { getDataDir } from '../config.js';
import { readJson, updateJson } from '../storage/json-file.js';

export interface User {
  id: string;
  email: string;
  name: string;
  createdAt: string;
}

function usersFile(): string {
  return path.join(getDataDir(), 'users.json');
}

/** Email is the identity key, so it is matched case- and whitespace-insensitively. */
export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export async function findByEmail(email: string): Promise<User | undefined> {
  const users = await readJson<User[]>(usersFile(), []);
  return users.find((user) => user.email === normalizeEmail(email));
}

export async function findById(id: string): Promise<User | undefined> {
  const users = await readJson<User[]>(usersFile(), []);
  return users.find((user) => user.id === id);
}

/**
 * PRD §4.1: email exists → that user; doesn't → create it. No password, no OAuth.
 *
 * The lookup happens *inside* the write lock, not before it — otherwise two
 * simultaneous first-time logins with the same email both miss and create two
 * users. An existing user's stored name is left alone; the login form is not an
 * account editor, and silently rewriting it on every sign-in would be surprising.
 */
export async function findOrCreate(email: string, name: string): Promise<User> {
  const normalized = normalizeEmail(email);
  let resolved: User | undefined;

  await updateJson<User[]>(usersFile(), [], (users) => {
    const existing = users.find((user) => user.email === normalized);
    if (existing) {
      resolved = existing;
      return users;
    }
    resolved = {
      id: randomUUID(),
      email: normalized,
      name: name.trim(),
      createdAt: new Date().toISOString(),
    };
    return [...users, resolved];
  });

  return resolved!;
}
