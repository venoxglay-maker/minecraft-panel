export default function ServerConfigPage() {
  return (
    <div className="p-8">
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-white">Config</h2>
        <p className="text-sm text-panel-muted">Server-Konfiguration (z. B. server.properties) bearbeitest du unter dem Tab „Files“ in der Dateistruktur.</p>
      </div>
      <div className="rounded-xl border border-panel-border bg-panel-card p-6 text-panel-muted text-sm">
        Konfigurationsdateien findest du unter <strong className="text-white">Files</strong> – dort eine Datei auswählen und im Fenster bearbeiten.
      </div>
    </div>
  );
}
