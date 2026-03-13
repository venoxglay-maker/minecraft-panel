# LaxPanel – Deployment auf dem Server

## Welches Betriebssystem?

**Empfehlung für den Server:**

- **Nur Panel (empfohlen):** **Ubuntu 22.04 (Jammy) 64-bit** oder **Debian 12 (Bookworm) 64-bit** – Standard **ohne** vorinstalliertes Java.  
  Das Panel läuft mit Node.js, Java brauchst du dafür nicht.

- **Panel + später Minecraft auf demselben Rechner:**  
  **Ubuntu 22.04** oder **Debian 11/12** mit **Java 17 vorinstalliert** – dann ist Java schon da, wenn du Minecraft-Server-Prozesse auf dieser Maschine startest.

- **Alternativen:** Debian 11, Ubuntu 20.04 (beide 64-bit) funktionieren ebenfalls.  
  Windows Server oder CentOS sind möglich, die Anleitung unten ist aber für **Linux (Debian/Ubuntu)** geschrieben.

## Voraussetzungen

- Node.js 18+ (wird unten installiert)
- npm (kommt mit Node.js)

## Panel auf den Server ziehen – Schritte

1. **Per SSH auf den Server**
   ```bash
   ssh root@DEINE-SERVER-IP
   ```
   (oder dein Benutzername statt `root`)

2. **Node.js 20 installieren (unter Ubuntu/Debian)**
   ```bash
   curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
   sudo apt-get install -y nodejs
   ```
   Prüfen: `node -v` (sollte v20.x zeigen).

3. **Projekt auf den Server kopieren**
   - **Option A – Git:**  
     `git clone https://github.com/DEIN-REPO/minecraft_panel.git`  
     (oder dein Repo-Link), dann `cd minecraft_panel`
   - **Option B – Upload:**  
     Ordner per SFTP/SCP (z. B. FileZilla, WinSCP) nach z. B. `/opt/laxpanel` hochladen, dann `cd /opt/laxpanel`

4. **Abhängigkeiten installieren**
   ```bash
   npm install
   ```

5. **Produktions-Build (immer auf dem Server ausführen, nicht .next von woanders kopieren)**
   ```bash
   rm -rf .next
   npm run build
   ```
   Bei Fehlern wie `__webpack_modules__[moduleId] is not a function`: `.next` löschen und Build auf dem Server erneut ausführen.

6. **Session-Secret setzen (wichtig für Anmeldung)**  
   Im Projektordner:
   ```bash
   echo "SESSION_SECRET=$(openssl rand -hex 32)" > .env.local
   ```

7. **Panel starten**
   ```bash
   npm run start
   ```
   Das Panel hört auf **alle Schnittstellen** (0.0.0.0), Port **3000**. Im Browser von außen: `http://DEINE-SERVER-IP:3000` (nicht localhost).

8. **Erster Aufruf**
   - Im Browser die Server-IP bzw. Domain aufrufen (z. B. `http://dein-server:3000`).
   - Beim ersten Mal erscheint die **Einrichtung**: Admin-Benutzername und Passwort anlegen.
   - Danach mit diesen Daten **anmelden**.

9. **Firewall (falls Port 3000 nicht erreichbar)**
   ```bash
   sudo ufw allow 3000/tcp
   sudo ufw reload
   ```

10. **Daten-Persistenz**  
   Server und Benutzer werden unter `./data/` gespeichert:
   - `data/servers.json` – angelegte Minecraft-Server
   - `data/users.json` – Benutzer und Admin  
   Diesen Ordner für Backups sichern und nicht löschen.

## Als Systemdienst (systemd)

Beispiel-Unit `/etc/systemd/system/laxpanel.service` (Pfad anpassen):

```ini
[Unit]
Description=LaxPanel
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=/opt/laxpanel
ExecStart=/usr/bin/node node_modules/next/dist/bin/next start
Restart=on-failure
Environment=NODE_ENV=production
Environment=SESSION_SECRET=dein-token

[Install]
WantedBy=multi-user.target
```

Aktivieren und starten:
```bash
sudo systemctl daemon-reload
sudo systemctl enable laxpanel
sudo systemctl start laxpanel
sudo systemctl status laxpanel
```

## Reverse-Proxy (nginx)

Für HTTPS und Subdomain z. B.:

```nginx
server {
    listen 443 ssl;
    server_name panel.deine-domain.de;
    ssl_certificate /pfad/zu/fullchain.pem;
    ssl_certificate_key /pfad/zu/privkey.pem;
    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

## Hinweis

Das Panel speichert **nur die Konfiguration** der Minecraft-Server (Name, Version, Status usw.). Die eigentliche Erstellung und Steuerung von Minecraft-Server-Prozessen (Start/Stop/Neustart) muss später durch ein Backend (z. B. Docker, systemd) umgesetzt werden. Die Oberfläche und Logik dafür sind vorbereitet.
