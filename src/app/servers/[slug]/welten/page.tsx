'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { Globe, Plus, Trash2, RefreshCw, Upload } from 'lucide-react';
import { cn } from '@/lib/utils';

type WorldEntry = { id: string; name: string; size: string; lastPlayed: string };

export default function ServerWeltenPage() {
  const params = useParams();
  const slug = params?.slug as string;
  const [worlds, setWorlds] = useState<WorldEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchWorlds = useCallback(async () => {
    if (!slug) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/servers/${slug}/worlds`, { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setWorlds(Array.isArray(data) ? data : []);
      } else setWorlds([]);
    } catch {
      setWorlds([]);
      setError('Welten konnten nicht geladen werden.');
    } finally {
      setLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    fetchWorlds();
  }, [fetchWorlds]);

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Welt „${name}“ wirklich löschen? Der Ordner wird unwiderruflich entfernt.`)) return;
    setDeleting(id);
    setError(null);
    try {
      const res = await fetch(`/api/servers/${slug}/worlds?name=${encodeURIComponent(name)}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (res.ok) await fetchWorlds();
      else {
        const data = await res.json().catch(() => ({}));
        setError(data.message || 'Löschen fehlgeschlagen.');
      }
    } catch {
      setError('Löschen fehlgeschlagen.');
    } finally {
      setDeleting(null);
    }
  };

  return (
    <div className="p-8">
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-white">Welten</h2>
        <p className="text-sm text-panel-muted">
          Welten aus dem Server-Verzeichnis. Löschen entfernt den Ordner dauerhaft. Neue Welten entstehen beim ersten Start mit level-name in server.properties.
        </p>
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-2 text-sm text-amber-200">
          {error}
        </div>
      )}

      <div className="mb-4 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={fetchWorlds}
          disabled={loading}
          className="flex items-center gap-2 rounded-lg border border-panel-border bg-panel-card px-4 py-2 text-sm text-white hover:bg-panel-border/50 disabled:opacity-50"
        >
          <RefreshCw className={cn('h-4 w-4', loading && 'animate-spin')} />
          Aktualisieren
        </button>
        <span className="flex items-center gap-2 rounded-lg border border-panel-border bg-panel-card px-4 py-2 text-sm text-panel-muted">
          <Upload className="h-4 w-4" />
          Welt ersetzen / hochladen — (Upload per Dateimanager unter Files)
        </span>
        <span className="flex items-center gap-2 rounded-lg border border-panel-border bg-panel-card px-4 py-2 text-sm text-panel-muted">
          <Plus className="h-4 w-4" />
          Neue Welt — level-name in server.properties setzen, dann Server starten
        </span>
      </div>

      <div className="rounded-xl border border-panel-border bg-panel-card">
        <div className="border-b border-panel-border px-4 py-3">
          <h3 className="text-sm font-medium text-white">Vorhandene Welten ({worlds.length})</h3>
        </div>
        {loading ? (
          <div className="p-8 text-center text-sm text-panel-muted">Laden…</div>
        ) : worlds.length === 0 ? (
          <div className="p-8 text-center text-sm text-panel-muted">
            Keine Welt-Ordner gefunden. Starte den Server einmal, damit die Standard-Welt (world) erzeugt wird.
          </div>
        ) : (
          <ul className="divide-y divide-panel-border">
            {worlds.map((w) => (
              <li
                key={w.id}
                className="flex items-center justify-between gap-4 px-4 py-3 hover:bg-panel-bg/50"
              >
                <div className="flex items-center gap-3">
                  <Globe className="h-5 w-5 shrink-0 text-panel-muted" />
                  <div>
                    <p className="font-medium text-white">{w.name}</p>
                    <p className="text-xs text-panel-muted">{w.size} · {w.lastPlayed}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleDelete(w.id, w.name)}
                    disabled={deleting === w.id}
                    className="rounded p-2 text-panel-muted hover:bg-panel-red/20 hover:text-panel-red disabled:opacity-50"
                    title="Welt löschen"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
