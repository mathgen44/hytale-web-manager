#!/bin/bash
set -e

# Script de mise à jour automatique du serveur Hytale
# Utilise hytale-downloader avec OAuth device flow

# Configuration
DOWNLOADER_URL="https://downloader.hytale.com/hytale-downloader.zip"
DOWNLOADER_BIN="/usr/local/bin/hytale-downloader"
DATA_DIR="/data"
LOG_FILE="/tmp/downloader-output.log"
OAUTH_FILE="/tmp/oauth-shared/oauth-url.txt"

# Couleurs pour les logs
log_info() {
    echo "[UPDATE] 🔄 $1"
}

log_success() {
    echo "[UPDATE] ✅ $1"
}

log_error() {
    echo "[UPDATE] ❌ $1"
}

log_warn() {
    echo "[UPDATE] ⚠️  $1"
}

cd "$DATA_DIR"

# ========================================
# Étape 1 : Installer hytale-downloader si nécessaire
# ========================================
if [ ! -f "$DOWNLOADER_BIN" ]; then
    log_info "hytale-downloader non trouvé, téléchargement..."
    
    # Télécharger le ZIP
    if ! curl -L -o /tmp/hytale-downloader.zip "$DOWNLOADER_URL"; then
        log_error "Échec du téléchargement de hytale-downloader"
        exit 1
    fi
    
    # Décompresser
    log_info "Extraction du downloader..."
    mkdir -p /tmp/hytale-downloader
    if ! unzip -o /tmp/hytale-downloader.zip -d /tmp/hytale-downloader/; then
        log_error "Échec de l'extraction du ZIP"
        exit 1
    fi
    
    # Identifier le binaire Linux
    LINUX_BIN=""
    for possible_name in hytale-downloader-linux-amd64 hytale-downloader-linux hytale-downloader; do
        if [ -f "/tmp/hytale-downloader/$possible_name" ]; then
            LINUX_BIN="/tmp/hytale-downloader/$possible_name"
            break
        fi
    done
    
    if [ -z "$LINUX_BIN" ]; then
        log_error "Binaire Linux non trouvé dans le ZIP"
        log_info "Contenu du ZIP:"
        ls -la /tmp/hytale-downloader/
        exit 1
    fi
    
    # Copier et rendre exécutable
    cp "$LINUX_BIN" "$DOWNLOADER_BIN"
    chmod +x "$DOWNLOADER_BIN"
    
    # Nettoyer
    rm -rf /tmp/hytale-downloader.zip /tmp/hytale-downloader/
    
    log_success "hytale-downloader installé"
fi

# ========================================
# Étape 2 : Vérifier la version actuelle
# ========================================
log_info "Vérification de la version actuelle..."

