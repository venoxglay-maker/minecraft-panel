# LaxPanel – Minecraft Server Manager

Modernes Minecraft-Server-Management-Panel (dunkles Theme, braune Akzente).

## Features

- **Dashboard**: Metriken (Server, Spieler, RAM, TPS), Server-Übersicht, Recent Activity, System Health
- **Servers**: Liste & Detail mit Tabs (Overview, Console, Config, Mods, **Files**, Routing)
- **Modpacks**: Suche über **Modrinth API**, Karten-Layout, „Use in Server“
- **Datei-Editor**: `server.properties` (und andere Dateien) anzeigen & bearbeiten, Speichern per API
- **Settings**: Routing (Proxy, Base Domain, Listeners), Server Defaults, Authentication

## Tech Stack

- **Next.js 14** (App Router), **React 18**, **TypeScript**, **Tailwind CSS**
- **Modrinth API** (`/api/modrinth/search`) für Modpack-Suche
- **API** `/api/servers/[slug]/files` (GET/PUT) für Datei-Lesen/Schreiben

## Start

```bash
npm install
npm run dev
```

Panel: [http://localhost:3000](http://localhost:3000)

## Routen

| Route | Beschreibung |
|-------|--------------|
| `/` | Dashboard |
| `/servers` | Server-Liste |
| `/servers/[slug]` | Server-Detail (Overview) |
| `/servers/[slug]/console` | Live-Konsole |
| `/servers/[slug]/files` | Datei-Editor (z. B. server.properties) |
| `/modpacks` | Modpacks (Modrinth) |
| `/settings` | Einstellungen (Routing, etc.) |
| `/users` | Benutzer |

## Design

- Dunkles Theme (`#0f0f0f`, `#1a1a1a`), Akzentfarbe Braun/Amber (`#8b6914`)
- Design angelehnt an moderne Panel-UI

## Weißer Bildschirm / 404 für main.js, _app.js, react-refresh.js

Wenn nur ein weißer Bildschirm erscheint und in der Konsole 404 für `main.js`, `_app.js`, `_error.js` oder `react-refresh.js`:

1. **Build-Cache löschen und neu starten**
   ```bash
   npm run clean
   npm run dev
   ```
2. **Seite im Browser:** Strg+Shift+R (Hard Reload) oder **inkognito** öffnen und [http://localhost:3000](http://localhost:3000) aufrufen.
3. **Production:** Nach Änderungen immer erst neu bauen, dann starten:
   ```bash
   npm run clean:build
   npm run start
   ```
