import { useState, useEffect, useCallback } from 'react';
import type { User } from '../types.js';
import { fetchCurrentUser, loginUser, logoutUser } from '../api/auth.js';

export function useAuth(onToast: (msg: string) => void) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    fetchCurrentUser()
      .then((u) => {
        if (!mounted) return;
        if (u) {
          setUser(u);
          localStorage.setItem('cw_user', JSON.stringify(u));
        } else {
          setUser(null);
        }
      })
      .catch(() => {
        if (!mounted) return;
        const saved = localStorage.getItem('cw_user');
        if (saved) {
          try { setUser(JSON.parse(saved)); } catch {}
        }
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => { mounted = false; };
  }, []);

  const login = useCallback(async (name: string, email: string) => {
    try {
      const u = await loginUser(name.trim(), email.trim());
      setUser(u);
      localStorage.setItem('cw_user', JSON.stringify(u));
      onToast('Signed in successfully');
      return true;
    } catch (err: any) {
      onToast(err?.message || 'Failed to sign in');
      return false;
    }
  }, [onToast]);

  const logout = useCallback(async () => {
    await logoutUser();
    setUser(null);
    localStorage.removeItem('cw_user');
    onToast('Signed out');
  }, [onToast]);

  return { user, loading, login, logout };
}

