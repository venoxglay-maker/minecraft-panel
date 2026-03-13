'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Globe, Zap } from 'lucide-react';

export default function ServerRoutingPage() {
  const params = useParams();
  const slug = params?.slug as string;
  const [settings, setSettings] = useState<{ baseDomain?: string; proxyEnabled?: boolean; activeRoutes?: Record<string, string> } | null>(null);

  useEffect(() => {
    fetch('/api/settings', { credentials: 'include' })
      .then((r) => r.ok ? r.json() : null)
      .then(setSettings)
      .catch(() => setSettings(null));
  }, []);

  const baseDomain = settings?.baseDomain ?? 'play.laxpanel.app';
  const activeRoutes = settings?.activeRoutes ?? {};
  const hostname = activeRoutes[slug] ?? (slug ? `${slug}.${baseDomain}` : null);

  return (
    <div className="p-8">
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-white">Routing</h2>
        <p className="text-sm text-panel-muted">
          Proxy-Routing und Hostname für diesen Server. Basis-Domain und Listeners unter Einstellungen → Routing.
        </p>
      </div>

      <div className="rounded-xl border border-panel-border bg-panel-card p-6">
        <div className="flex items-center gap-2 text-panel-muted">
          <Globe className="h-5 w-5" />
          <span className="text-sm font-medium uppercase tracking-wider">Basis-Domain</span>
        </div>
        <p className="mt-2 font-mono text-white">{baseDomain}</p>
        <p className="mt-1 text-xs text-panel-muted">Aus Einstellungen → Routing</p>

        <div className="mt-6 flex items-center gap-2 text-panel-muted">
          <Zap className="h-5 w-5 text-panel-green" />
          <span className="text-sm font-medium uppercase tracking-wider">Aktive Route (dieser Server)</span>
        </div>
        {hostname ? (
          <p className="mt-2 font-mono text-white">{hostname}</p>
        ) : (
          <p className="mt-2 text-sm text-panel-muted">Standard: &lt;Server-Slug&gt;.{baseDomain}</p>
        )}
        <p className="mt-1 text-xs text-panel-muted">
          Spieler verbinden sich mit dieser Adresse (wenn Proxy aktiv) oder mit Host:Port aus dem Overview-Tab.
        </p>
      </div>
    </div>
  );
}
