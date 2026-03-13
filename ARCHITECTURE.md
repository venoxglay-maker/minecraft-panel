## Gesamtarchitektur – Minecraft Panel (Codename: DiscoPanel)

### 1. High-Level-Architektur

- **Frontend**: Next.js (React, TypeScript) + TailwindCSS, spricht ausschließlich mit dem Backend (REST + WebSockets).
- **Backend API**: Node.js (TypeScript, Express/Fastify-Style) mit Socket.io für Echtzeit-Funktionen.
- **Worker / Daemon**: Teil des Backends, kümmert sich asynchron um lange Tasks (Server-Deploy, Backups, Modpack-Installationen) per Job-Queue.
- **Datenbank**: PostgreSQL für Strukturdaten (User, Server, Nodes, Modpacks, Schedules, Metriken-Aggregate).
- **Cache & Realtime-State**: Redis für Sessions, Rate-Limits, Queue, kurzlebige Server-Metriken und WebSocket-Pub/Sub.
- **Minecraft-Server-Isolation**: Docker-Container (pro Minecraft-Server ein Container) mit vordefinierten Images für Vanilla/Paper/Forge/Fabric/etc.
- **Reverse Proxy**: Nginx (oder Traefik) vor dem Panel (HTTPS, Let’s Encrypt, Routing).
- **Monitoring & Logs**: Zentralisiertes Logging (Dateien + optional Loki/ELK), Health-Checks und Prometheus-kompatible Metriken.

Grobe Komponentensicht:

```mermaid
flowchart LR
    UserBrowser --> Frontend
    Frontend --> API[Backend API (REST)]
    Frontend --> WS[Backend WebSockets]
    API --> DB[(PostgreSQL)]
    API --> Cache[(Redis)]
    API --> Docker[Docker Engine]
    API --> Files[/Server-Dateisysteme/]
    WS --> Cache
    Docker --> MC1[(MC-Server-Container...)]
```

### 2. Node-/Server-Modell

- **Nodes** (zukünftig mehrere Root-Server):
  - `id`, `name`, `description`
  - `address`, `ssh_config?`, `docker_endpoint`
  - `total_ram`, `total_cpu_cores`, `total_storage`
  - `status` (online/offline/maintenance)
- **Servers**:
  - `id`, `node_id`, `owner_user_id`
  - `name`, `slug`, `description`, `icon_path`
  - `type` (vanilla, paper, spigot, forge, fabric, mohist, magma, …)
  - `minecraft_version`, `java_version`
  - `ram_mb`, `cpu_limit`, `port`, `query_port`, `rcon_port`
  - `world_profile_id` (vordefinierte Welt/Templates)
  - `modpack_id?`, `modpack_version?`
  - `install_state` (creating/installing/ready/error)
  - `power_state` (offline/starting/running/stopping/crashed)
  - `created_at`, `updated_at`
- **ServerRuntimeState** (kurzlebig in Redis, für Dashboard):
  - `online_players`, `max_players`
  - `tps`, `cpu_usage`, `ram_usage`, `disk_usage`, `network_in/out`

### 3. Datenbankschema (Auszug)

- **users**
  - `id`, `email`, `password_hash`, `display_name`
  - `role` (admin, owner, subuser)
  - `locale`, `two_factor_enabled`, `created_at`, `last_login_at`
- **user_sessions**
  - `id`, `user_id`, `refresh_token_hash`, `user_agent`, `ip`, `expires_at`
- **oauth_identities**
  - `id`, `user_id`, `provider` (discord/google/github), `provider_user_id`
- **servers**
  - wie oben beschrieben.
- **server_subusers**
  - `user_id`, `server_id`, `permissions` (Bitfeld/JSON: console, files, start/stop, mods, backups, settings).
- **nodes**
  - wie oben beschrieben.
- **server_backups**
  - `id`, `server_id`, `location`, `size_bytes`, `created_at`, `created_by`, `automatic` (bool), `status`.
- **server_events**
  - `id`, `server_id`, `type` (started/stopped/crashed/backup_created/command_executed/...),
  - `payload` (JSON), `created_at`.
- **metrics_server_timeseries**
  - `id`, `server_id`, `timestamp`,
  - `tps`, `cpu_percent`, `mem_used_mb`, `players_online`, `network_in_kbps`, `network_out_kbps`.
- **modpacks**
  - `id`, `source` (curseforge/modrinth/ftb/custom),
  - `external_id`, `name`, `description`, `logo_url`,
  - `supported_minecraft_versions` (JSON), `loader_type` (forge/fabric/vanilla).
- **modpack_versions**
  - `id`, `modpack_id`, `version`, `minecraft_version`, `files_manifest` (JSON), `changelog`.
- **scheduled_tasks**
  - `id`, `server_id`, `type` (backup/restart/command),
  - `cron_expression` ODER simpler Zeitplan,
  - `command?`, `enabled`, `last_run_at`, `next_run_at`.
- **api_tokens**, **audit_logs**, **routes/listeners** etc. können später ergänzt werden.

