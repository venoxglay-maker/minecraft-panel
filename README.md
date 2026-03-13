## DiscoPanel – Minecraft Server Management Panel

DiscoPanel ist ein selbstgehostetes Panel zur Verwaltung von Minecraft-Server-Infrastruktur.  
Es kombiniert Features von Pterodactyl, AMP, Multicraft und Crafty und bietet eine moderne UI mit Fokus auf Modpacks, Monitoring und Multi-Server-Management.

### Features (Stand: MVP)

- Backend-API (Node.js + Express, TypeScript, PostgreSQL, Redis)
- Authentifizierung mit JWT Access + Refresh Tokens (Sessions in der DB)
- Server-API:
  - Server anlegen (inkl. Docker-Provisionierung pro Server-Container)
  - Server-Liste, Power-Actions (start/stop/restart/kill)
- Datei-API:
  - Directory-Listing, Datei lesen/schreiben
  - Verzeichnisse anlegen, Umbenennen, Löschen
  - Upload (Multipart), ZIP-Archive erstellen und entpacken
- Dashboard-API:
  - Summary (Total Servers, Running Servers, Players Online)
- WebSockets:
  - Live-Konsole & CPU/RAM-Metriken pro Server (`/ws/server/:id`)
- Frontend (React + Vite + TailwindCSS) mit:
  - Dashboard-Screen im Stil der Mockups (mit echten Kennzahlen)
  - Server-Detailseite mit Live-Konsole, Performance-Karten & Datei-Explorer
  - Modpack-Browse-Seite (CurseForge-Suche)
  - einfache User-Übersicht (Admin-only)
- Docker-basierter Stack (API, Frontend, PostgreSQL, Redis, Minecraft-Server-Volumes)

### Schnellstart (Entwicklung)

1. **Abhängigkeiten installieren**

```bash
cd backend
npm install
cd ../frontend
npm install
```

2. **Docker-Services starten (DB + Redis)**

```bash
docker compose up -d postgres redis
```

3. **Backend entwickeln**

```bash
cd backend
cp .env.example .env
npm run dev
```

4. **Frontend entwickeln**

```bash
cd frontend
npm run dev
```

Das Frontend läuft auf `http://localhost:3000`, die API auf `http://localhost:8080`.

### Produktion mit Docker Compose

```bash
docker compose build
docker compose up -d
```

### Installation auf Ubuntu 22.04 (Root-Server)

```bash
git clone https://github.com/dein-user/discopanel.git
cd discopanel
chmod +x install.sh
sudo ./install.sh
```

Der Installer:

- installiert Docker + docker-compose-plugin (falls nötig)
- richtet UFW-Firewall-Regeln ein (22, 80, 443, 8080, 25565–25665)
- startet den Docker-Stack via `docker compose up -d`
- richtet einen Systemd-Service `discopanel.service` ein (Autostart beim Boot)

Frontend ist anschließend unter `http://<dein-server>:3000` erreichbar, die API unter `http://<dein-server>:8080`.

### Entwicklung & Tests

- Entwicklung siehe Abschnitt „Schnellstart (Entwicklung)“.
- Basis-Tests können mit Node.js Test Runner ergänzt werden (z. B. für Auth- und Server-Routen); ein vollständiger Test-Suite-Aufbau ist vorgesehen, aber noch nicht abgeschlossen.

Weitere Details zur Architektur findest du in `ARCHITECTURE.md`.

