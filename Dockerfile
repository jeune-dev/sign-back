FROM node:22-slim

# ─────────────────────────────────────────────────────────────
# Dépendances système
# • PhantomJS (utilisé par html-pdf) → libfontconfig, libfreetype, etc.
# • Sharp (traitement images)        → libvips
# • Polices pour PDF                 → fonts-liberation
# ─────────────────────────────────────────────────────────────
RUN apt-get update && apt-get install -y --no-install-recommends \
    # PhantomJS / html-pdf
    libfontconfig1 \
    libfreetype6 \
    ca-certificates \
    fonts-liberation \
    fonts-dejavu-core \
    # Sharp / libvips
    libvips-dev \
    # Utilitaires
    wget \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copier les fichiers de dépendances en premier (cache Docker)
COPY package*.json ./

# Installer toutes les dépendances (y compris les binaires natifs compilés pour Linux)
RUN npm install --omit=dev

# Copier le code source
COPY . .

# ─────────────────────────────────────────────────────────────
# Sécurité : basculer vers l'utilisateur non-root "node"
# L'image officielle node:xx-slim inclut déjà l'utilisateur "node" (uid 1000)
# ─────────────────────────────────────────────────────────────
RUN chown -R node:node /app
USER node

EXPOSE 3000

CMD ["node", "src/server.js"]