### 4. API-Design (REST)

Alle Routen beginnen mit `/api/v1`.

- **Auth**
  - `POST /auth/register`
  - `POST /auth/login`
  - `POST /auth/logout`
  - `POST /auth/refresh`
  - `POST /auth/2fa/enable`, `POST /auth/2fa/verify`
  - `GET /auth/me`
- **User & Rollen**
  - `GET /users/me`
  - `GET /users/:id`
  - `GET /users` (Admin)
  - `POST /users/:id/role`
- **Server**
  - `GET /servers` (inkl. Filter nach Owner/Subuser)
  - `POST /servers` (Server erstellen inkl. Type, Version, Java, RAM, Port, Modpack etc.)
  - `GET /servers/:id`
  - `PATCH /servers/:id` (Name, Beschreibung, MOTD, RAM, Limits, Icon)
  - `DELETE /servers/:id`
  - `POST /servers/:id/power` mit `action=start|stop|restart|kill`
  - `POST /servers/:id/clone`
  - `POST /servers/:id/backups` (Backup jetzt)
  - `GET /servers/:id/backups`
  - `POST /servers/:id/backups/:backupId/restore`
- **Console & Commands**
  - REST nur für Fallback:
    - `POST /servers/:id/commands` (Befehl senden)
  - Primär via WebSocket-Events (siehe unten).
- **Files**
  - `GET /servers/:id/files/list?path=/world`
  - `GET /servers/:id/files/content?path=/server.properties`
  - `PUT /servers/:id/files/content` (editieren)
  - `POST /servers/:id/files/upload`
  - `POST /servers/:id/files/create`
  - `POST /servers/:id/files/rename`
  - `POST /servers/:id/files/delete`
  - `POST /servers/:id/files/compress`
  - `POST /servers/:id/files/extract`
- **Modpacks & Mods**
  - `GET /modpacks/search?provider=curseforge&query=rlcraft`
  - `GET /modpacks/:id`
  - `POST /servers/:id/modpacks/install`
  - `POST /servers/:id/modpacks/update`
  - `GET /servers/:id/mods`
  - `POST /servers/:id/mods/install`
  - `POST /servers/:id/mods/remove`
- **Monitoring**
  - `GET /dashboard/summary` (Totals, aktive Spieler, avg TPS, CPU/RAM gesamt)
  - `GET /servers/:id/metrics/live`
  - `GET /servers/:id/metrics/history?range=24h`
  - `GET /metrics/export?format=csv|json`
- **Settings & Routing**
  - `GET /settings/general`, `PATCH /settings/general`
  - `GET /settings/routing`, `PATCH /settings/routing`
  - `GET /settings/proxy/listeners`, `POST /settings/proxy/listeners`, ...

### 5. WebSocket-Design (Socket.io-Namespace `/ws`)

Namensräume:

- `/ws/dashboard`
  - Events:
    - `dashboard:summary` – periodische Updates für Hauptkacheln.
    - `servers:overview` – Liste aller Server mit Status.
- `/ws/server/:id`
  - `console:output` – Stream der Server-Konsole (farbiger Text).
  - `console:input` – Client sendet Befehle.
  - `metrics:update` – Live-Metriken (TPS, CPU, RAM, Spieler).
  - `players:update` – Joins/Quits.
  - `status:update` – Power-/Installationsstatus.

Authentifizierung via JWT (Access-Token im `Authorization`-Header beim Handshake).

### 6. Sicherheitskonzept (Auszug)

- **Auth**
  - JWT Access + Refresh Tokens, Refresh in DB hinterlegt (Blacklist bei Logout).
  - Optional 2FA (TOTP).
- **Transport**
  - HTTPS via Nginx + Let’s Encrypt.
- **Input-Validierung**
  - Zod/Valibot/Yup-Schemas für alle Endpoints.
- **Rate-Limiting**
  - Pro IP & User (Redis-basiert).
- **Permissions**
  - Rollen (admin/owner/subuser) + feingranulare Server-Permissions.
- **Isolation**
  - Jeder Minecraft-Server in eigenem Docker-Container + eigenem Volume.
  - Nur notwendige Ports werden per Firewall geöffnet.

### 7. Deployment-Modell

- **Einfacher Root-Server (v1)**
  - Installationsskript installiert Docker, docker-compose, PostgreSQL, Redis + Panel-Stack via `docker compose up -d`.
  - Panel unter Port 8080 intern, via Nginx auf 80/443 exponiert.
  - Minecraft-Server laufen ebenfalls als Docker-Container auf dem gleichen Host.
- **Multi-Node (v2, später)**
  - Zentrales Panel verwaltet mehrere Worker-Nodes.
  - Kommunikation über gRPC/HTTPS-Agent auf jedem Node.

Diese Datei beschreibt die Architektur auf hoher Ebene. Die konkrete Implementierung im Code orientiert sich an diesen Strukturen, bleibt aber modular, sodass wir Features iterativ ausbauen können.

