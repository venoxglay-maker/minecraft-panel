#!/usr/bin/env bash
set -euo pipefail

echo ">>> DiscoPanel Installer"

if [[ $EUID -ne 0 ]]; then
  echo "Bitte als root ausführen."
  exit 1
fi

apt update
apt install -y ca-certificates curl gnupg lsb-release ufw

if ! command -v docker >/dev/null 2>&1; then
  echo ">>> Installiere Docker..."
  curl -fsSL https://get.docker.com | sh
fi

if ! command -v docker compose >/dev/null 2>&1; then
  echo ">>> Installiere docker-compose-plugin..."
  mkdir -p /usr/lib/docker/cli-plugins
  curl -SL https://github.com/docker/compose/releases/download/v2.29.2/docker-compose-linux-x86_64 -o /usr/lib/docker/cli-plugins/docker-compose
  chmod +x /usr/lib/docker/cli-plugins/docker-compose
fi

echo ">>> Konfiguriere Firewall..."
ufw allow 22/tcp || true
ufw allow 80/tcp || true
ufw allow 443/tcp || true
ufw allow 8080/tcp || true
ufw allow 25565:25665/tcp || true

echo "y" | ufw enable || true

echo ">>> Starte Docker-Stack..."
docker compose pull || true
docker compose up -d

echo ">>> Richte Systemd-Service ein..."
SERVICE_FILE=/etc/systemd/system/discopanel.service
cat >"$SERVICE_FILE" <<EOF
[Unit]
Description=DiscoPanel Minecraft Management Stack
After=docker.service
Requires=docker.service

[Service]
Type=oneshot
WorkingDirectory=$(pwd)
ExecStart=/usr/bin/docker compose up -d
ExecStop=/usr/bin/docker compose down
RemainAfterExit=yes

[Install]
WantedBy=multi-user.target
EOF

systemctl daemon-reload
systemctl enable discopanel.service

echo ">>> DiscoPanel ist gestartet."
echo "Frontend: http://<dein-server>:3000"
echo "API:      http://<dein-server>:8080"

