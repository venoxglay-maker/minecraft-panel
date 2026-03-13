'use client';

import { createContext, useContext, useState, useEffect, useCallback } from 'react';

export interface AuthUser {
  username: string;
  name?: string;
  role: 'admin' | 'user';
  permissions?: string[];
  serverSlugs?: string[];
}

const AuthContext = createContext<{
  user: AuthUser | null;
  loading: boolean;
  refresh: () => Promise<void>;
}>({ user: null, loading: true, refresh: async () => {} });

export function useAuth() {
  return useContext(AuthContext);
}

export function canAccessServer(user: AuthUser | null, slug: string): boolean {
  if (!user) return true;
  if (user.role === 'admin') return true;
  const slugs = user.serverSlugs ?? [];
  return slugs.includes('*') || slugs.includes(slug);
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch('/api/auth/me', { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setUser(data);
      } else {
        setUser(null);
      }
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return (
    <AuthContext.Provider value={{ user, loading, refresh }}>
      {children}
    </AuthContext.Provider>
  );
}
