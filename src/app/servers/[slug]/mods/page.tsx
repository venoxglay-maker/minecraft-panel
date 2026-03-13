'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { Package, Plus, Trash2, Search } from 'lucide-react';
import { cn } from '@/lib/utils';

type ModEntry = { id: string; name: string; version?: string; fileName?: string };

export default function ServerModsPage() {
  const params = useParams();
  const slug = params?.slug as string;
  const [mods, setMods] = useState<ModEntry[]>([]);
  const [addInput, setAddInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchMods = useCallback(async () => {
    if (!slug) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/servers/${slug}/mods`, { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setMods(Array.isArray(data) ? data : []);
      } else setMods([]);
    } catch {
      setMods([]);
      setError('Mods konnten nicht geladen werden.');
    } finally {
      setLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    fetchMods();
  }, [fetchMods]);

  const handleAdd = async () => {
    const projectId = addInput.trim();
    if (!projectId) return;
    setAdding(true);
    setError(null);
    try {
      const res = await fetch(`/api/servers/${slug}/mods`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setAddInput('');
        await fetchMods();
      } else setError(data.message || 'Mod hinzufügen fehlgeschlagen.');
    } catch {
      setError('Mod hinzufügen fehlgeschlagen.');
    } finally {
      setAdding(false);
    }
  };

  const handleRemove = async (fileName: string) => {
    if (!confirm(`Mod „${fileName}“ wirklich entfernen?`)) return;
    setError(null);
    try {
      const res = await fetch(`/api/servers/${slug}/mods?file=${encodeURIComponent(fileName)}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (res.ok) await fetchMods();
      else {
        const data = await res.json().catch(() => ({}));
        setError(data.message || 'Entfernen fehlgeschlagen.');
      }
    } catch {
      setError('Entfernen fehlgeschlagen.');
    }
  };

  return (
    <div className="p-8">
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-white">Mods</h2>
        <p className="text-sm text-panel-muted">
          Mods aus dem mods-Ordner. Hinzufügen per Modrinth-Projekt-ID (z. B. von modrinth.com/mod/…). Modpacks über die Modpacks-Seite installieren.
        </p>
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-2 text-sm text-amber-200">
          {error}
        </div>
      )}

      <div className="mb-6 flex flex-wrap items-center gap-3">
        <div className="flex min-w-[200px] flex-1 items-center gap-2 rounded-lg border border-panel-border bg-panel-bg px-3 py-2">
          <Search className="h-4 w-4 shrink-0 text-panel-muted" />
          <input
            type="text"
            value={addInput}
            onChange={(e) => setAddInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
            placeholder="Modrinth-Projekt-ID (z. B. lithium)"
            className="flex-1 bg-transparent text-white outline-none placeholder:text-panel-muted"
          />
        </div>
        <button
          type="button"
          onClick={handleAdd}
          disabled={adding || !addInput.trim()}
          className={cn(
            'flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium',
            addInput.trim() && !adding
              ? 'bg-panel-accent text-white hover:bg-panel-accent-hover'
              : 'cursor-not-allowed bg-panel-border/50 text-panel-muted'
          )}
        >
          {adding ? 'Wird heruntergeladen…' : 'Mod hinzufügen'}
        </button>
      </div>

      <div className="rounded-xl border border-panel-border bg-panel-card">
        <div className="border-b border-panel-border px-4 py-3">
          <h3 className="text-sm font-medium text-white">Installierte Mods ({mods.length})</h3>
        </div>
        {loading ? (
          <div className="p-8 text-center text-sm text-panel-muted">Laden…</div>
        ) : mods.length === 0 ? (
          <div className="p-8 text-center text-sm text-panel-muted">
            Noch keine Mods. Gib oben eine Modrinth-Projekt-ID ein (z. B. „lithium“ von modrinth.com/mod/lithium) oder installiere ein Modpack.
          </div>
        ) : (
          <ul className="divide-y divide-panel-border">
            {mods.map((m) => (
              <li
                key={m.id}
                className="flex items-center justify-between gap-4 px-4 py-3 hover:bg-panel-bg/50"
              >
                <div className="flex items-center gap-3">
                  <Package className="h-5 w-5 shrink-0 text-panel-muted" />
                  <div>
                    <p className="font-medium text-white">{m.name}</p>
                    {(m.version || m.fileName) && (
                      <p className="text-xs text-panel-muted">{m.fileName ?? m.version}</p>
                    )}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => handleRemove(m.fileName ?? m.id)}
                  className="rounded p-2 text-panel-muted hover:bg-panel-red/20 hover:text-panel-red"
                  title="Mod entfernen"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
