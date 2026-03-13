# LaxPanel – Deployment auf dem Server

## Welches Betriebssystem?

**Empfehlung für den Server:**

- **Nur Panel (empfohlen):** **Ubuntu 22.04 (Jammy) 64-bit** oder **Debian 12 (Bookworm) 64-bit** – Standard **ohne** vorinstalliertes Java.  
  Das Panel läuft mit Node.js, Java brauchst du dafür nicht.

- **Panel + echte Minecraft-Server auf demselben Rechner:**  
  **Ubuntu 22.04** oder **Debian 11/12** mit **Java 17** – das Panel startet echte Minecraft-Server-Prozesse. Java installieren:
  ```bash
  sudo apt update && sudo apt install -y openjdk-17-jdk
  ```
  Optional `JAVA_HOME` setzen (z. B. in `.env.local`): `JAVA_HOME=/usr/lib/jvm/java-17-openjdk-amd64`

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

7. **Panel starten (hört auf alle IPs, nicht nur localhost)**
   ```bash
   npm run start
   ```
   Falls es nur unter localhost erreichbar ist, explizit so starten:
   ```bash
   HOSTNAME=0.0.0.0 npx next start -p 3000
   ```
   Im Browser von außen: **http://DEINE-SERVER-IP:3000** (nicht localhost).

8. **Erster Aufruf**
   - Im Browser die Server-IP bzw. Domain aufrufen (z. B. `http://dein-server:3000`).
   - Beim ersten Mal erscheint die **Einrichtung**: Admin-Benutzername und Passwort anlegen.
   - Danach mit diesen Daten **anmelden**.

   **Minecraft-Server (echt):** Beim Anlegen eines Servers lädt das Panel das Server-JAR von Mojang herunter und legt das Verzeichnis unter `data/servers/<slug>/` an. Start/Stop/Konsole und Dateien beziehen sich auf diesen echten Prozess. Dafür muss **Java** auf dem Rechner installiert sein (siehe oben).

9. **Firewall (falls Port 3000 nicht erreichbar)**
   ```bash
   sudo ufw allow 3000/tcp
   sudo ufw reload
   ```

10. **Daten-Persistenz**  
   Server und Benutzer werden unter `./data/` gespeichert:
   - `data/servers.json` – angelegte Minecraft-Server
   - `data/users.json` – Benutzer und Admin
   - `data/settings.json` – Einstellungen (Routing, Basis-Domain)
   - `data/activity.json` – Letzte Aktivitäten
   - `data/servers/<slug>/` – Verzeichnis pro Minecraft-Server (JAR, Welten, mods, …)  
   Diesen Ordner für Backups sichern und nicht löschen.

---

## Neue Version auf den Server bringen (Update)

Wenn du den Code auf deinem PC änderst und die neue Version auf dem Server nutzen willst:

### 1. Auf dem PC: Änderungen pushen

```bash
cd C:\Users\venox\Desktop\minecraft_panel
git add .
git commit -m "Neue Version"
git push origin main
```

### 2. Auf dem Server: Projekt aktualisieren und neu starten

Per SSH einloggen und ins Projektverzeichnis wechseln (Pfad anpassen, z. B. `~/minecraft-panel` oder `/opt/laxpanel`):

```bash
ssh root@DEINE-SERVER-IP
cd ~/minecraft-panel
```

Dann:

```bash
# Neuesten Code holen
git pull origin main

# Abhängigkeiten aktualisieren (falls sich package.json geändert hat)
npm install

# Alten Build löschen und neu bauen (wichtig!)
rm -rf .next
npm run build
```

**Panel neu starten:**

- **Ohne systemd** (läuft im Terminal):
  - Strg+C zum Stoppen, dann:
  ```bash
  npm run start
  ```

- **Mit systemd:**
  ```bash
  sudo systemctl restart laxpanel
  sudo systemctl status laxpanel
  ```

### Kurz-Checkliste (Copy & Paste)

```bash
cd ~/minecraft-panel
git pull origin main
npm install
rm -rf .next
npm run build
sudo systemctl restart laxpanel
```

(Den letzten Befehl weglassen, wenn du das Panel nicht als systemd-Service laufen hast – dann per Hand `npm run start` ausführen.)

**Hinweis:** Beim Update bleibt der Ordner `data/` unverändert. Deine Server, Benutzer und Einstellungen bleiben erhalten.

---

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
ExecStart=/usr/bin/node node_modules/next/dist/bin/next start --hostname 0.0.0.0 --port 3000
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

Das Panel erstellt und steuert **echte** Minecraft-Server-Prozesse (Start/Stop über Java, Konsole, Dateien, Mods, Welten). Dafür muss auf dem Host **Java** installiert sein (siehe oben). Die Daten liegen unter `data/`.
