'use client';

import { useState } from 'react';
import { Globe, Plus, Trash2, RefreshCw, Upload } from 'lucide-react';

type WorldEntry = { id: string; name: string; size: string; lastPlayed: string };

const MOCK_WORLDS: WorldEntry[] = [
  { id: '1', name: 'world', size: '256 MB', lastPlayed: 'Vor 2 Std.' },
  { id: '2', name: 'world_nether', size: '128 MB', lastPlayed: 'Vor 2 Std.' },
  { id: '3', name: 'world_the_end', size: '64 MB', lastPlayed: 'Vor 2 Std.' },
];

export default function ServerWeltenPage() {
  const [worlds, setWorlds] = useState<WorldEntry[]>(MOCK_WORLDS);
  const [deleting, setDeleting] = useState<string | null>(null);

  const handleDelete = (id: string, name: string) => {
    if (!confirm(`Welt „${name}“ wirklich löschen?`)) return;
    setDeleting(id);
    setTimeout(() => {
      setWorlds((prev) => prev.filter((w) => w.id !== id));
      setDeleting(null);
    }, 400);
  };

  return (
    <div className="p-8">
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-white">Welten</h2>
        <p className="text-sm text-panel-muted">
          Welten löschen, ersetzen oder neue Welten hinzufügen. Änderungen wirken nach Server-Neustart.
        </p>
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        <button
          type="button"
          className="flex items-center gap-2 rounded-lg border border-panel-border bg-panel-card px-4 py-2 text-sm text-white hover:bg-panel-border/50"
        >
          <Upload className="h-4 w-4" />
          Welt ersetzen / hochladen
        </button>
        <button
          type="button"
          className="flex items-center gap-2 rounded-lg border border-panel-border bg-panel-card px-4 py-2 text-sm text-white hover:bg-panel-border/50"
        >
          <Plus className="h-4 w-4" />
          Neue Welt hinzufügen
        </button>
      </div>

      <div className="rounded-xl border border-panel-border bg-panel-card">
        <div className="border-b border-panel-border px-4 py-3">
          <h3 className="text-sm font-medium text-white">Vorhandene Welten ({worlds.length})</h3>
        </div>
        {worlds.length === 0 ? (
          <div className="p-8 text-center text-sm text-panel-muted">
            Keine Welten. Füge eine Welt hinzu oder lade eine hoch.
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
                    className="rounded p-2 text-panel-muted hover:bg-panel-border hover:text-white"
                    title="Welt zurücksetzen"
                  >
                    <RefreshCw className="h-4 w-4" />
                  </button>
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
