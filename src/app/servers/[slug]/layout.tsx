'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useParams, useRouter } from 'next/navigation';
import { StopCircle, RotateCw, Trash2, Play } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ServerItem } from '@/lib/servers';
import { ServerDetailProvider } from '@/contexts/ServerDetailContext';
import { useAuth, canAccessServer } from '@/contexts/AuthContext';

const tabs = [
  { href: 'overview', label: 'Overview' },
  { href: 'console', label: 'Console' },
  { href: 'config', label: 'Config' },
  { href: 'mods', label: 'Mods' },
  { href: 'files', label: 'Files' },
  { href: 'welten', label: 'Welten' },
  { href: 'routing', label: 'Routing' },
];

const defaultServer: ServerItem & { description?: string; created?: string; lastStarted?: string } = {
  name: 'Server',
  slug: '',
  version: '-',
  players: '0/0',
  playersOnline: 0,
  playersMax: 0,
  tps: '-',
  status: 'stopped',
  description: '',
  created: '',
  lastStarted: '',
};

export default function ServerDetailLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const slug = params?.slug as string;
  const base = `/servers/${slug}`;

  const [server, setServer] = useState<ServerItem & { description?: string; created?: string; lastStarted?: string }>({
    ...defaultServer,
    name: slug ? slug.split('-').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ') : 'Server',
    slug: slug || '',
  });
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    if (!slug) return;
    if (!canAccessServer(user, slug)) {
      router.replace('/servers');
      return;
    }
    fetch('/api/servers')
      .then((r) => r.json())
      .then((data: ServerItem[]) => {
        const found = Array.isArray(data) ? data.find((s) => s.slug === slug) : null;
        if (found) {
          setServer({
            ...found,
            description: 'Minecraft server – add description in settings.',
            created: 'Aug 11, 2025',
            lastStarted: 'just now',
          });
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [slug, router]);

  const fetchServer = () => {
    if (!slug) return;
    fetch('/api/servers')
      .then((r) => r.json())
      .then((data: ServerItem[]) => {
        const found = data.find((s) => s.slug === slug);
        if (found) setServer((prev) => ({ ...prev, ...found }));
      })
      .catch(() => {});
  };

  const runAction = async (action: 'stop' | 'restart' | 'start' | 'delete', label: string) => {
    if (!confirm(`${label} – Fortfahren?`)) return;
    setActionLoading(action);
    try {
      if (action === 'delete') {
        const res = await fetch(`/api/servers/${slug}`, { method: 'DELETE' });
        if (res.ok) {
          router.push('/servers');
          return;
        }
      }
      if (action === 'stop') {
        await fetch(`/api/servers/${slug}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: 'stopping' }) });
        setServer((prev) => ({ ...prev, status: 'stopping' }));
        await new Promise((r) => setTimeout(r, 600));
        await fetch(`/api/servers/${slug}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: 'stopped' }) });
        setServer((prev) => ({ ...prev, status: 'stopped' }));
      }
      if (action === 'start') {
        await fetch(`/api/servers/${slug}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: 'starting' }) });
        setServer((prev) => ({ ...prev, status: 'starting' }));
        await new Promise((r) => setTimeout(r, 800));
        await fetch(`/api/servers/${slug}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: 'running' }) });
        setServer((prev) => ({ ...prev, status: 'running' }));
      }
      if (action === 'restart') {
        await fetch(`/api/servers/${slug}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: 'stopping' }) });
        setServer((prev) => ({ ...prev, status: 'stopping' }));
        await new Promise((r) => setTimeout(r, 500));
        await fetch(`/api/servers/${slug}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: 'stopped' }) });
        setServer((prev) => ({ ...prev, status: 'stopped' }));
        await new Promise((r) => setTimeout(r, 400));
        await fetch(`/api/servers/${slug}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: 'starting' }) });
        setServer((prev) => ({ ...prev, status: 'starting' }));
        await new Promise((r) => setTimeout(r, 700));
        await fetch(`/api/servers/${slug}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: 'running' }) });
        setServer((prev) => ({ ...prev, status: 'running' }));
      }
    } catch {
      fetchServer();
    } finally {
      setActionLoading(null);
    }
  };

  const isRunning = server.status === 'running';

  return (
    <div className="min-h-screen">
      <header className="border-b border-panel-border bg-panel-card/50 px-8 py-6">
        <div className="flex items-start justify-between">
          <div>
            {loading ? (
              <div className="h-8 w-48 animate-pulse rounded bg-panel-border" />
            ) : (
              <h1 className="text-2xl font-semibold text-white">{server.name}</h1>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            {isRunning ? (
              <>
                <button
                  type="button"
                  onClick={() => runAction('stop', 'Stop')}
                  disabled={!!actionLoading}
                  className="flex items-center gap-2 rounded-lg border border-red-500/50 bg-red-500/20 px-4 py-2 text-sm font-medium text-red-400 hover:bg-red-500/30 disabled:opacity-50"
                >
                  <StopCircle className="h-4 w-4" />
                  {actionLoading === 'stop' ? '…' : 'Stop'}
                </button>
                <button
                  type="button"
                  onClick={() => runAction('restart', 'Restart')}
                  disabled={!!actionLoading}
                  className="flex items-center gap-2 rounded-lg border border-amber-500/50 bg-amber-500/20 px-4 py-2 text-sm font-medium text-amber-400 hover:bg-amber-500/30 disabled:opacity-50"
                >
                  <RotateCw className={`h-4 w-4 ${actionLoading === 'restart' ? 'animate-spin' : ''}`} />
                  {actionLoading === 'restart' ? '…' : 'Restart'}
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={() => runAction('start', 'Start')}
                disabled={!!actionLoading || server.status === 'starting'}
                className="flex items-center gap-2 rounded-lg border border-green-500/50 bg-green-500/20 px-4 py-2 text-sm font-medium text-green-400 hover:bg-green-500/30 disabled:opacity-50"
              >
                <Play className="h-4 w-4" />
                {actionLoading === 'start' ? '…' : 'Start'}
              </button>
            )}
            <button
              type="button"
              onClick={() => runAction('delete', 'Delete')}
              disabled={!!actionLoading}
              className="flex items-center gap-2 rounded-lg border border-panel-border bg-panel-card px-4 py-2 text-sm text-panel-red hover:bg-panel-red/10 disabled:opacity-50"
            >
              <Trash2 className="h-4 w-4" />
              Delete Server
            </button>
          </div>
        </div>

        <nav className="mt-4 flex gap-1 border-b border-panel-border">
          {tabs.map((t) => {
            const href = t.href === 'overview' ? base : `${base}/${t.href}`;
            const isActive =
              (t.href === 'overview' && (pathname === base || pathname === base + '/')) ||
              (t.href !== 'overview' && pathname.startsWith(href));
            return (
              <Link
                key={t.href}
                href={href}
                className={cn(
                  'border-b-2 px-4 py-2 text-sm font-medium transition-all duration-200',
                  isActive
                    ? 'border-panel-accent text-amber-200'
                    : 'border-transparent text-panel-muted hover:text-white'
                )}
              >
                {t.label}
              </Link>
            );
          })}
        </nav>
      </header>

      <ServerDetailProvider value={{ server }}>
        <div key={pathname} className="server-tab-content">
          {children}
        </div>
      </ServerDetailProvider>
    </div>
  );
}
