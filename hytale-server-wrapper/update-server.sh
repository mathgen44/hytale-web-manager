#!/bin/bash
set -e

echo "[UPDATE] 🔄 Vérification des mises à jour Hytale..."

cd /data

# Vérifier si hytale-downloader existe
if [ ! -f "/usr/local/bin/hytale-downloader" ]; then
    echo "[UPDATE] ⬇️  hytale-downloader non trouvé, téléchargement..."
    curl -L -o /usr/local/bin/hytale-downloader \
        https://download.hytale.com/launcher/hytale-downloader-linux-amd64
    chmod +x /usr/local/bin/hytale-downloader
    echo "[UPDATE] ✅ hytale-downloader installé"
fi

# Afficher la version actuelle
CURRENT_VERSION=$(ls -t *.zip 2>/dev/null | head -1 | sed 's/.zip//' || echo "unknown")
echo "[UPDATE] 📦 Version actuelle: $CURRENT_VERSION"

# Vérifier la version disponible
AVAILABLE_VERSION=$(/usr/local/bin/hytale-downloader -print-version 2>&1 | grep -oP '\d{4}\.\d{2}\.\d{2}-[a-f0-9]+' | head -1 || echo "unknown")
echo "[UPDATE] 🌐 Version disponible: $AVAILABLE_VERSION"

if [ "$CURRENT_VERSION" = "$AVAILABLE_VERSION" ]; then
    echo "[UPDATE] ✅ Serveur déjà à jour (version $CURRENT_VERSION)"
    exit 0
fi

echo "[UPDATE] 🆕 Nouvelle version disponible: $AVAILABLE_VERSION"
echo "[UPDATE] 🛑 Arrêt du serveur..."

# Arrêter proprement le serveur
echo "stop" > /tmp/server-control
sleep 10

# Télécharger la mise à jour
echo "[UPDATE] ⬇️  Téléchargement de la mise à jour..."
/usr/local/bin/hytale-downloader

if [ $? -eq 0 ]; then
    echo "[UPDATE] ✅ Téléchargement réussi"
    
    # Extraire l'archive
    NEW_ARCHIVE=$(ls -t *.zip | head -1)
    if [ -f "$NEW_ARCHIVE" ]; then
        echo "[UPDATE] 📦 Extraction de $NEW_ARCHIVE..."
        unzip -o "$NEW_ARCHIVE" -d /data
        echo "[UPDATE] ✅ Extraction terminée"
    fi
    
    # Redémarrer le serveur
    echo "[UPDATE] 🚀 Redémarrage du serveur..."
    echo "start" > /tmp/server-control
    sleep 5
    
    echo "[UPDATE] ✅ Mise à jour terminée avec succès !"
    echo "[UPDATE] 📦 Nouvelle version: $AVAILABLE_VERSION"
else
    echo "[UPDATE] ❌ Échec du téléchargement"
    echo "[UPDATE] 🚀 Redémarrage du serveur avec l'ancienne version..."
    echo "start" > /tmp/server-control
    exit 1
fi