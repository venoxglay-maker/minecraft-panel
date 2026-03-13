'use client';

import { useState, useEffect } from 'react';
import { Package, Search, RefreshCw, Upload, Heart, Cloud, Eye } from 'lucide-react';

type ModrinthProject = {
  project_id: string;
  slug?: string;
  title: string;
  description: string;
  icon_url?: string;
  author: string;
  downloads: number;
  date_created: string;
  date_modified: string;
  latest_version?: string;
  gallery?: string[];
  categories?: string[];
  versions?: string[];
};

export default function ModpacksPage() {
  const [query, setQuery] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [modpacks, setModpacks] = useState<ModrinthProject[]>([]);
  const [versionFilter, setVersionFilter] = useState('all');
  const [loaderFilter, setLoaderFilter] = useState('all');

  useEffect(() => {
    const params = new URLSearchParams();
    params.set('facets', '[[\"project_type:modpack\"]]');
    if (query) params.set('q', query);
    params.set('limit', '24');

    setLoading(true);
    fetch(`/api/modrinth/search?${params}`)
      .then((r) => r.json())
      .then((data) => {
        setModpacks(Array.isArray(data.hits) ? data.hits : []);
      })
      .catch(() => setModpacks([]))
      .finally(() => setLoading(false));
  }, [query]);

  return (
    <div className="min-h-screen">
      <header className="border-b border-panel-border bg-panel-card/50 px-8 py-6">
        <h1 className="flex items-center gap-2 text-2xl font-semibold text-white">
          <Package className="h-7 w-7 text-panel-muted" />
          Modpacks
        </h1>
        <p className="mt-1 text-sm text-panel-muted">
          Browse and install modpacks for your servers
        </p>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <button
            type="button"
            className="flex items-center gap-2 rounded-lg border border-panel-border bg-panel-card px-4 py-2 text-sm text-panel-muted hover:bg-panel-border/50 hover:text-white"
          >
            <Cloud className="h-4 w-4" />
            Uploaded (0)
          </button>
          <button
            type="button"
            className="flex items-center gap-2 rounded-lg border border-panel-border bg-panel-card px-4 py-2 text-sm text-panel-muted hover:bg-panel-border/50 hover:text-white"
          >
            <Heart className="h-4 w-4" />
            Favorites (1)
          </button>
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <div className="flex flex-1 items-center gap-2 rounded-lg border border-panel-border bg-panel-bg px-3 py-2 min-w-[200px]">
            <Search className="h-4 w-4 text-panel-muted" />
            <input
              type="text"
              placeholder="Search modpacks..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && setQuery(searchInput)}
              className="flex-1 bg-transparent text-white outline-none placeholder:text-panel-muted"
            />
          </div>
          <select
            value={versionFilter}
            onChange={(e) => setVersionFilter(e.target.value)}
            className="rounded-lg border border-panel-border bg-panel-card px-3 py-2 text-sm text-white"
          >
            <option value="all">All Versions</option>
            <option value="1.20.1">1.20.1</option>
            <option value="1.12.2">1.12.2</option>
          </select>
          <select
            value={loaderFilter}
            onChange={(e) => setLoaderFilter(e.target.value)}
            className="rounded-lg border border-panel-border bg-panel-card px-3 py-2 text-sm text-white"
          >
            <option value="all">All Loaders</option>
            <option value="forge">Forge</option>
            <option value="fabric">Fabric</option>
            <option value="neoforge">NeoForge</option>
          </select>
          <button
            type="button"
            onClick={() => setQuery(searchInput)}
            className="flex items-center gap-2 rounded-lg bg-panel-accent px-4 py-2 text-sm font-medium text-white hover:bg-panel-accent-hover"
          >
            <Search className="h-4 w-4" />
            Search
          </button>
          <button
            type="button"
            className="flex items-center gap-2 rounded-lg border border-panel-border bg-panel-card px-4 py-2 text-sm text-white hover:bg-panel-border/50"
          >
            <RefreshCw className="h-4 w-4" />
            Sync
          </button>
          <button
            type="button"
            className="flex items-center gap-2 rounded-lg border border-panel-border bg-panel-card px-4 py-2 text-sm text-white hover:bg-panel-border/50"
          >
            <Upload className="h-4 w-4" />
            Upload Modpack
          </button>
        </div>
      </header>

      <div className="p-8">
        {loading ? (
          <div className="flex items-center justify-center py-16 text-panel-muted">
            Loading modpacks…
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {modpacks.map((p) => (
              <div
                key={p.project_id}
                className="rounded-xl border border-panel-border bg-panel-card overflow-hidden transition-colors hover:border-panel-accent/50"
              >
                <div className="flex gap-4 p-4">
                  <div className="h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-panel-bg">
                    {p.icon_url ? (
                      <img
                        src={p.icon_url}
                        alt=""
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-2xl text-panel-muted">
                        <Package className="h-6 w-6" />
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h2 className="font-semibold text-white truncate">{p.title}</h2>
                    <p className="text-xs text-panel-muted truncate">{p.author}</p>
                    <p className="mt-1 line-clamp-2 text-xs text-panel-muted">
                      {p.description || 'No description'}
                    </p>
                    <div className="mt-2 flex flex-wrap gap-1 text-xs text-panel-muted">
                      {(p.categories ?? []).filter((c) => ['forge', 'fabric', 'neoforge'].includes(c)).slice(0, 2).map((l) => (
                        <span key={l} className="rounded bg-panel-border px-1.5 py-0.5">
                          {l}
                        </span>
                      ))}
                      {(p.versions ?? []).slice(0, 2).map((v) => (
                        <span key={v}>MC: {v}</span>
                      ))}
                    </div>
                  </div>
                  <button
                    type="button"
                    className="self-start text-panel-muted hover:text-panel-red"
                    title="Add to favorites"
                  >
                    <Heart className="h-4 w-4" />
                  </button>
                </div>
                <div className="flex gap-2 border-t border-panel-border bg-panel-bg/50 p-3">
                  <button
                    type="button"
                    onClick={() => window.open(`https://modrinth.com/modpack/${p.slug ?? p.project_id}`, '_blank', 'noopener')}
                    className="flex flex-1 items-center justify-center gap-1 rounded-lg border border-panel-border py-2 text-sm text-white hover:bg-panel-border/50"
                  >
                    <Eye className="h-4 w-4" />
                    View
                  </button>
                  <button
                    type="button"
                    onClick={() => window.location.href = `/servers?install=${encodeURIComponent(p.project_id)}&name=${encodeURIComponent(p.title)}`}
                    className="flex flex-1 items-center justify-center gap-1 rounded-lg bg-panel-accent py-2 text-sm font-medium text-white hover:bg-panel-accent-hover"
                  >
                    Use in Server
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
        {!loading && modpacks.length === 0 && (
          <div className="py-16 text-center text-panel-muted">
            No modpacks found. Try a different search.
          </div>
        )}
      </div>
    </div>
  );
}