# Version actuelle (depuis les fichiers téléchargés)
CURRENT_VERSION=$(ls -t "$DATA_DIR"/*.zip 2>/dev/null | grep -v "hytale-downloader" | grep -v "Assets" | head -1 | xargs basename 2>/dev/null | sed 's/.zip//' || echo "unknown")
log_info "📦 Version actuelle: $CURRENT_VERSION"

# Note: -print-version nécessite OAuth, donc on lance directement la mise à jour
# Le downloader vérifiera lui-même si une mise à jour est disponible
log_info "🔄 Lancement de la mise à jour (le downloader vérifiera automatiquement)..."

# ========================================
# Étape 3 : Arrêter le serveur
# ========================================
log_info "🛑 Arrêt du serveur..."
echo "stop" > /tmp/server-control
sleep 10

# Vérifier que le serveur est bien arrêté
if [ -f "/tmp/hytale-server.pid" ]; then
    PID=$(cat /tmp/hytale-server.pid)
    if kill -0 "$PID" 2>/dev/null; then
        log_warn "Le serveur ne s'est pas arrêté proprement, arrêt forcé..."
        kill -9 "$PID" 2>/dev/null || true
        sleep 3
    fi
fi

log_success "Serveur arrêté"

# ========================================
# Étape 4 : Télécharger la mise à jour
# ========================================
log_info "⬇️  Téléchargement de la mise à jour..."

# Nettoyer les fichiers temporaires
rm -f "$LOG_FILE" "$OAUTH_FILE"

# Lancer le téléchargement en arrière-plan et capturer la sortie
"$DOWNLOADER_BIN" 2>&1 | tee "$LOG_FILE" &
DOWNLOADER_PID=$!

# Surveiller les logs pour détecter l'URL OAuth
log_info "🔍 Surveillance des logs pour OAuth..."
OAUTH_DETECTED=false
OAUTH_TIMEOUT=900  # 15 minutes max

for i in $(seq 1 $OAUTH_TIMEOUT); do
    # Vérifier si le processus est toujours en cours
    if ! kill -0 "$DOWNLOADER_PID" 2>/dev/null; then
        log_info "Processus downloader terminé"
        break
    fi
    
    # Chercher l'URL OAuth dans les logs
    if [ "$OAUTH_DETECTED" = false ]; then
        OAUTH_URL=$(grep -o 'https://oauth.accounts.hytale.com/oauth2/device/verify?user_code=[A-Za-z0-9]*' "$LOG_FILE" 2>/dev/null | head -1 || true)
        
        if [ ! -z "$OAUTH_URL" ]; then
            OAUTH_DETECTED=true
            log_success "🔐 URL OAuth détectée"
            log_info "🔗 $OAUTH_URL"
            
            # Écrire l'URL dans un fichier pour que le backend la récupère
            echo "$OAUTH_URL" > "$OAUTH_FILE"
			
			# S'assurer que le fichier est lisible
            chmod 644 "$OAUTH_FILE"
            
            log_info "⏳ En attente de l'authentification (expires dans 15 minutes)..."
        fi
    fi
    
    # Vérifier si l'authentification est complète
    if grep -q "Authentication successful\|Download complete" "$LOG_FILE" 2>/dev/null; then
        if [ "$OAUTH_DETECTED" = true ]; then
            log_success "✅ Authentification réussie"
			# Nettoyer le fichier OAuth
            rm -f "$OAUTH_FILE"
        fi
        log_info "Téléchargement en cours..."
        break
    fi
    
    sleep 1
done

# Attendre la fin du téléchargement
wait "$DOWNLOADER_PID"
DOWNLOAD_EXIT_CODE=$?

# Nettoyer le fichier OAuth
rm -f "$OAUTH_FILE"

# Vérifier le résultat
if [ $DOWNLOAD_EXIT_CODE -ne 0 ]; then
    log_error "Échec du téléchargement (code: $DOWNLOAD_EXIT_CODE)"
    log_info "Logs du downloader:"
    tail -20 "$LOG_FILE"
	
	# Nettoyer le fichier OAuth en cas d'erreur
    rm -f "$OAUTH_FILE"
    
    log_info "🚀 Redémarrage du serveur avec l'ancienne version..."
    echo "start" > /tmp/server-control
    exit 1
fi

log_success "Téléchargement réussi"

# ========================================
# Étape 5 : Extraire et installer la mise à jour
# ========================================
# Trouver l'archive téléchargée (la plus récente, hors hytale-downloader.zip)
NEW_ARCHIVE=$(ls -t "$DATA_DIR"/*.zip 2>/dev/null | grep -v "hytale-downloader" | grep -v "Assets" | head -1 || true)

if [ -z "$NEW_ARCHIVE" ] || [ ! -f "$NEW_ARCHIVE" ]; then
    log_error "Archive de mise à jour introuvable"
    log_info "Fichiers présents dans $DATA_DIR:"
    ls -la "$DATA_DIR"/*.zip 2>/dev/null || echo "Aucun fichier .zip trouvé"
    
    log_info "🚀 Redémarrage du serveur avec l'ancienne version..."
    echo "start" > /tmp/server-control
    exit 1
fi

log_info "📦 Extraction de $(basename "$NEW_ARCHIVE")..."

# Backup de l'ancien serveur (optionnel)
if [ -d "$DATA_DIR/Server" ]; then
    log_info "💾 Backup de l'ancienne version..."
    mv "$DATA_DIR/Server" "$DATA_DIR/Server.backup.$(date +%Y%m%d_%H%M%S)" 2>/dev/null || true
fi

# Extraire la nouvelle version
if ! unzip -o "$NEW_ARCHIVE" -d "$DATA_DIR"; then
    log_error "Échec de l'extraction"
    
    # Restaurer le backup si disponible
    if [ -d "$DATA_DIR/Server.backup."* ]; then
        log_warn "Restauration du backup..."
        LATEST_BACKUP=$(ls -td "$DATA_DIR/Server.backup."* | head -1)
        mv "$LATEST_BACKUP" "$DATA_DIR/Server"
    fi
    
    log_info "🚀 Redémarrage du serveur avec l'ancienne version..."
    echo "start" > /tmp/server-control
    exit 1
fi

log_success "Extraction terminée"

# Vérifier que les fichiers essentiels sont présents
if [ ! -f "$DATA_DIR/HytaleServer.jar" ] && [ ! -f "$DATA_DIR/Server/HytaleServer.jar" ]; then
    log_error "HytaleServer.jar introuvable après extraction"
    log_info "Structure après extraction:"
    find "$DATA_DIR" -maxdepth 2 -type f -name "*.jar" 2>/dev/null || echo "Aucun .jar trouvé"
fi

# Si les fichiers sont dans un sous-dossier Server/, les déplacer
if [ -d "$DATA_DIR/Server" ] && [ -f "$DATA_DIR/Server/HytaleServer.jar" ]; then
    log_info "Déplacement des fichiers serveur..."
    cp -r "$DATA_DIR/Server"/* "$DATA_DIR/" 2>/dev/null || true
fi

# ========================================
# Étape 6 : Redémarrer le serveur
# ========================================
log_info "🚀 Redémarrage du serveur..."
echo "start" > /tmp/server-control

# Attendre le démarrage
sleep 5

# Vérifier que le serveur a démarré
if [ -f "/tmp/hytale-server.pid" ]; then
    PID=$(cat /tmp/hytale-server.pid)
    if kill -0 "$PID" 2>/dev/null; then
        log_success "Serveur redémarré (PID: $PID)"
    else
        log_warn "Le serveur ne semble pas démarré correctement"
    fi
else
    log_warn "Fichier PID introuvable, vérifiez les logs du serveur"
fi

# ========================================
# Résumé final
# ========================================
log_success "✨ Mise à jour terminée avec succès !"
log_info "📦 Ancienne version: $CURRENT_VERSION"
log_info "📦 Nouvelle version: $AVAILABLE_VERSION"
log_info "🔍 Consultez les logs du serveur pour vérifier le démarrage"

exit 0
