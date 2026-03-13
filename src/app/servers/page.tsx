'use client';

import { useState, useEffect } from 'react';
import { Server as ServerIcon, Plus, Circle, Zap } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import type { ServerItem } from '@/lib/servers';
import { getStatusLabel, getStatusColor } from '@/lib/servers';
import { useAuth, canAccessServer } from '@/contexts/AuthContext';

export default function ServersPage() {
  const { user } = useAuth();
  const [servers, setServers] = useState<ServerItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/servers', { credentials: 'include' })
      .then((r) => r.json())
      .then((data) => {
        const list = Array.isArray(data) ? data : [];
        setServers(list.filter((s: ServerItem) => canAccessServer(user, s.slug)));
      })
      .catch(() => setServers([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen">
      <header className="border-b border-panel-border bg-panel-card/50 px-8 py-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="flex items-center gap-2 text-2xl font-semibold text-white">
              <ServerIcon className="h-7 w-7 text-panel-muted" />
              Servers
            </h1>
            <p className="mt-1 text-sm text-panel-muted">
              Create and manage your Minecraft servers
            </p>
          </div>
          <Link
            href="/servers/new"
            className="flex items-center gap-2 rounded-lg bg-panel-accent px-4 py-2 text-sm font-medium text-white hover:bg-panel-accent-hover"
          >
            <Plus className="h-4 w-4" />
            New Server
          </Link>
        </div>
      </header>

      <div className="p-8">
        {loading ? (
          <p className="text-panel-muted">Loading servers…</p>
        ) : servers.length === 0 ? (
          <div className="rounded-xl border border-panel-border bg-panel-card p-12 text-center">
            <p className="text-panel-muted">Noch keine Server. Erstelle deinen ersten Server.</p>
            <Link
              href="/servers/new"
              className="mt-4 inline-flex items-center gap-2 rounded-lg bg-panel-accent px-4 py-2 text-sm font-medium text-white hover:bg-panel-accent-hover"
            >
              <Plus className="h-4 w-4" />
              Server erstellen
            </Link>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {servers.map((s) => (
              <Link
                key={s.slug}
                href={`/servers/${s.slug}`}
                className="rounded-xl border border-panel-border bg-panel-card p-5 transition-colors hover:border-panel-accent/50 hover:bg-panel-card/90"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h2 className="text-lg font-semibold text-white">{s.name}</h2>
                    <p className="mt-1 flex items-center gap-1.5 text-sm text-panel-muted">
                      {s.version}
                      <span className="text-panel-muted">·</span>
                      <Circle
                        className={cn(
                          'h-2 w-2 rounded-full',
                          s.status === 'running' ? 'fill-panel-green text-panel-green' : s.status === 'stopping' || s.status === 'starting' ? 'fill-amber-400 text-amber-400' : 'fill-panel-red text-panel-red'
                        )}
                      />
                      {s.players}
                      <span className="text-panel-muted">·</span>
                      <Zap className="h-3.5 w-3.5 text-amber-400" />
                      {s.tps} TPS
                    </p>
                  </div>
                  <span className={cn('rounded px-2 py-0.5 text-xs font-medium', getStatusColor(s.status), 'bg-current/10')}>
                    {getStatusLabel(s.status)}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
