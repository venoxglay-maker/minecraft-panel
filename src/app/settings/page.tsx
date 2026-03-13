'use client';

import { useState } from 'react';
import { Settings as SettingsIcon, Server, Globe, Lock, Save, Zap, Circle, Plus, Cpu, HardDrive, Wifi } from 'lucide-react';
import { cn } from '@/lib/utils';

const tabs = [
  { id: 'server', label: 'Server', icon: Cpu },
  { id: 'defaults', label: 'Server Defaults', icon: Server },
  { id: 'routing', label: 'Routing', icon: Globe },
  { id: 'auth', label: 'Authentication', icon: Lock },
];

type ListenerItem = {
  id: string;
  name: string;
  port: string;
  default?: boolean;
  serverCount: number;
};

const initialListeners: ListenerItem[] = [
  { id: '1', name: 'Primary', port: '25565', default: true, serverCount: 2 },
  { id: '2', name: 'Testing', port: '25567', serverCount: 1 },
];

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('server');
  const [baseDomain, setBaseDomain] = useState('play.laxpanel.app');
  const [proxyEnabled, setProxyEnabled] = useState(false);
  const [configSaved, setConfigSaved] = useState(false);
  const [listeners, setListeners] = useState<ListenerItem[]>(initialListeners);
  const [newName, setNewName] = useState('');
  const [newPort, setNewPort] = useState('25566');
  const [saving, setSaving] = useState(false);

  const handleSaveConfig = () => {
    setSaving(true);
    setTimeout(() => {
      setSaving(false);
      setConfigSaved(true);
      setTimeout(() => setConfigSaved(false), 3000);
    }, 500);
  };

  const handleAddListener = () => {
    const name = newName.trim() || `Listener ${listeners.length + 1}`;
    const port = newPort.trim() || '25566';
    setListeners((prev) => [
      ...prev,
      { id: String(Date.now()), name, port, serverCount: 0 },
    ]);
    setNewName('');
    setNewPort('25566');
  };

  return (
    <div className="min-h-screen">
      <header className="border-b border-panel-border bg-panel-card/50 px-8 py-6">
        <h1 className="flex items-center gap-2 text-2xl font-semibold text-white">
          <SettingsIcon className="h-7 w-7 text-panel-muted" />
          Settings
        </h1>
        <p className="mt-1 text-sm text-panel-muted">
          Configure LaxPanel and default server settings
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
                Informationen zum Host, auf dem das Panel und die Minecraft-Server laufen.
              </p>
              <dl className="mt-4 grid gap-3 sm:grid-cols-2">
                <div className="flex items-center gap-2">
                  <Cpu className="h-4 w-4 text-panel-muted" />
                  <div>
                    <dt className="text-xs text-panel-muted">Hostname</dt>
                    <dd className="font-mono text-sm text-white">panel.example.com</dd>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Wifi className="h-4 w-4 text-panel-muted" />
                  <div>
                    <dt className="text-xs text-panel-muted">IP</dt>
                    <dd className="font-mono text-sm text-white">192.168.1.100</dd>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Server className="h-4 w-4 text-panel-muted" />
                  <div>
                    <dt className="text-xs text-panel-muted">Panel-Version</dt>
                    <dd className="text-sm text-white">v0.0.1</dd>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <HardDrive className="h-4 w-4 text-panel-muted" />
                  <div>
                    <dt className="text-xs text-panel-muted">Speicher</dt>
                    <dd className="text-sm text-white">19.96 MB / 847.06 GB frei</dd>
                  </div>
                </div>
              </dl>
            </div>
          </>
        )}
        {activeTab === 'routing' && (
          <>
            <div className="rounded-xl border border-panel-border bg-panel-card p-5">
              <h2 className="text-lg font-semibold text-white">Proxy Configuration</h2>
              <p className="text-sm text-panel-muted">
                Global proxy settings and base domain configuration
              </p>
              <div className="mt-4 flex flex-wrap items-center gap-4">
                <input
                  type="text"
                  value={baseDomain}
                  onChange={(e) => setBaseDomain(e.target.value)}
                  className="flex-1 min-w-[200px] rounded-lg border border-panel-border bg-panel-bg px-3 py-2 text-white placeholder:text-panel-muted"
                  placeholder="Base domain"
                />
                <label className="flex items-center gap-2 text-sm text-panel-muted">
                  <input
                    type="checkbox"
                    checked={proxyEnabled}
                    onChange={(e) => setProxyEnabled(e.target.checked)}
                    className="rounded"
                  />
                  Enable proxy
                </label>
                <button
                  type="button"
                  onClick={handleSaveConfig}
                  disabled={saving}
                  className="flex items-center gap-2 rounded-lg bg-panel-accent px-4 py-2 text-sm font-medium text-white hover:bg-panel-accent-hover disabled:opacity-50"
                >
                  <Save className="h-4 w-4" />
                  {configSaved ? 'Saved' : saving ? 'Saving…' : 'Save Configuration'}
                </button>
              </div>
              <p className="mt-2 text-xs text-panel-muted">
                Optional base domain that will be appended to server hostnames (e.g. &apos;survival&apos; becomes &apos;survival.minecraft.example.com&apos;)
              </p>
            </div>
            <div className="rounded-xl border border-panel-border bg-panel-card p-5">
              <h2 className="text-lg font-semibold text-white">Proxy Listeners</h2>
              <p className="text-sm text-panel-muted">Configure individual proxy listening ports</p>
              <p className="mt-2 text-xs text-panel-muted">{listeners.length} Listeners</p>
              <ul className="mt-4 space-y-2">
                {listeners.map((l) => (
                  <li
                    key={l.id}
                    className="flex items-center justify-between rounded-lg border border-panel-border bg-panel-bg p-3"
                  >
                    <div className="flex items-center gap-2">
                      <Circle className="h-2 w-2 shrink-0 fill-panel-green text-panel-green" />
                      <span className="font-mono text-white">:{l.port}</span>
                      {l.default && (
                        <span className="rounded bg-panel-border px-1.5 py-0.5 text-xs text-panel-muted">
                          Default
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-panel-muted">
                      {l.serverCount} server{l.serverCount !== 1 ? 's' : ''} using this listener
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
                    placeholder="e.g. Secondary, Development"
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
                  Add Listener
                </button>
              </div>
            </div>
            <div className="rounded-xl border border-panel-border bg-panel-card p-5">
              <h2 className="text-lg font-semibold text-white">Active Routes</h2>
              <p className="text-sm text-panel-muted">Servers currently using proxy routing</p>
              <ul className="mt-4 space-y-2 text-sm">
                <li className="flex items-center gap-2 text-panel-muted">
                  <Zap className="h-4 w-4 shrink-0 text-panel-green" />
                  sf4.play.laxpanel.app — Active
                </li>
                <li className="flex items-center gap-2 text-panel-muted">
                  <Zap className="h-4 w-4 shrink-0 text-panel-green" />
                  sfltest.play.laxpanel.app — Active
                </li>
              </ul>
            </div>
          </>
        )}
        {activeTab === 'defaults' && (
          <div className="rounded-xl border border-panel-border bg-panel-card p-5">
            <h2 className="text-lg font-semibold text-white">Server Defaults</h2>
            <p className="text-sm text-panel-muted">Default settings for new servers</p>
          </div>
        )}
        {activeTab === 'auth' && (
          <div className="rounded-xl border border-panel-border bg-panel-card p-5">
            <h2 className="text-lg font-semibold text-white">Authentication</h2>
            <p className="text-sm text-panel-muted">Login and security settings</p>
          </div>
        )}
      </div>
    </div>
  );
}
