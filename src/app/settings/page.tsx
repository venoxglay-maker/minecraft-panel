'use client';

import { useState, useEffect, useCallback } from 'react';
import { Settings as SettingsIcon, Server, Globe, Lock, Save, Circle, Plus, Cpu, HardDrive, Wifi } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ListenerItem {
  id: string;
  name: string;
  port: string;
  default?: boolean;
  serverCount?: number;
}
interface PanelSettings {
  baseDomain: string;
  proxyEnabled: boolean;
  listeners: ListenerItem[];
  activeRoutes: Record<string, string>;
}

const tabs = [
  { id: 'server', label: 'Server', icon: Cpu },
  { id: 'defaults', label: 'Server Defaults', icon: Server },
  { id: 'routing', label: 'Routing', icon: Globe },
  { id: 'auth', label: 'Authentication', icon: Lock },
];

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('server');
  const [settings, setSettings] = useState<PanelSettings | null>(null);
  const [dashboardInfo, setDashboardInfo] = useState<{ hostname?: string; version?: string; diskFree?: string } | null>(null);
  const [configSaved, setConfigSaved] = useState(false);
  const [newName, setNewName] = useState('');
  const [newPort, setNewPort] = useState('25566');
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const [setRes, dashRes] = await Promise.all([
        fetch('/api/settings', { credentials: 'include' }),
        fetch('/api/dashboard', { credentials: 'include' }),
      ]);
      if (setRes.ok) {
        const data = await setRes.json();
        setSettings(data);
      } else setSettings(null);
      if (dashRes.ok) {
        const d = await dashRes.json();
        setDashboardInfo({ hostname: d.hostname, version: d.version, diskFree: d.diskFree });
      } else setDashboardInfo(null);
    } catch {
      setSettings(null);
      setDashboardInfo(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleSaveConfig = async () => {
    if (!settings) return;
    setSaving(true);
    try {
      const res = await fetch('/api/settings', {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });
      if (res.ok) {
        setConfigSaved(true);
        setTimeout(() => setConfigSaved(false), 3000);
      }
    } finally {
      setSaving(false);
    }
  };

  const handleAddListener = () => {
    if (!settings) return;
    const name = newName.trim() || `Listener ${settings.listeners.length + 1}`;
    const port = newPort.trim() || '25566';
    setSettings({
      ...settings,
      listeners: [
        ...settings.listeners,
        { id: `l-${Date.now()}`, name, port, serverCount: 0 },
      ],
    });
    setNewName('');
    setNewPort('25566');
  };

  const setBaseDomain = (v: string) => setSettings((s) => (s ? { ...s, baseDomain: v } : s));
  const setProxyEnabled = (v: boolean) => setSettings((s) => (s ? { ...s, proxyEnabled: v } : s));

  if (loading || !settings) {
    return (
      <div className="flex min-h-screen items-center justify-center p-8">
        <p className="text-panel-muted">Einstellungen werden geladen…</p>
      </div>
    );
  }

  const activeRoutesList = Object.entries(settings.activeRoutes || {});

  return (
    <div className="min-h-screen">
      <header className="border-b border-panel-border bg-panel-card/50 px-8 py-6">
        <h1 className="flex items-center gap-2 text-2xl font-semibold text-white">
          <SettingsIcon className="h-7 w-7 text-panel-muted" />
          Einstellungen
        </h1>
        <p className="mt-1 text-sm text-panel-muted">
          LaxPanel und Standard-Server konfigurieren
        </p>
        <nav className="mt-4 flex gap-2">
          {tabs.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setActiveTab(t.id)}
              className={cn(
                'flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium transition-colors',
                activeTab === t.id
                  ? 'border-panel-accent bg-panel-accent/20 text-amber-200'
                  : 'border-panel-border bg-panel-card text-panel-muted hover:text-white'
              )}
            >
              <t.icon className="h-4 w-4" />
              {t.label}
            </button>
          ))}
        </nav>
      </header>

      <div className="space-y-6 p-8">
        {activeTab === 'server' && (
          <>
            <div className="rounded-xl border border-panel-border bg-panel-card p-5">
              <h2 className="text-lg font-semibold text-white">Panel-Server</h2>
              <p className="text-sm text-panel-muted">
                Host, auf dem das Panel und die Minecraft-Server laufen.
              </p>
              <dl className="mt-4 grid gap-3 sm:grid-cols-2">
                <div className="flex items-center gap-2">
                  <Cpu className="h-4 w-4 text-panel-muted" />
                  <div>
                    <dt className="text-xs text-panel-muted">Hostname</dt>
                    <dd className="font-mono text-sm text-white">{dashboardInfo?.hostname ?? '–'}</dd>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Wifi className="h-4 w-4 text-panel-muted" />
                  <div>
                    <dt className="text-xs text-panel-muted">Panel-Version</dt>
                    <dd className="text-sm text-white">v{dashboardInfo?.version ?? '–'}</dd>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Server className="h-4 w-4 text-panel-muted" />
                  <div>
                    <dt className="text-xs text-panel-muted">Speicher (System)</dt>
                    <dd className="text-sm text-white">{dashboardInfo?.diskFree ?? '–'}</dd>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <HardDrive className="h-4 w-4 text-panel-muted" />
                  <div>
                    <dt className="text-xs text-panel-muted">Data-Verzeichnis</dt>
                    <dd className="text-sm text-panel-muted">./data (Server, Benutzer, Einstellungen)</dd>
                  </div>
                </div>
              </dl>
            </div>
          </>
        )}
        {activeTab === 'routing' && (
          <>
            <div className="rounded-xl border border-panel-border bg-panel-card p-5">
              <h2 className="text-lg font-semibold text-white">Proxy / Basis-Domain</h2>
              <p className="text-sm text-panel-muted">
                Basis-Domain für Server-Hostnamen (z. B. play.laxpanel.app).
              </p>
              <div className="mt-4 flex flex-wrap items-center gap-4">
                <input
                  type="text"
                  value={settings.baseDomain}
                  onChange={(e) => setBaseDomain(e.target.value)}
                  className="min-w-[200px] flex-1 rounded-lg border border-panel-border bg-panel-bg px-3 py-2 text-white placeholder:text-panel-muted"
                  placeholder="Basis-Domain"
                />
                <label className="flex items-center gap-2 text-sm text-panel-muted">
                  <input
                    type="checkbox"
                    checked={settings.proxyEnabled}
                    onChange={(e) => setProxyEnabled(e.target.checked)}
                    className="rounded"
                  />
                  Proxy aktiv
                </label>
                <button
                  type="button"
                  onClick={handleSaveConfig}
                  disabled={saving}
                  className="flex items-center gap-2 rounded-lg bg-panel-accent px-4 py-2 text-sm font-medium text-white hover:bg-panel-accent-hover disabled:opacity-50"
                >
                  <Save className="h-4 w-4" />
                  {configSaved ? 'Gespeichert' : saving ? 'Speichern…' : 'Speichern'}
                </button>
              </div>
              <p className="mt-2 text-xs text-panel-muted">
                Server-Slug wird als Subdomain genutzt (z. B. survival → survival.{settings.baseDomain}).
              </p>
            </div>
            <div className="rounded-xl border border-panel-border bg-panel-card p-5">
              <h2 className="text-lg font-semibold text-white">Proxy-Listener</h2>
              <p className="text-sm text-panel-muted">Ports, auf denen der Proxy lauscht</p>
              <p className="mt-2 text-xs text-panel-muted">{settings.listeners.length} Listener</p>
              <ul className="mt-4 space-y-2">
                {settings.listeners.map((l: ListenerItem) => (
                  <li
                    key={l.id}
                    className="flex items-center justify-between rounded-lg border border-panel-border bg-panel-bg p-3"
                  >
                    <div className="flex items-center gap-2">
                      <Circle className="h-2 w-2 shrink-0 fill-panel-green text-panel-green" />
                      <span className="font-mono text-white">:{l.port}</span>
                      {l.default && (
                        <span className="rounded bg-panel-border px-1.5 py-0.5 text-xs text-panel-muted">
                          Standard
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-panel-muted">
                      {l.name}
                      {(l.serverCount ?? 0) > 0 && ` · ${l.serverCount} Server`}
                    </span>
                  </li>
                ))}
              </ul>
              <div className="mt-4 flex flex-wrap items-end gap-3 rounded-lg border border-panel-border bg-panel-bg/50 p-3">
                <label className="flex flex-col gap-1 text-sm">
                  <span className="text-panel-muted">Name</span>
                  <input
                    type="text"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="z. B. Sekundär"
                    className="w-48 rounded border border-panel-border bg-panel-card px-2 py-1.5 text-white placeholder:text-panel-muted"
                  />
                </label>
                <label className="flex flex-col gap-1 text-sm">
                  <span className="text-panel-muted">Port</span>
                  <input
                    type="text"
                    value={newPort}
                    onChange={(e) => setNewPort(e.target.value)}
                    placeholder="25566"
                    className="w-24 rounded border border-panel-border bg-panel-card px-2 py-1.5 text-white placeholder:text-panel-muted"
                  />
                </label>
                <button
                  type="button"
                  onClick={handleAddListener}
                  className="flex items-center gap-2 rounded-lg border border-panel-border bg-panel-card px-4 py-2 text-sm text-white hover:bg-panel-border/50"
                >
                  <Plus className="h-4 w-4" />
                  Listener hinzufügen
                </button>
              </div>
            </div>
            <div className="rounded-xl border border-panel-border bg-panel-card p-5">
              <h2 className="text-lg font-semibold text-white">Aktive Routen</h2>
              <p className="text-sm text-panel-muted">Server mit zugewiesenem Hostnamen</p>
              {activeRoutesList.length === 0 ? (
                <p className="mt-4 text-sm text-panel-muted">Noch keine Routen. Server nutzen Standard-Port oder Basis-Domain.</p>
              ) : (
                <ul className="mt-4 space-y-2 text-sm">
                  {activeRoutesList.map(([slug, hostname]) => (
                    <li key={slug} className="flex items-center gap-2 text-panel-muted">
                      <span className="font-mono text-white">{hostname}</span>
                      <span className="text-panel-muted">— {slug}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </>
        )}
        {activeTab === 'defaults' && (
          <div className="rounded-xl border border-panel-border bg-panel-card p-5">
            <h2 className="text-lg font-semibold text-white">Server-Standardwerte</h2>
            <p className="text-sm text-panel-muted">Voreinstellungen für neue Server (Port, RAM, Version) werden beim Erstellen gewählt.</p>
          </div>
        )}
        {activeTab === 'auth' && (
          <div className="rounded-xl border border-panel-border bg-panel-card p-5">
            <h2 className="text-lg font-semibold text-white">Authentifizierung</h2>
            <p className="text-sm text-panel-muted">Anmeldung und Benutzer unter <a href="/users" className="text-panel-accent hover:underline">Benutzer</a> verwalten.</p>
          </div>
        )}
      </div>
    </div>
  );
}
