'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Activity, Copy, Info, Gauge } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getStatusLabel, getStatusColor } from '@/lib/servers';
import { useServerDetail } from '@/contexts/ServerDetailContext';

const MINECRAFT_DEFAULT_PORT = 25565;

const defaultServerInfo = [
  { label: 'Minecraft', value: '1.12.2' },
  { label: 'Java', value: 'Java 8' },
  { label: 'ModLoader', value: 'Auto: Curseforge' },
  { label: 'Server ID', value: 'a7b700b0-dce...' },
  { label: 'Container', value: '520c000d47d...' },
  { label: 'Data Path', value: '.../servers/...' },
];

const defaultPerformance = [
  { label: 'MEMORY', value: '5.85 / 12.0 GB', pct: 48.8, color: 'bg-amber-600' },
  { label: 'CPU', value: '6.24% used', pct: 6.24, color: 'bg-panel-blue' },
  { label: 'STORAGE', value: '0.0% of 847.06 GB', pct: 0, color: 'bg-panel-muted' },
  { label: 'PLAYERS', value: '0/20', pct: 0, color: 'bg-panel-blue' },
  { label: 'TPS', value: '20.0', pct: 100, color: 'bg-panel-green' },
];

export default function ServerOverviewPage() {
  const params = useParams();
  const [copied, setCopied] = useState(false);
  const [address, setAddress] = useState<string>('…');
  const { server } = useServerDetail();

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const host = window.location.hostname;
    setAddress(`${host}:${MINECRAFT_DEFAULT_PORT}`);
  }, []);

  const copyAddress = async () => {
    try {
      await navigator.clipboard.writeText(address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div className="space-y-6 p-8">
      <div className="mb-2">
        <h2 className="text-lg font-semibold text-white">Overview</h2>
        <p className="text-sm text-panel-muted">Status, Verbindung, Server-Infos und Performance auf einen Blick.</p>
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
            {copied ? 'Copied to clipboard' : 'Click to copy'}
          </p>
        </div>

        <div className="rounded-xl border border-panel-border bg-panel-card p-5">
          <div className="flex items-center gap-2 text-panel-muted">
            <Info className="h-5 w-5 text-panel-purple" />
            <span className="text-xs font-medium uppercase tracking-wider">SERVER INFO</span>
          </div>
          <dl className="mt-2 space-y-1 text-sm">
            {defaultServerInfo.map((row) => (
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
            {defaultPerformance.map((p) => (
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
