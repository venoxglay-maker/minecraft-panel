'use client';

import { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  RefreshCw,
  Plus,
  Server,
  Users,
  Cpu,
  Gauge,
  Circle,
  Zap,
  HardDrive,
  ExternalLink,
  Bug,
  FileText,
} from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import type { ServerItem } from '@/lib/servers';
import { getStatusLabel, getStatusColor } from '@/lib/servers';
import { useAuth, canAccessServer } from '@/contexts/AuthContext';

const DOCS_URL = 'https://docs.laxpanel.app';
const ISSUES_URL = 'https://github.com/laxpanel/panel/issues';

type DashboardStats = {
  totalServers: number;
  activeServers: number;
  totalPlayers: number;
  usedMemoryMb: number;
  allocatedMb: number;
  cpuPct: number;
  diskFree: string;
  version: string;
  hostname: string;
};

type ActivityEntry = { id: string; text: string; type: string; at: string };

export default function DashboardPage() {
  const { user } = useAuth();
  const [servers, setServers] = useState<ServerItem[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [activity, setActivity] = useState<ActivityEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = async () => {
    try {
      const [serversRes, statsRes, activityRes] = await Promise.all([
        fetch('/api/servers', { credentials: 'include' }),
        fetch('/api/dashboard', { credentials: 'include' }),
        fetch('/api/activity', { credentials: 'include' }),
      ]);
      const serversData = await serversRes.json();
      const list = Array.isArray(serversData) ? serversData : [];
      setServers(list.filter((s: ServerItem) => canAccessServer(user, s.slug)));
      if (statsRes.ok) {
        const s = await statsRes.json();
        setStats(s);
      } else setStats(null);
      if (activityRes.ok) {
        const a = await activityRes.json();
        setActivity(Array.isArray(a) ? a : []);
      } else setActivity([]);
    } catch {
      setServers([]);
      setStats(null);
      setActivity([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const totalServers = stats?.totalServers ?? servers.length;
  const activeServers = stats?.activeServers ?? servers.filter((s) => s.status === 'running').length;
  const totalPlayers = stats?.totalPlayers ?? servers.reduce((acc, s) => acc + (s.playersOnline ?? 0), 0);
  const usedMemoryGb = stats ? (stats.usedMemoryMb / 1024).toFixed(1) : '0';
  const allocatedGb = stats ? (stats.allocatedMb / 1024).toFixed(1) : '0';
  const cpuPct = stats?.cpuPct ?? 0;

  const metrics = [
    {
      title: 'TOTAL SERVERS',
      value: String(totalServers),
      sub: `- ${activeServers} aktiv`,
      icon: Server,
      iconClass: 'text-panel-muted',
    },
    {
      title: 'ACTIVE PLAYERS',
      value: String(totalPlayers),
      sub: 'Spieler online',
      icon: Users,
      iconClass: 'text-panel-green',
    },
    {
      title: 'MEMORY USAGE',
      value: `${usedMemoryGb} / ${allocatedGb} GB`,
      sub: 'Genutzt / Zugewiesen',
      icon: Cpu,
      iconClass: 'text-panel-purple',
      bar: stats && stats.allocatedMb > 0 ? stats.usedMemoryMb / stats.allocatedMb : 0,
      barColor: 'bg-panel-purple',
    },
    {
      title: 'PERFORMANCE',
      value: String(cpuPct),
      valueSuffix: '% CPU',
      sub: 'Gesamt (Server-Prozesse)',
      icon: Gauge,
      iconClass: 'text-panel-orange',
    },
  ];

  function formatAgo(iso: string) {
    const d = new Date(iso);
    const sec = Math.floor((Date.now() - d.getTime()) / 1000);
    if (sec < 60) return 'gerade eben';
    if (sec < 3600) return `vor ${Math.floor(sec / 60)} Min.`;
    if (sec < 86400) return `vor ${Math.floor(sec / 3600)} Std.`;
    return `vor ${Math.floor(sec / 86400)} Tagen`;
  }

  return (
    <div className="min-h-screen">
      <header className="border-b border-panel-border bg-panel-card/50 px-8 py-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="flex items-center gap-2 text-2xl font-semibold text-white">
              <LayoutDashboard className="h-7 w-7 text-panel-muted" />
              Dashboard
            </h1>
            <p className="mt-1 text-sm text-panel-muted">
              Überblick über deine Minecraft-Server-Infrastruktur
            </p>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleRefresh}
              disabled={refreshing}
              className="flex items-center gap-2 rounded-lg border border-panel-border bg-panel-card px-4 py-2 text-sm text-white hover:bg-panel-border/50 disabled:opacity-50"
            >
              <RefreshCw className={cn('h-4 w-4', refreshing && 'animate-spin')} />
              Aktualisieren
            </button>
            <Link
              href="/servers/new"
              className="flex items-center gap-2 rounded-lg bg-panel-accent px-4 py-2 text-sm font-medium text-white hover:bg-panel-accent-hover"
            >
              <Plus className="h-4 w-4" />
              Neuer Server
            </Link>
          </div>
        </div>
      </header>

      <div className="space-y-6 p-8">
        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {metrics.map((m) => {
            const Icon = m.icon;
            return (
              <div
                key={m.title}
                className="rounded-xl border border-panel-border bg-panel-card p-5 shadow-sm"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wider text-panel-muted">
                      {m.title}
                    </p>
                    <p className="mt-1 text-2xl font-bold text-white">
                      {m.value}
                      {m.valueSuffix ?? ''}
                    </p>
                    <p className="text-sm text-panel-muted">{m.sub}</p>
                  </div>
                  <Icon className={cn('h-8 w-8 shrink-0', m.iconClass)} />
                </div>
                {m.bar != null && (
                  <div className="mt-3 h-2 overflow-hidden rounded-full bg-panel-border">
                    <div
                      className={cn('h-full', m.barColor)}
                      style={{ width: `${Math.min(m.bar * 100, 100)}%` }}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </section>

        <div className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-xl border border-panel-border bg-panel-card p-5">
            <h2 className="text-lg font-semibold text-white">Server-Übersicht</h2>
            <p className="text-sm text-panel-muted">Status aller Server</p>
            {loading ? (
              <p className="mt-4 text-sm text-panel-muted">Laden…</p>
            ) : (
              <div className="mt-4 space-y-3">
                {servers.length === 0 ? (
                  <p className="text-sm text-panel-muted">Noch keine Server. Erstelle einen mit „Neuer Server“.</p>
                ) : (
                  servers.map((s) => {
                    const dotColor = s.status === 'running' ? 'fill-panel-green text-panel-green' : s.status === 'stopping' || s.status === 'starting' ? 'fill-amber-400 text-amber-400' : 'fill-panel-red text-panel-red';
                    return (
                      <Link
                        key={s.slug}
                        href={`/servers/${s.slug}`}
                        className="flex items-center justify-between rounded-lg border border-panel-border bg-panel-bg p-3 transition-colors hover:border-panel-accent/50"
                      >
                        <div className="flex items-center gap-2">
                          <Circle className={cn('h-2.5 w-2.5 shrink-0 rounded-full', dotColor)} />
                          <div>
                            <p className="font-medium text-white">{s.name}</p>
                            <p className="flex items-center gap-1.5 text-xs text-panel-muted">
                              {s.version}
                              <span className="text-panel-muted">·</span>
                              <Circle className={cn('h-1.5 w-1.5 rounded-full', dotColor)} />
                              {s.players}
                              <span className="text-panel-muted">·</span>
                              <Zap className="h-3 w-3 text-amber-400" />
                              {s.tps} TPS
                            </p>
                          </div>
                        </div>
                        <span className={cn('text-xs font-medium', getStatusColor(s.status))}>
                          {getStatusLabel(s.status)}
                        </span>
                      </Link>
                    );
                  })
                )}
              </div>
            )}
          </div>

          <div className="rounded-xl border border-panel-border bg-panel-card p-5">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-white">Letzte Aktivität</h2>
                <p className="text-sm text-panel-muted">Server-Ereignisse und Aktionen</p>
              </div>
              <button
                type="button"
                onClick={() => fetchData()}
                className="flex items-center gap-1 text-sm text-panel-accent hover:underline"
              >
                Aktualisieren
                <ExternalLink className="h-3.5 w-3.5" />
              </button>
            </div>
            <ul className="mt-4 space-y-2">
              {activity.length === 0 ? (
                <li className="rounded-lg border border-panel-border/50 bg-panel-bg/50 px-3 py-2 text-sm text-panel-muted">
                  Noch keine Aktivität.
                </li>
              ) : (
                activity.slice(0, 10).map((a) => (
                  <li
                    key={a.id}
                    className="flex items-center gap-3 rounded-lg border border-panel-border/50 bg-panel-bg/50 px-3 py-2"
                  >
                    <Circle className="h-2 w-2 shrink-0 fill-panel-green text-panel-green" />
                    <span className="flex-1 text-sm text-white">{a.text}</span>
                    <span className="text-xs text-panel-muted">{formatAgo(a.at)}</span>
                  </li>
                ))
              )}
            </ul>
          </div>
        </div>

        <div className="grid gap-6 sm:grid-cols-3">
          <div className="rounded-xl border border-panel-border bg-panel-card p-5">
            <h2 className="text-lg font-semibold text-white">Hilfe</h2>
            <p className="text-sm text-panel-muted">Support und Dokumentation</p>
            <ul className="mt-4 space-y-2">
              <li>
                <a
                  href={ISSUES_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-sm text-white hover:text-panel-accent"
                >
                  <Bug className="h-4 w-4" />
                  Fehler melden
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
              </li>
              <li>
                <a
                  href={DOCS_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-sm text-white hover:text-panel-accent"
                >
                  <FileText className="h-4 w-4" />
                  Dokumentation
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
              </li>
            </ul>
          </div>
          <div className="rounded-xl border border-panel-border bg-panel-card p-5">
            <h2 className="text-lg font-semibold text-white">System</h2>
            <p className="text-sm text-panel-muted">Panel und Host</p>
            <ul className="mt-4 space-y-2 text-sm">
              <li className="flex items-center gap-2 text-panel-green">
                <Circle className="h-2 w-2 shrink-0 fill-panel-green" />
                Panel: v{stats?.version ?? '–'}
              </li>
              <li className="flex items-center gap-2 text-panel-muted">
                <span>Host:</span>
                <span className="font-mono text-white">{stats?.hostname ?? '–'}</span>
              </li>
              <li className="flex items-center gap-2 text-panel-blue">
                <HardDrive className="h-4 w-4 shrink-0" />
                Speicher: {stats?.diskFree ?? '–'}
              </li>
            </ul>
          </div>
          <div className="rounded-xl border border-panel-border bg-panel-card p-5">
            <h2 className="text-lg font-semibold text-white">Quick Stats</h2>
            <p className="text-sm text-panel-muted">Zusammenfassung</p>
            <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
              <div>
                <p className="text-panel-muted">Server aktiv</p>
                <p className="font-semibold text-white">{activeServers} / {totalServers}</p>
              </div>
              <div>
                <p className="text-panel-muted">CPU</p>
                <p className="font-semibold text-panel-green">{cpuPct}%</p>
              </div>
              <div>
                <p className="text-panel-muted">Spieler</p>
                <p className="font-semibold text-white">{totalPlayers}</p>
              </div>
              <div>
                <p className="text-panel-muted">RAM (genutzt)</p>
                <p className="font-semibold text-white">{usedMemoryGb} GB</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
