'use client';

import { useState } from 'react';
import { Package, Plus, Trash2, Search } from 'lucide-react';
import { cn } from '@/lib/utils';

type ModEntry = { id: string; name: string; version?: string };

const EXAMPLE_MODS: ModEntry[] = [
  { id: '1', name: 'ExampleMod', version: '1.0.0' },
  { id: '2', name: 'AnotherMod', version: '2.1.0' },
];

export default function ServerModsPage() {
  const [mods, setMods] = useState<ModEntry[]>(EXAMPLE_MODS);
  const [addInput, setAddInput] = useState('');
  const [adding, setAdding] = useState(false);

  const handleAdd = () => {
    const name = addInput.trim();
    if (!name) return;
    setAdding(true);
    setTimeout(() => {
      setMods((prev) => [...prev, { id: String(Date.now()), name, version: '–' }]);
      setAddInput('');
      setAdding(false);
    }, 400);
  };

  const handleRemove = (id: string) => {
    setMods((prev) => prev.filter((m) => m.id !== id));
  };

  return (
    <div className="p-8">
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-white">Mods</h2>
        <p className="text-sm text-panel-muted">
          Hier kannst du Mods zu diesem Server hinzufügen oder entfernen. Modpacks installierst du über die Modpacks-Seite.
        </p>
      </div>

      <div className="mb-6 flex flex-wrap items-center gap-3">
        <div className="flex flex-1 min-w-[200px] items-center gap-2 rounded-lg border border-panel-border bg-panel-bg px-3 py-2">
          <Search className="h-4 w-4 shrink-0 text-panel-muted" />
          <input
            type="text"
            value={addInput}
            onChange={(e) => setAddInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
            placeholder="Mod-Name oder Modrinth/CurseForge-ID eingeben..."
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
          <Plus className="h-4 w-4" />
          {adding ? 'Wird hinzugefügt…' : 'Mod hinzufügen'}
        </button>
      </div>

      <div className="rounded-xl border border-panel-border bg-panel-card">
        <div className="border-b border-panel-border px-4 py-3">
          <h3 className="text-sm font-medium text-white">Installierte Mods ({mods.length})</h3>
        </div>
        {mods.length === 0 ? (
          <div className="p-8 text-center text-sm text-panel-muted">
            Noch keine Mods. Gib oben einen Namen ein und klicke auf „Mod hinzufügen“ oder installiere ein Modpack.
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
                    {m.version && <p className="text-xs text-panel-muted">{m.version}</p>}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => handleRemove(m.id)}
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
