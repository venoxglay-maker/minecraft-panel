'use client';

import { useState, useEffect } from 'react';
import { Activity, Copy, Info, Gauge } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getStatusLabel, getStatusColor } from '@/lib/servers';
import { useServerDetail } from '@/contexts/ServerDetailContext';

interface Stats {
  cpu: number;
  memoryUsedMb: number;
  memoryTotalMb: number;
  memoryPct: number;
  playersOnline: number;
  playersMax: number;
  tps: string;
}

export default function ServerOverviewPage() {
  const [copied, setCopied] = useState(false);
  const [address, setAddress] = useState<string>('…');
  const [stats, setStats] = useState<Stats | null>(null);
  const { server } = useServerDetail();

  const port = server?.port ?? 25565;
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const host = window.location.hostname;
    setAddress(`${host}:${port}`);
  }, [port]);

  useEffect(() => {
    if (!server?.slug || server.status !== 'running') {
      setStats(null);
      return;
    }
    const fetchStats = async () => {
      try {
        const res = await fetch(`/api/servers/${server.slug}/stats`, { credentials: 'include' });
        if (res.ok) {
          const data = await res.json();
          setStats(data);
        }
      } catch {
        setStats(null);
      }
    };
    fetchStats();
    const interval = setInterval(fetchStats, 3000);
    return () => clearInterval(interval);
  }, [server?.slug, server?.status]);

  const copyAddress = async () => {
    try {
      await navigator.clipboard.writeText(address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  const memoryUsedGb = stats ? (stats.memoryUsedMb / 1024).toFixed(2) : '0.00';
  const memoryTotalMb = server?.memoryMb ?? 2048;
  const memoryTotalGb = (stats?.memoryTotalMb ?? memoryTotalMb) / 1024;
  const serverInfo = [
    { label: 'Minecraft', value: server?.version ?? '–' },
    { label: 'Java', value: 'System Java' },
    { label: 'Port', value: String(port) },
    { label: 'Arbeitsverzeichnis', value: server?.workDir ? '…/servers/' + server.slug : '–' },
  ];

  const performance = [
    {
      label: 'MEMORY',
      value: `${memoryUsedGb} / ${memoryTotalGb.toFixed(2)} GB`,
      pct: stats?.memoryPct ?? 0,
      color: (stats?.memoryPct ?? 0) > 90 ? 'bg-panel-red' : (stats?.memoryPct ?? 0) > 70 ? 'bg-amber-600' : 'bg-panel-blue',
    },
    {
      label: 'CPU',
      value: stats ? `${stats.cpu}% used` : '0% used',
      pct: Math.min(stats?.cpu ?? 0, 100),
      color: 'bg-panel-blue',
    },
    {
      label: 'PLAYERS',
      value: stats ? `${stats.playersOnline}/${stats.playersMax}` : `${server?.playersOnline ?? 0}/${server?.playersMax ?? 20}`,
      pct: stats && stats.playersMax > 0 ? (stats.playersOnline / stats.playersMax) * 100 : 0,
      color: 'bg-panel-blue',
    },
    {
      label: 'TPS',
      value: stats?.tps ?? server?.tps ?? '20.0',
      pct: 100,
      color: 'bg-panel-green',
    },
  ];

  return (
    <div className="space-y-6 p-8">
      <div className="mb-2">
        <h2 className="text-lg font-semibold text-white">Overview</h2>
        <p className="text-sm text-panel-muted">Status, Verbindung, Server-Infos und Performance (live).</p>
      </div>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-panel-border bg-panel-card p-5">
          <div className="flex items-center gap-2 text-panel-muted">
            <Activity
              className={cn(
                'h-5 w-5 transition-colors duration-300',
                server ? getStatusColor(server.status) : 'text-panel-muted'
              )}
            />
            <span className="text-xs font-medium uppercase tracking-wider">SERVER STATUS</span>
          </div>
          <p
            className={cn(
              'mt-2 text-xl font-bold transition-colors duration-300',
              server ? getStatusColor(server.status) : 'text-panel-muted'
            )}
          >
            {server ? getStatusLabel(server.status).toUpperCase() : '–'}
          </p>
          <p className="text-sm text-panel-muted">
            {server?.status === 'running' && 'Server läuft und antwortet.'}
            {server?.status === 'stopped' && 'Server ist gestoppt.'}
            {(server?.status === 'stopping' || server?.status === 'starting') && 'Server wird umgeschaltet…'}
            {!server && 'Lade…'}
          </p>
        </div>

        <div className="rounded-xl border border-panel-border bg-panel-card p-5">
          <div className="flex items-center gap-2 text-panel-muted">
            <Copy className="h-5 w-5 text-panel-blue" />
            <span className="text-xs font-medium uppercase tracking-wider">CONNECTION</span>
          </div>
          <div className="mt-2 flex items-center gap-2 rounded border border-panel-border bg-panel-bg px-3 py-2 font-mono text-sm">
            <span className="flex-1 text-white">{address}</span>
            <button
              type="button"
              onClick={copyAddress}
              className="rounded p-1 text-panel-muted hover:bg-panel-border hover:text-white"
              title={copied ? 'Copied' : 'Click to copy'}
            >
              <Copy className="h-4 w-4" />
            </button>
          </div>
          <p className="mt-1 text-xs text-panel-muted">
            {copied ? 'In Zwischenablage kopiert' : 'Klicken zum Kopieren'}
          </p>
        </div>

        <div className="rounded-xl border border-panel-border bg-panel-card p-5">
          <div className="flex items-center gap-2 text-panel-muted">
            <Info className="h-5 w-5 text-panel-purple" />
            <span className="text-xs font-medium uppercase tracking-wider">SERVER INFO</span>
          </div>
          <dl className="mt-2 space-y-1 text-sm">
            {serverInfo.map((row) => (
              <div key={row.label} className="flex justify-between gap-2">
                <dt className="text-panel-muted">{row.label}</dt>
                <dd className="truncate text-white">{row.value}</dd>
              </div>
            ))}
          </dl>
        </div>

        <div className="rounded-xl border border-panel-border bg-panel-card p-5">
          <div className="flex items-center gap-2 text-panel-muted">
            <Gauge className="h-5 w-5 text-panel-orange" />
            <span className="text-xs font-medium uppercase tracking-wider">PERFORMANCE</span>
          </div>
          <div className="mt-2 space-y-2">
            {performance.map((p) => (
              <div key={p.label}>
                <div className="flex justify-between text-xs">
                  <span className="text-panel-muted">{p.label}</span>
                  <span className="text-white">{p.value}</span>
                </div>
                <div className="mt-0.5 h-1.5 overflow-hidden rounded-full bg-panel-border">
                  <div
                    className={`h-full ${p.color}`}
                    style={{ width: `${Math.min(p.pct, 100)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
