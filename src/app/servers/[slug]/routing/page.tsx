export default function ServerRoutingPage() {
  return (
    <div className="p-8">
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-white">Routing</h2>
        <p className="text-sm text-panel-muted">Proxy-Routing und eigene Hostnamen für diesen Server. Einstellungen unter Einstellungen → Routing.</p>
      </div>
      <div className="rounded-xl border border-panel-border bg-panel-card p-6 text-panel-muted text-sm">
        Hier siehst du später die aktive Route (z. B. <span className="font-mono text-white">server.play.example.com</span>). Anlegen und verwalten unter <strong className="text-white">Settings → Routing</strong>.
      </div>
    </div>
  );
}
