'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Server,
  ArrowLeft,
  Plus,
  Trash2,
  ChevronDown,
  ChevronRight,
  Code,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const MOD_LOADERS = [
  'Vanilla',
  'Paper',
  'Spigot',
  'Bukkit',
  'Forge',
  'Fabric',
  'NeoForge',
  'Mohist',
  'Magma',
] as const;

const MC_VERSIONS = [
  '1.21.1',
  '1.21',
  '1.20.6',
  '1.20.4',
  '1.20.1',
  '1.19.4',
  '1.18.2',
  '1.16.5',
  '1.12.2',
  '1.7.10',
] as const;

const DOCKER_IMAGES = ['Java21', 'Java17', 'Java11', 'Java8'] as const;

type PortEntry = { id: string; port: string; label: string };
type EnvEntry = { id: string; key: string; value: string };

export default function NewServerPage() {
  const router = useRouter();
  const [creating, setCreating] = useState(false);
  const [created, setCreated] = useState(false);
  const [createdSlug, setCreatedSlug] = useState('');

  // Left column
  const [serverName, setServerName] = useState('');
  const [port, setPort] = useState('25565');
  const [maxPlayers, setMaxPlayers] = useState('16');
  const [modLoader, setModLoader] = useState<string>(MOD_LOADERS[1]); // Paper
  const [tpsCommand, setTpsCommand] = useState('tps');
  const [additionalPorts, setAdditionalPorts] = useState<PortEntry[]>([]);

  // Right column
  const [description, setDescription] = useState('');
  const [memoryMb, setMemoryMb] = useState('8192');
  const [mcVersion, setMcVersion] = useState<string>(MC_VERSIONS[0]);
  const [dockerImage, setDockerImage] = useState<string>(DOCKER_IMAGES[0]);
  const [detachedMode, setDetachedMode] = useState(false);
  const [autoStart, setAutoStart] = useState(true);

  // Advanced
  const [overridesOpen, setOverridesOpen] = useState(false);
  const [overridesJson, setOverridesJson] = useState('{}');
  const [envVars, setEnvVars] = useState<EnvEntry[]>([]);

  const addPort = () => {
    setAdditionalPorts((prev) => [
      ...prev,
      { id: String(Date.now()), port: '25566', label: '' },
    ]);
  };
  const removePort = (id: string) => {
    setAdditionalPorts((prev) => prev.filter((p) => p.id !== id));
  };
  const updatePort = (id: string, field: 'port' | 'label', value: string) => {
    setAdditionalPorts((prev) =>
      prev.map((p) => (p.id === id ? { ...p, [field]: value } : p))
    );
  };

  const addEnvVar = () => {
    setEnvVars((prev) => [...prev, { id: String(Date.now()), key: '', value: '' }]);
  };
  const removeEnvVar = (id: string) => {
    setEnvVars((prev) => prev.filter((e) => e.id !== id));
  };
  const updateEnvVar = (id: string, field: 'key' | 'value', value: string) => {
    setEnvVars((prev) =>
      prev.map((e) => (e.id === id ? { ...e, [field]: value } : e))
    );
  };

  const memoryNum = parseInt(memoryMb, 10) || 0;
  const portNum = parseInt(port, 10) || 25565;
  const maxPlayersNum = parseInt(maxPlayers, 10) || 16;
  const isValid =
    serverName.trim().length > 0 &&
    portNum >= 1 &&
    portNum <= 65535 &&
    maxPlayersNum >= 1 &&
    maxPlayersNum <= 1000 &&
    memoryNum >= 512 &&
    memoryNum <= 128 * 1024;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid || creating) return;
    setCreating(true);
    try {
      const payload = {
        name: serverName.trim(),
        description: description.trim(),
        port: portNum,
        maxPlayers: maxPlayersNum,
        modLoader,
        tpsCommand: tpsCommand.trim() || undefined,
        additionalPorts: additionalPorts
          .filter((p) => p.port.trim())
          .map((p) => ({ port: parseInt(p.port, 10) || 0, label: p.label.trim() || undefined })),
        memoryMb: memoryNum,
        mcVersion,
        dockerImage,
        detachedMode,
        autoStart,
        overrides: (() => {
          try {
            const o = JSON.parse(overridesJson || '{}');
            return Object.keys(o).length ? o : undefined;
          } catch {
            return undefined;
          }
        })(),
        env: envVars
          .filter((e) => e.key.trim())
          .reduce<Record<string, string>>((acc, e) => {
            acc[e.key.trim()] = e.value.trim();
            return acc;
          }, {}),
      };
      const res = await fetch('/api/servers', {
        credentials: 'include',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        const data = await res.json();
        setCreatedSlug(data.slug ?? data.name?.toLowerCase().replace(/\s+/g, '-') ?? '');
        setCreated(true);
      } else {
        const err = await res.json().catch(() => ({}));
        alert(err.message || 'Erstellen fehlgeschlagen.');
      }
    } catch {
      alert('Netzwerkfehler.');
    } finally {
      setCreating(false);
    }
  };

  if (created) {
    return (
      <div className="min-h-screen">
        <header className="border-b border-panel-border bg-panel-card/50 px-8 py-6">
          <h1 className="flex items-center gap-2 text-2xl font-semibold text-white">
            <Server className="h-7 w-7 text-panel-muted" />
            Server erstellt
          </h1>
        </header>
        <div className="p-8">
          <div className="rounded-xl border border-panel-border bg-panel-card p-8 text-center">
            <p className="text-lg text-panel-green">Server wurde erfolgreich angelegt.</p>
            <p className="mt-2 text-sm text-panel-muted">
              {serverName} – {mcVersion}, {modLoader}, {memoryMb} MB RAM
            </p>
            <div className="mt-6 flex justify-center gap-3">
              {createdSlug && (
                <Link
                  href={`/servers/${createdSlug}`}
                  className="inline-flex items-center gap-2 rounded-lg bg-panel-accent px-4 py-2 text-sm font-medium text-white hover:bg-panel-accent-hover"
                >
                  Server öffnen
                </Link>
              )}
              <Link
                href="/servers"
                className="inline-flex items-center gap-2 rounded-lg border border-panel-border px-4 py-2 text-sm text-white hover:bg-panel-border/50"
              >
                Zur Server-Liste
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <header className="border-b border-panel-border bg-panel-card/50 px-8 py-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="flex items-center gap-2 text-2xl font-semibold text-white">
              <Server className="h-7 w-7 text-panel-muted" />
              Neuen Server erstellen
            </h1>
            <p className="mt-1 text-sm text-panel-muted">
              Alle Einstellungen werden übernommen und sind nach dem Start aktiv.
            </p>
          </div>
          <Link
            href="/servers"
            className="flex items-center gap-2 rounded-lg border border-panel-border bg-panel-card px-4 py-2 text-sm text-white hover:bg-panel-border/50"
          >
            <ArrowLeft className="h-4 w-4" />
            Zurück
          </Link>
        </div>
      </header>

      <form onSubmit={handleSubmit} className="p-8">
        <div className="mb-6 rounded-lg border border-panel-border bg-panel-card px-4 py-3 text-sm text-panel-muted">
          Alle Einstellungen werden beim Erstellen übernommen. Später können sie nur bei gestopptem Server geändert werden.
        </div>

        <div className="grid gap-8 lg:grid-cols-2">
          {/* Left column */}
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-white">Server-Name</label>
              <input
                type="text"
                value={serverName}
                onChange={(e) => setServerName(e.target.value)}
                placeholder="z. B. Mein Survival"
                className="mt-1 w-full rounded-lg border border-panel-border bg-panel-bg px-3 py-2 text-white placeholder:text-panel-muted"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-white">Port</label>
              <input
                type="number"
                min={1}
                max={65535}
                value={port}
                onChange={(e) => setPort(e.target.value)}
                className="mt-1 w-full rounded-lg border border-panel-border bg-panel-bg px-3 py-2 text-white"
              />
              <p className="mt-1 text-xs text-panel-muted">
                Port kann bei Proxy-Servern nicht geändert werden.
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-white">Max. Spieler</label>
              <input
                type="number"
                min={1}
                max={1000}
                value={maxPlayers}
                onChange={(e) => setMaxPlayers(e.target.value)}
                className="mt-1 w-full rounded-lg border border-panel-border bg-panel-bg px-3 py-2 text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-white">Mod Loader</label>
              <select
                value={modLoader}
                onChange={(e) => setModLoader(e.target.value)}
                className="mt-1 w-full rounded-lg border border-panel-border bg-panel-bg px-3 py-2 text-white"
              >
                {MOD_LOADERS.map((v) => (
                  <option key={v} value={v}>
                    {v}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-white">
                TPS-Befehl (optional)
              </label>
              <input
                type="text"
                value={tpsCommand}
                onChange={(e) => setTpsCommand(e.target.value)}
                placeholder="tps"
                className="mt-1 w-full rounded-lg border border-panel-border bg-panel-bg px-3 py-2 text-white placeholder:text-panel-muted"
              />
              <p className="mt-1 text-xs text-panel-muted">
                Override für TPS-Monitoring (leer = deaktiviert). Nutze &apos;??&apos; für
                Fallback-Befehle (z. B. &apos;forge tps ?? neoforge tps ?? tps&apos;).
              </p>
            </div>
            <div className="rounded-xl border border-panel-border bg-panel-card p-4">
              <p className="text-sm font-medium text-white">
                Zusätzliche Ports für Mods, Plugins oder Dienste (z. B. BlueMap, Voice-Chat, Dynmap)
              </p>
              {additionalPorts.length === 0 ? (
                <p className="mt-2 text-xs text-panel-muted">
                  Keine zusätzlichen Ports. Klicke „Port hinzufügen“, um Ports für Mods oder Dienste zu öffnen.
                </p>
              ) : (
                <ul className="mt-3 space-y-2">
                  {additionalPorts.map((p) => (
                    <li key={p.id} className="flex items-center gap-2">
                      <input
                        type="number"
                        min={1}
                        max={65535}
                        value={p.port}
                        onChange={(e) => updatePort(p.id, 'port', e.target.value)}
                        placeholder="Port"
                        className="w-24 rounded border border-panel-border bg-panel-bg px-2 py-1.5 text-sm text-white"
                      />
                      <input
                        type="text"
                        value={p.label}
                        onChange={(e) => updatePort(p.id, 'label', e.target.value)}
                        placeholder="Bezeichnung (optional)"
                        className="flex-1 rounded border border-panel-border bg-panel-bg px-2 py-1.5 text-sm text-white placeholder:text-panel-muted"
                      />
                      <button
                        type="button"
                        onClick={() => removePort(p.id)}
                        className="rounded p-1.5 text-panel-muted hover:bg-panel-red/20 hover:text-panel-red"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
              <button
                type="button"
                onClick={addPort}
                className="mt-3 flex items-center gap-2 rounded-lg border border-panel-border px-3 py-2 text-sm text-white hover:bg-panel-border/50"
              >
                <Plus className="h-4 w-4" />
                Port hinzufügen
              </button>
            </div>
          </div>

          {/* Right column */}
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-white">Beschreibung</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="z. B. Ein Minecraft-Server"
                rows={2}
                className="mt-1 w-full rounded-lg border border-panel-border bg-panel-bg px-3 py-2 text-white placeholder:text-panel-muted"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-white">RAM (MB)</label>
              <input
                type="number"
                min={512}
                max={131072}
                step={256}
                value={memoryMb}
                onChange={(e) => setMemoryMb(e.target.value)}
                className="mt-1 w-full rounded-lg border border-panel-border bg-panel-bg px-3 py-2 text-white"
              />
              <p className="mt-1 text-xs text-panel-muted">Empfohlen: 4096 MB</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-white">Minecraft-Version</label>
              <select
                value={mcVersion}
                onChange={(e) => setMcVersion(e.target.value)}
                className="mt-1 w-full rounded-lg border border-panel-border bg-panel-bg px-3 py-2 text-white"
              >
                {MC_VERSIONS.map((v) => (
                  <option key={v} value={v}>
                    {v}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-white">
                Docker-Image (erweitert)
              </label>
              <select
                value={dockerImage}
                onChange={(e) => setDockerImage(e.target.value)}
                className="mt-1 w-full rounded-lg border border-panel-border bg-panel-bg px-3 py-2 text-white"
              >
                {DOCKER_IMAGES.map((v) => (
                  <option key={v} value={v}>
                    {v}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-4 rounded-xl border border-panel-border bg-panel-card p-4">
              <p className="text-sm font-medium text-white">Lifecycle</p>
              <label className="flex items-center justify-between">
                <span className="text-sm text-panel-muted">
                  Detached Mode – Server läuft weiter, wenn LaxPanel stoppt (nicht bei Proxy).
                </span>
                <button
                  type="button"
                  role="switch"
                  aria-checked={detachedMode}
                  onClick={() => setDetachedMode((v) => !v)}
                  className={cn(
                    'relative h-6 w-11 rounded-full transition-colors',
                    detachedMode ? 'bg-panel-accent' : 'bg-panel-border'
                  )}
                >
                  <span
                    className={cn(
                      'absolute top-1 h-4 w-4 rounded-full bg-white transition-transform',
                      detachedMode ? 'left-6' : 'left-1'
                    )}
                  />
                </button>
              </label>
              <label className="flex items-center justify-between">
                <span className="text-sm text-panel-muted">
                  Auto Start – Startet automatisch mit LaxPanel.
                </span>
                <button
                  type="button"
                  role="switch"
                  aria-checked={autoStart}
                  onClick={() => setAutoStart((v) => !v)}
                  className={cn(
                    'relative h-6 w-11 rounded-full transition-colors',
                    autoStart ? 'bg-panel-accent' : 'bg-panel-border'
                  )}
                >
                  <span
                    className={cn(
                      'absolute top-1 h-4 w-4 rounded-full bg-white transition-transform',
                      autoStart ? 'left-6' : 'left-1'
                    )}
                  />
                </button>
              </label>
            </div>
          </div>
        </div>

        {/* Advanced */}
        <div className="mt-8 space-y-4">
          <button
            type="button"
            onClick={() => setOverridesOpen((v) => !v)}
            className="flex w-full items-center justify-between rounded-xl border border-panel-border bg-panel-card p-4 text-left text-white hover:bg-panel-border/30"
          >
            <span className="font-medium">Docker-Container-Overrides (erweitert)</span>
            <span className="flex items-center gap-2 text-sm text-panel-muted">
              {overridesJson.trim() !== '{}' ? '1 Override' : '0 Overrides'}
              {overridesOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            </span>
          </button>
          {overridesOpen && (
            <div className="rounded-xl border border-panel-border bg-panel-card p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-panel-muted">JSON</span>
                <button
                  type="button"
                  className="flex items-center gap-1 rounded border border-panel-border px-2 py-1 text-xs text-white hover:bg-panel-border/50"
                >
                  <Code className="h-3 w-3" />
                  JSON-Editor
                </button>
              </div>
              <textarea
                value={overridesJson}
                onChange={(e) => setOverridesJson(e.target.value)}
                spellCheck={false}
                rows={6}
                className="w-full rounded border border-panel-border bg-panel-bg p-2 font-mono text-sm text-white"
              />
            </div>
          )}

          <div className="rounded-xl border border-panel-border bg-panel-card p-4">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-white">Umgebungsvariablen</label>
              <button
                type="button"
                onClick={addEnvVar}
                className="flex items-center gap-2 rounded border border-panel-border px-3 py-1.5 text-sm text-white hover:bg-panel-border/50"
              >
                <Plus className="h-4 w-4" />
                Variable hinzufügen
              </button>
            </div>
            {envVars.length === 0 ? (
              <p className="mt-2 text-xs text-panel-muted">
                z. B. PLUGINS mit URL zu einem Plugin-JAR.
              </p>
            ) : (
              <ul className="mt-3 space-y-2">
                {envVars.map((e) => (
                  <li key={e.id} className="flex items-center gap-2">
                    <input
                      type="text"
                      value={e.key}
                      onChange={(ev) => updateEnvVar(e.id, 'key', ev.target.value)}
                      placeholder="Name"
                      className="w-32 rounded border border-panel-border bg-panel-bg px-2 py-1.5 text-sm text-white placeholder:text-panel-muted"
                    />
                    <input
                      type="text"
                      value={e.value}
                      onChange={(ev) => updateEnvVar(e.id, 'value', ev.target.value)}
                      placeholder="Wert (z. B. URL)"
                      className="flex-1 rounded border border-panel-border bg-panel-bg px-2 py-1.5 text-sm text-white placeholder:text-panel-muted"
                    />
                    <button
                      type="button"
                      onClick={() => removeEnvVar(e.id)}
                      className="rounded p-1.5 text-panel-muted hover:bg-panel-red/20 hover:text-panel-red"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <div className="mt-8 flex gap-3">
          <button
            type="submit"
            disabled={!isValid || creating}
            className={cn(
              'rounded-lg px-6 py-2.5 text-sm font-medium',
              isValid && !creating
                ? 'bg-panel-accent text-white hover:bg-panel-accent-hover'
                : 'cursor-not-allowed bg-panel-border/50 text-panel-muted'
            )}
          >
            {creating ? 'Wird erstellt…' : 'Server erstellen'}
          </button>
          <Link
            href="/servers"
            className="rounded-lg border border-panel-border px-6 py-2.5 text-sm text-panel-muted hover:bg-panel-border/50 hover:text-white"
          >
            Abbrechen
          </Link>
        </div>
      </form>
    </div>
  );
}
