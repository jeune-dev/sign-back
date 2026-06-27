#!/usr/bin/env bash
# ============================================================
#  Sign API — Déploiement d'une mise à jour (zero-downtime)
#  Usage : bash deploy/deploy.sh
#  A lancer depuis le répertoire racine du projet sur le VPS
# ============================================================
set -euo pipefail

APP_DIR="/c/Users/vPro/Desktop/apk_sign/backend-app"
LOG_DIR="/logs"

echo "[deploy] Répertoire : "

# 1. Créer le dossier logs si absent (ex : premier déploiement)
mkdir -p "\"

# 2. Installer les dépendances de production
echo "[deploy] npm install..."
npm install --omit=dev --prefer-offline

# 3. Vérifier que le .env est présent
if [ ! -f "/.env" ]; then
  echo "[deploy] ERREUR : fichier .env manquant dans "
  exit 1
fi

# 4. Reload PM2 (zero-downtime en mode cluster)
echo "[deploy] pm2 reload..."
pm2 reload ecosystem.config.js --env production --update-env

echo "[deploy] Déploiement terminé — Sat Jun 27 16:52:40     2026"
pm2 status sign-api
