#!/bin/bash

# Script de backup automatique du serveur Hytale
# Usage: ./backup.sh [destination]
# Exemple cron: 0 3 * * * /chemin/vers/backup.sh /backups

set -e

# Configuration
CONTAINER_NAME="${HYTALE_CONTAINER_NAME:-hytale-server}"
BACKUP_DIR="${1:-./backups}"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_NAME="hytale-backup-${TIMESTAMP}"
KEEP_DAYS="${KEEP_BACKUP_DAYS:-7}"

# Couleurs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Créer le dossier de backup
mkdir -p "$BACKUP_DIR"

log_info "🗄️  Démarrage du backup du serveur Hytale..."
log_info "Date: $(date)"
log_info "Destination: $BACKUP_DIR/$BACKUP_NAME"

# Vérifier que le conteneur existe
if ! docker inspect "$CONTAINER_NAME" &> /dev/null; then
    log_error "Le conteneur $CONTAINER_NAME n'existe pas"
    exit 1
fi

# Avertir les joueurs (optionnel)
WARN_PLAYERS="${WARN_PLAYERS:-true}"
if [ "$WARN_PLAYERS" = "true" ]; then
    log_info "Avertissement des joueurs..."
    docker exec "$CONTAINER_NAME" sh -c "echo '/say Backup du serveur dans 1 minute...' > /proc/\$(cat /tmp/hytale-server.pid)/fd/0" 2>/dev/null || true
    sleep 30
    docker exec "$CONTAINER_NAME" sh -c "echo '/say Backup du serveur dans 30 secondes...' > /proc/\$(cat /tmp/hytale-server.pid)/fd/0" 2>/dev/null || true
    sleep 30
fi

# Sauvegarder le monde (forcer la sauvegarde)
log_info "Sauvegarde du monde..."
docker exec "$CONTAINER_NAME" sh -c "echo '/save-all' > /proc/\$(cat /tmp/hytale-server.pid)/fd/0" 2>/dev/null || true
sleep 5

# Créer l'archive
log_info "Création de l'archive..."
BACKUP_PATH="$BACKUP_DIR/$BACKUP_NAME.tar.gz"

docker exec "$CONTAINER_NAME" tar czf - -C /data \
    universe/ \
    oauth/ \
    config/ \
    mods/ \
    *.jar \
    *.zip \
    2>/dev/null | cat > "$BACKUP_PATH"

# Vérifier que le backup a réussi
if [ -f "$BACKUP_PATH" ]; then
    BACKUP_SIZE=$(du -h "$BACKUP_PATH" | cut -f1)
    log_success "Backup créé: $BACKUP_NAME.tar.gz ($BACKUP_SIZE)"
    
    # Créer un fichier de métadonnées
    cat > "$BACKUP_DIR/$BACKUP_NAME.info" << EOF
Backup Date: $(date)
Container: $CONTAINER_NAME
Size: $BACKUP_SIZE
Files: universe/, oauth/, config/, mods/, *.jar, *.zip
EOF
    
else
    log_error "Échec de la création du backup"
    exit 1
fi

# Notifier la fin du backup
if [ "$WARN_PLAYERS" = "true" ]; then
    docker exec "$CONTAINER_NAME" sh -c "echo '/say Backup terminé !' > /proc/\$(cat /tmp/hytale-server.pid)/fd/0" 2>/dev/null || true
fi

# Nettoyer les anciens backups
log_info "Nettoyage des backups de plus de $KEEP_DAYS jours..."
DELETED_COUNT=0

find "$BACKUP_DIR" -name "hytale-backup-*.tar.gz" -type f -mtime +$KEEP_DAYS | while read -r old_backup; do
    log_info "Suppression: $(basename "$old_backup")"
    rm -f "$old_backup"
    rm -f "${old_backup%.tar.gz}.info"
    DELETED_COUNT=$((DELETED_COUNT + 1))
done

if [ $DELETED_COUNT -gt 0 ]; then
    log_info "Supprimés: $DELETED_COUNT anciens backups"
fi

# Statistiques finales
log_info "📊 Statistiques des backups:"
TOTAL_BACKUPS=$(find "$BACKUP_DIR" -name "hytale-backup-*.tar.gz" -type f | wc -l)
TOTAL_SIZE=$(du -sh "$BACKUP_DIR" | cut -f1)
log_info "Total: $TOTAL_BACKUPS backups ($TOTAL_SIZE)"

# Lister les 5 derniers backups
log_info "Les 5 derniers backups:"
find "$BACKUP_DIR" -name "hytale-backup-*.tar.gz" -type f -printf '%T@ %p\n' | \
    sort -rn | head -5 | while read -r timestamp path; do
    BACKUP_DATE=$(date -d "@${timestamp%.*}" '+%Y-%m-%d %H:%M:%S')
    BACKUP_SIZE=$(du -h "$path" | cut -f1)
    log_info "  - $(basename "$path") ($BACKUP_SIZE) - $BACKUP_DATE"
done

log_success "✅ Backup terminé avec succès!"

# Optionnel : Envoyer une notification
WEBHOOK_URL="${BACKUP_WEBHOOK_URL:-}"
if [ ! -z "$WEBHOOK_URL" ]; then
    log_info "Envoi de la notification..."
    curl -X POST "$WEBHOOK_URL" \
        -H "Content-Type: application/json" \
        -d "{\"text\":\"✅ Backup Hytale réussi: $BACKUP_NAME ($BACKUP_SIZE)\"}" \
        2>/dev/null || log_warn "Échec de l'envoi de la notification"
fi

exit 0