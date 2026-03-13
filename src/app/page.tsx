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
  Check,
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

const DISCORD_URL = 'https://discord.gg/example';
const DOCS_URL = 'https://docs.laxpanel.app';
const ISSUES_URL = 'https://github.com/disco-panel/panel/issues';

export default function DashboardPage() {
  const { user } = useAuth();
  const [servers, setServers] = useState<ServerItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchServers = async () => {
    try {
      const res = await fetch('/api/servers', { credentials: 'include' });
      const data = await res.json();
      const list = Array.isArray(data) ? data : [];
      setServers(list.filter((s: ServerItem) => canAccessServer(user, s.slug)));
    } catch {
      setServers([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchServers();
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchServers();
  };

  const totalServers = servers.length;
  const activeServers = servers.filter((s) => s.status === 'running').length;
  const totalPlayers = servers.reduce((acc, s) => acc + s.playersOnline, 0);
  const totalMemory = 32;
  const usedMemory = 15.3;

  const metrics = [
    {
      title: 'TOTAL SERVERS',
      value: String(totalServers),
      sub: `- ${activeServers} active`,
      icon: Server,
      iconClass: 'text-panel-muted',
    },
    {
      title: 'ACTIVE PLAYERS',
      value: String(totalPlayers),
      sub: 'players online',
      icon: Users,
      iconClass: 'text-panel-green',
    },
    {
      title: 'MEMORY USAGE',
      value: `${usedMemory} / ${totalMemory} GB`,
      sub: 'Used / Allocated',
      icon: Cpu,
      iconClass: 'text-panel-purple',
      bar: usedMemory / totalMemory,
      barColor: 'bg-panel-purple',
    },
    {
      title: 'PERFORMANCE',
      value: '20.0',
      valueSuffix: ' Avg. TPS',
      sub: '8.6% CPU',
      icon: Gauge,
      iconClass: 'text-panel-orange',
    },
  ];

  const recentActivity = [
    { text: 'SkyFactory 4 Started', ago: '10m ago', type: 'start' },
    { text: 'RLCraft Started', ago: '10m ago', type: 'start' },
    { text: 'TESTER2 Started', ago: '10m ago', type: 'start' },
  ];

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
              Monitor and manage your Minecraft server infrastructure
            </p>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleRefresh}
              disabled={refreshing}
              className="flex items-center gap-2 rounded-lg border border-panel-border bg-panel-card px-4 py-2 text-sm text-white hover:bg-panel-border/50 disabled:opacity-50"
            >
              <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </button>
            <Link
              href="/servers/new"
              className="flex items-center gap-2 rounded-lg bg-panel-accent px-4 py-2 text-sm font-medium text-white hover:bg-panel-accent-hover"
            >
              <Plus className="h-4 w-4" />
              New Server
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
                  <Icon className={`h-8 w-8 shrink-0 ${m.iconClass}`} />
                </div>
                {m.bar != null && (
                  <div className="mt-3 h-2 overflow-hidden rounded-full bg-panel-border">
                    <div
                      className={`h-full ${m.barColor}`}
                      style={{ width: `${m.bar * 100}%` }}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </section>

        <div className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-xl border border-panel-border bg-panel-card p-5">
            <h2 className="text-lg font-semibold text-white">Server Overview</h2>
            <p className="text-sm text-panel-muted">Quick status of all your servers</p>
            {loading ? (
              <p className="mt-4 text-sm text-panel-muted">Loading…</p>
            ) : (
              <div className="mt-4 space-y-3">
                {servers.length === 0 ? (
                  <p className="text-sm text-panel-muted">Noch keine Server. Erstelle einen mit „New Server“.</p>
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
                          <Circle className={`h-2.5 w-2.5 shrink-0 rounded-full ${dotColor}`} />
                          <div>
                            <p className="font-medium text-white">{s.name}</p>
                            <p className="flex items-center gap-1.5 text-xs text-panel-muted">
                              {s.version}
                              <span className="text-panel-muted">·</span>
                              <Circle className={`h-1.5 w-1.5 rounded-full ${dotColor}`} />
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
                <h2 className="text-lg font-semibold text-white">Recent Activity</h2>
                <p className="text-sm text-panel-muted">Latest server events and actions</p>
              </div>
              <button
                type="button"
                onClick={() => window.location.href = '/servers?tab=activity'}
                className="flex items-center gap-1 text-sm text-panel-accent hover:underline"
              >
                View All
                <ExternalLink className="h-3.5 w-3.5" />
              </button>
            </div>
            <ul className="mt-4 space-y-2">
              {recentActivity.map((a) => (
                <li
                  key={a.text}
                  className="flex items-center gap-3 rounded-lg border border-panel-border/50 bg-panel-bg/50 px-3 py-2"
                >
                  <Circle className="h-2 w-2 shrink-0 fill-panel-green text-panel-green" />
                  <span className="flex-1 text-sm text-white">{a.text}</span>
                  <span className="text-xs text-panel-muted">{a.ago}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="grid gap-6 sm:grid-cols-3">
          <div className="rounded-xl border border-panel-border bg-panel-card p-5">
            <h2 className="text-lg font-semibold text-white">Need Help?</h2>
            <p className="text-sm text-panel-muted">Get support from our community</p>
            <ul className="mt-4 space-y-2">
              <li>
                <a
                  href={DISCORD_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-sm text-white hover:text-panel-accent"
                >
                  Join Discord Server
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
              </li>
              <li>
                <a
                  href={ISSUES_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-sm text-white hover:text-panel-accent"
                >
                  <Bug className="h-4 w-4" />
                  Report an Issue
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
                  Documentation
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
              </li>
            </ul>
          </div>
          <div className="rounded-xl border border-panel-border bg-panel-card p-5">
            <h2 className="text-lg font-semibold text-white">System Health</h2>
            <p className="text-sm text-panel-muted">Overall infrastructure status</p>
            <ul className="mt-4 space-y-2 text-sm">
              <li className="flex items-center gap-2 text-panel-green">
                <Check className="h-4 w-4 shrink-0" />
                Services: Operational
              </li>
              <li className="flex items-center gap-2 text-panel-green">
                <Check className="h-4 w-4 shrink-0" />
                Network: Connected
              </li>
              <li className="flex items-center gap-2 text-panel-blue">
                <HardDrive className="h-4 w-4 shrink-0" />
                Storage: 19.96 MB / 847.06 GB
              </li>
            </ul>
          </div>
          <div className="rounded-xl border border-panel-border bg-panel-card p-5">
            <h2 className="text-lg font-semibold text-white">Quick Stats</h2>
            <p className="text-sm text-panel-muted">Server performance metrics</p>
            <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
              <div>
                <p className="text-panel-muted">Uptime</p>
                <p className="font-semibold text-white">100%</p>
              </div>
              <div>
                <p className="text-panel-muted">Load</p>
                <p className="font-semibold text-panel-green">9%</p>
              </div>
              <div>
                <p className="text-panel-muted">Avg TPS</p>
                <p className="font-semibold text-white">20.0</p>
              </div>
              <div>
                <p className="text-panel-muted">Players</p>
                <p className="font-semibold text-white">{totalPlayers}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
