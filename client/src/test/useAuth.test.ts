import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useAuth } from '../hooks/useAuth.js';
import type { User } from '../types.js';

function jsonResponse(status: number, body: unknown): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    text: () => Promise.resolve(JSON.stringify(body)),
  } as unknown as Response;
}

const mockUser: User = {
  id: 'u_1',
  email: 'ada@example.com',
  name: 'Ada Lovelace',
  createdAt: new Date().toISOString(),
};

describe('useAuth hook', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it('restores user from /api/auth/me on mount when session cookie exists', async () => {
    global.fetch = vi.fn().mockResolvedValue(jsonResponse(200, { user: mockUser }));

    const onToast = vi.fn();
    const { result } = renderHook(() => useAuth(onToast));

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.user).toEqual(mockUser);
    expect(localStorage.getItem('cw_user')).toBe(JSON.stringify(mockUser));
  });

  it('falls back to null user when 401 response is returned', async () => {
    global.fetch = vi.fn().mockResolvedValue(jsonResponse(401, { error: 'Unauthorized' }));

    const onToast = vi.fn();
    const { result } = renderHook(() => useAuth(onToast));

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.user).toBeNull();
  });

  it('logs in successfully and caches user to localStorage', async () => {
    global.fetch = vi.fn().mockResolvedValueOnce(jsonResponse(401, { error: 'Unauthorized' }));

    const onToast = vi.fn();
    const { result } = renderHook(() => useAuth(onToast));

    await waitFor(() => expect(result.current.loading).toBe(false));

    const loggedInUser: User = {
      id: 'u_2',
      email: 'grace@example.com',
      name: 'Grace Hopper',
      createdAt: new Date().toISOString(),
    };
    global.fetch = vi.fn().mockResolvedValueOnce(jsonResponse(200, { user: loggedInUser }));

    let success = false;
    await act(async () => {
      success = await result.current.login('Grace Hopper', 'grace@example.com');
    });

    expect(success).toBe(true);
    expect(result.current.user).toEqual(loggedInUser);
    expect(localStorage.getItem('cw_user')).toBe(JSON.stringify(loggedInUser));
    expect(onToast).toHaveBeenCalledWith('Signed in successfully');
  });

  it('handles login failure cleanly and notifies via toast', async () => {
    global.fetch = vi.fn().mockResolvedValueOnce(jsonResponse(401, { error: 'Unauthorized' }));

    const onToast = vi.fn();
    const { result } = renderHook(() => useAuth(onToast));

    await waitFor(() => expect(result.current.loading).toBe(false));

    global.fetch = vi.fn().mockResolvedValueOnce(jsonResponse(400, { error: 'Invalid email address' }));

    let success = true;
    await act(async () => {
      success = await result.current.login('Grace', 'bad-email');
    });

    expect(success).toBe(false);
    expect(result.current.user).toBeNull();
    expect(onToast).toHaveBeenCalledWith('Invalid email address');
  });

  it('logs out and clears session state & localStorage', async () => {
    localStorage.setItem('cw_user', JSON.stringify(mockUser));
    global.fetch = vi.fn().mockResolvedValueOnce(jsonResponse(200, { user: mockUser }));

    const onToast = vi.fn();
    const { result } = renderHook(() => useAuth(onToast));

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.user).toEqual(mockUser);

    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      status: 204,
      text: () => Promise.resolve(''),
    } as unknown as Response);

    await act(async () => {
      await result.current.logout();
    });

    expect(result.current.user).toBeNull();
    expect(localStorage.getItem('cw_user')).toBeNull();
    expect(onToast).toHaveBeenCalledWith('Signed out');
  });
});
