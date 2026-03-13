'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

const PUBLIC_PATHS = ['/setup', '/login'];

/** Immer true: Auth läuft über API/Session (server-ready). */
const USE_SERVER_AUTH = true;

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, loading } = useAuth();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!USE_SERVER_AUTH) {
      setReady(true);
      return;
    }
    const isPublic = PUBLIC_PATHS.some((p) => pathname?.startsWith(p));

    if (loading) return;

    if (user) {
      if (isPublic) {
        router.replace('/');
        return;
      }
      setReady(true);
      return;
    }

    if (isPublic) {
      setReady(true);
      return;
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => {
      controller.abort();
      router.replace('/setup');
    }, 8000);
    fetch('/api/auth/setup-done', { credentials: 'include', signal: controller.signal })
      .then((r) => r.json())
      .then((data: { setupDone?: boolean }) => {
        clearTimeout(timeout);
        if (data.setupDone) {
          router.replace('/login');
        } else {
          router.replace('/setup');
        }
      })
      .catch(() => {
        clearTimeout(timeout);
        router.replace('/setup');
      });
  }, [pathname, router, user, loading]);

  if (!USE_SERVER_AUTH) return <>{children}</>;

  if (loading && !user && pathname && !PUBLIC_PATHS.some((p) => pathname.startsWith(p))) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-panel-bg">
        <p className="text-panel-muted">Lade…</p>
      </div>
    );
  }

  if (!ready && !user && pathname && !PUBLIC_PATHS.some((p) => pathname.startsWith(p))) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-panel-bg">
        <p className="text-panel-muted">Lade…</p>
      </div>
    );
  }

  return <>{children}</>;
}
