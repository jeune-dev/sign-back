#!/usr/bin/env bash
# ============================================================
#  Sign API — Setup initial sur VPS Contabo Ubuntu 22.04/24.04
#  Usage : bash deploy/setup-server.sh
#  A lancer UNE SEULE FOIS en root (ou sudo) après le 1er login
# ============================================================
set -euo pipefail

APP_USER="nodeapp"
APP_DIR="/var/www/sign-api"
NODE_VERSION="22"
DOMAIN="YOUR_DOMAIN"   # passer via : DOMAIN=api.signapp.com bash setup-server.sh

echo "==> [1/9] Mise à jour des paquets"
apt-get update -qq && apt-get upgrade -y -qq

echo "==> [2/9] Installation des dépendances système"
apt-get install -y -qq     curl wget git ufw     nginx certbot python3-certbot-nginx     postgresql postgresql-contrib     libfontconfig1 libfreetype6 fonts-liberation fonts-dejavu-core     libvips-dev ca-certificates

echo "==> [3/9] Installation Node.js  via NodeSource"
curl -fsSL https://deb.nodesource.com/setup_.x | bash -
apt-get install -y -qq nodejs

echo "==> [4/9] Installation PM2 globalement"
npm install -g pm2

echo "==> [5/9] Création de l'utilisateur applicatif ()"
id "\" &>/dev/null || useradd -m -s /bin/bash "\"

echo "==> [6/9] Création de l'arborescence de l'application"
mkdir -p "\"
mkdir -p "/logs"
chown -R ":\" "\"

echo "==> [7/9] Configuration du pare-feu (UFW)"
ufw --force reset
ufw default deny incoming
ufw default allow outgoing
ufw allow ssh
ufw allow 80/tcp
ufw allow 443/tcp
ufw --force enable

echo "==> [8/9] Configuration Nginx"
cp deploy/nginx.conf /etc/nginx/sites-available/sign-api
ln -sf /etc/nginx/sites-available/sign-api /etc/nginx/sites-enabled/sign-api
rm -f /etc/nginx/sites-enabled/default
sed -i "s/YOUR_DOMAIN//g" /etc/nginx/sites-available/sign-api
nginx -t && systemctl reload nginx

echo "==> [9/9] Obtention du certificat SSL via Certbot"
certbot --nginx -d "\" --non-interactive --agree-tos --email admin@"\" --redirect

echo ""
echo "============================================"
echo " Setup terminé !"
echo " 1. Cloner le repo dans "
echo " 2. Copier .env depuis .env.example et remplir toutes les valeurs"
echo " 3. cd  && npm install --omit=dev"
echo " 4. npm run pm2:start"
echo " 5. pm2 save && pm2 startup (suivre les instructions)"
echo "============================================"
