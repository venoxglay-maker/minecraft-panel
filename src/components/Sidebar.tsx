'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import { LayoutDashboard, Server, Package, Users, Settings, Circle, LogOut, LogIn } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getStatusColor } from '@/lib/servers';
import { useAuth, canAccessServer } from '@/contexts/AuthContext';
import type { ServerItem } from '@/lib/servers';

const nav = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/modpacks', label: 'Modpacks', icon: Package },
  { href: '/users', label: 'Users', icon: Users },
  { href: '/settings', label: 'Settings', icon: Settings },
  { href: '/servers', label: 'Servers', icon: Server, showBadge: true },
];

export function Sidebar() {
  const pathname = usePathname();
  const { user, refresh } = useAuth();
  const [servers, setServers] = useState<ServerItem[]>([]);
  const isServerDetail = pathname.startsWith('/servers/') && pathname.split('/').length > 2;
  const activeServerSlug = isServerDetail ? pathname.split('/')[2] : null;

  useEffect(() => {
    fetch('/api/servers', { credentials: 'include' })
      .then((r) => r.json())
      .then((data) => setServers(Array.isArray(data) ? data : []))
      .catch(() => setServers([]));
  }, []);

  const visibleServers = servers.filter((s) => canAccessServer(user, s.slug));
  const serverCount = visibleServers.length;

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
    await refresh();
    window.location.href = '/login';
  };

  return (
    <aside className="flex w-56 flex-col border-r border-panel-border bg-panel-card">
      <div className="flex h-14 items-center gap-2 border-b border-panel-border px-4">
        <img
          src="/logo.png"
          alt=""
          className="h-8 w-8 shrink-0 rounded-full object-cover"
        />
        <span className="font-semibold text-white">LaxPanel</span>
      </div>

      <div className="flex min-h-0 flex-1 flex-col overflow-auto">
        <nav className="shrink-0 space-y-0.5 p-3">
          <p className="mb-2 px-3 text-xs font-medium uppercase tracking-wider text-panel-muted">
            Navigation
          </p>
          {nav.map(({ href, label, icon: Icon, showBadge }) => {
            const isActive =
              href === '/'
                ? pathname === '/'
                : pathname.startsWith(href) && (href !== '/servers' || !isServerDetail);
            const badge = showBadge ? serverCount : null;
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors',
                  isActive
                    ? 'border-l-2 border-panel-accent bg-panel-border/50 text-white'
                    : 'text-panel-muted hover:bg-panel-border/30 hover:text-white'
                )}
              >
                <Icon className="h-5 w-5 shrink-0" />
                <span className="flex-1">{label}</span>
                {badge != null && badge > 0 && (
                  <span className="rounded bg-panel-border px-1.5 py-0.5 text-xs text-panel-muted">
                    {badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        <div className="shrink-0 border-t border-panel-border p-3">
          <p className="mb-2 px-3 text-xs font-medium uppercase tracking-wider text-panel-muted">
            Quick Access
          </p>
          {visibleServers.length === 0 ? (
            <p className="px-3 py-2 text-xs text-panel-muted">Keine Server</p>
          ) : (
            visibleServers.map((s) => {
              const href = `/servers/${s.slug}`;
              const isActive = activeServerSlug === s.slug;
              const dotColor = s.status === 'running' ? 'fill-panel-green text-panel-green' : s.status === 'stopping' || s.status === 'starting' ? 'fill-amber-400 text-amber-400' : 'fill-panel-red text-panel-red';
              return (
                <Link
                  key={s.slug}
                  href={href}
                  className={cn(
                    'flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors',
                    isActive
                      ? 'bg-panel-accent/20 text-amber-200'
                      : 'text-panel-muted hover:bg-panel-border/30 hover:text-white'
                  )}
                >
                  <Circle className={cn('h-2 w-2 shrink-0 rounded-full', dotColor)} />
                  {s.name}
                </Link>
              );
            })
          )}
        </div>
      </div>

      <div className="shrink-0 border-t border-panel-border p-3">
        <div className="flex items-center gap-2 px-2">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-panel-accent/30 text-amber-200">
            <span className="text-xs font-semibold">
              {(user?.name || user?.username || 'G').slice(0, 2).toUpperCase()}
            </span>
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-white">
              {user?.name || user?.username || 'Gast'}
            </p>
            <p className="truncate text-xs text-panel-muted">
              {user ? (user.role === 'admin' ? 'Admin' : 'Benutzer') : 'Nicht angemeldet'}
            </p>
          </div>
        </div>
        {user ? (
          <button
            type="button"
            onClick={handleLogout}
            className="mt-2 flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-xs text-panel-muted hover:bg-panel-border/50 hover:text-white"
          >
            <LogOut className="h-3.5 w-3.5" />
            Abmelden
          </button>
        ) : (
          <Link
            href="/login"
            className="mt-2 flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-xs text-panel-muted hover:bg-panel-border/50 hover:text-white"
          >
            <LogIn className="h-3.5 w-3.5" />
            Anmelden
          </Link>
        )}
        <p className="mt-1 px-2 text-xs text-panel-muted">v0.0.1</p>
      </div>
    </aside>
  );
}
