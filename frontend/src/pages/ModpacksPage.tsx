import React, { useState } from "react";
import axios from "axios";
import { Layout } from "../components/Layout";

type Modpack = {
  id: number;
  name: string;
  summary: string;
  logoUrl?: string;
  slug: string;
};

export const ModpacksPage: React.FC = () => {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Modpack[]>([]);
  const [loading, setLoading] = useState(false);

  const apiBase = `${window.location.protocol}//${window.location.host}`;

  const handleSearch = async () => {
    if (!query.trim()) return;
    setLoading(true);
    try {
      const token = localStorage.getItem("accessToken") || "";
      const res = await axios.get<{ results: Modpack[] }>(`${apiBase}/api/v1/modpacks/search`, {
        params: { provider: "curseforge", query },
        headers: { Authorization: `Bearer ${token}` }
      });
      setResults(res.data.results);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Modpacks</h1>
          <p className="text-sm text-slate-400">
            Browse and discover modpacks from CurseForge.
          </p>
        </div>
      </div>
      <div className="mb-4 flex gap-2">
        <input
          className="flex-1 bg-slate-900/70 rounded-lg px-3 py-2 text-sm border border-slate-800"
          placeholder="Search modpacks..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              handleSearch();
            }
          }}
        />
        <button
          className="px-3 py-2 rounded-lg bg-accent.green text-sm text-black"
          onClick={handleSearch}
        >
          {loading ? "Searching..." : "Search"}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {results.map((m) => (
          <div
            key={m.id}
            className="bg-bg.card rounded-xl border border-slate-800 p-4 flex flex-col gap-2"
          >
            <div className="flex items-center gap-3">
              {m.logoUrl && (
                <img
                  src={m.logoUrl}
                  alt={m.name}
                  className="h-10 w-10 rounded-md object-cover"
                />
              )}
              <div>
                <div className="text-sm font-semibold">{m.name}</div>
                <div className="text-[11px] text-slate-500 truncate">{m.slug}</div>
              </div>
            </div>
            <p className="text-xs text-slate-300 line-clamp-3">{m.summary}</p>
            <button className="mt-auto self-end px-3 py-1.5 rounded-lg bg-accent.blue text-xs text-black">
              Install to server (coming soon)
            </button>
          </div>
        ))}
      </div>
    </Layout>
  );
};

