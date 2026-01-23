#!/bin/bash

# Script de restauration du serveur Hytale depuis un backup
# Usage: ./restore.sh <backup-file.tar.gz>

set -e

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

# Vérifier les arguments
if [ $# -eq 0 ]; then
    log_error "Usage: $0 <backup-file.tar.gz>"
    echo ""
    echo "Exemples:"
    echo "  $0 ./backups/hytale-backup-20240123_120000.tar.gz"
    echo "  $0 ./backups/latest.tar.gz"
    exit 1
fi

BACKUP_FILE="$1"
CONTAINER_NAME="${HYTALE_CONTAINER_NAME:-hytale-server}"
DATA_DIR="./data"

log_info "🔄 Restauration du serveur Hytale..."
log_info "Fichier de backup: $BACKUP_FILE"
log_info "Destination: $DATA_DIR"

# Vérifier que le fichier de backup existe
if [ ! -f "$BACKUP_FILE" ]; then
    log_error "Le fichier de backup n'existe pas: $BACKUP_FILE"
    exit 1
fi

# Afficher les infos du backup si disponibles
INFO_FILE="${BACKUP_FILE%.tar.gz}.info"
if [ -f "$INFO_FILE" ]; then
    log_info "📋 Informations du backup:"
    cat "$INFO_FILE" | while read line; do
        log_info "  $line"
    done
fi

# Confirmation
log_warn "⚠️  ATTENTION: Cette opération va écraser les données actuelles!"
log_warn "Le serveur doit être arrêté avant la restauration."
echo ""
read -p "Voulez-vous continuer? (tapez 'oui' pour confirmer): " CONFIRM

if [ "$CONFIRM" != "oui" ]; then
    log_info "Restauration annulée."
    exit 0
fi

# Arrêter le serveur si en cours d'exécution
log_info "Vérification de l'état du serveur..."
if docker inspect "$CONTAINER_NAME" &> /dev/null; then
    if [ "$(docker inspect -f '{{.State.Running}}' "$CONTAINER_NAME")" = "true" ]; then
        log_info "Arrêt du serveur..."
        docker compose stop hytale-server
        sleep 3
    fi
fi

# Créer un backup de sécurité des données actuelles
SAFETY_BACKUP="./data-before-restore-$(date +%Y%m%d_%H%M%S)"
if [ -d "$DATA_DIR" ]; then
    log_info "Création d'un backup de sécurité: $SAFETY_BACKUP"
    cp -r "$DATA_DIR" "$SAFETY_BACKUP"
    log_success "Backup de sécurité créé"
fi

# Créer le dossier data s'il n'existe pas
mkdir -p "$DATA_DIR"

# Extraire le backup
log_info "Extraction du backup..."
tar xzf "$BACKUP_FILE" -C "$DATA_DIR"

if [ $? -eq 0 ]; then
    log_success "Backup extrait avec succès"
else
    log_error "Échec de l'extraction du backup"
    
    # Restaurer le backup de sécurité
    if [ -d "$SAFETY_BACKUP" ]; then
        log_warn "Restauration du backup de sécurité..."
        rm -rf "$DATA_DIR"
        mv "$SAFETY_BACKUP" "$DATA_DIR"
        log_info "Données précédentes restaurées"
    fi
    
    exit 1
fi

# Corriger les permissions
log_info "Correction des permissions..."
chown -R 1000:1000 "$DATA_DIR" 2>/dev/null || true
chmod -R 755 "$DATA_DIR" 2>/dev/null || true

# Vérifier les fichiers essentiels
log_info "Vérification des fichiers..."
MISSING_FILES=()

if [ ! -f "$DATA_DIR/HytaleServer.jar" ]; then
    MISSING_FILES+=("HytaleServer.jar")
fi

if [ ! -f "$DATA_DIR/Assets.zip" ]; then
    MISSING_FILES+=("Assets.zip")
fi

if [ ${#MISSING_FILES[@]} -gt 0 ]; then
    log_warn "Fichiers manquants après restauration:"
    for file in "${MISSING_FILES[@]}"; do
        log_warn "  - $file"
    done
    log_warn "Vous devrez peut-être les ajouter manuellement."
fi

# Afficher un résumé
log_info "📊 Résumé de la restauration:"
log_info "Monde: $([ -d "$DATA_DIR/universe" ] && echo "✓ Présent" || echo "✗ Absent")"
log_info "OAuth: $([ -d "$DATA_DIR/oauth" ] && echo "✓ Présent" || echo "✗ Absent")"
log_info "Config: $([ -d "$DATA_DIR/config" ] && echo "✓ Présent" || echo "✗ Absent")"
log_info "Mods: $([ -d "$DATA_DIR/mods" ] && echo "✓ Présent" || echo "✗ Absent")"

# Proposer de redémarrer le serveur
echo ""
read -p "Voulez-vous redémarrer le serveur maintenant? (o/N): " RESTART

if [[ "$RESTART" =~ ^[Oo]$ ]]; then
    log_info "Démarrage du serveur..."
    docker compose up -d hytale-server
    
    log_info "Attente du démarrage..."
    sleep 5
    
    log_info "📜 Logs du serveur:"
    docker compose logs --tail=20 hytale-server
fi

log_success "✅ Restauration terminée!"
echo ""
log_info "Backup de sécurité conservé: $SAFETY_BACKUP"
log_info "Vous pouvez le supprimer si tout fonctionne: rm -rf $SAFETY_BACKUP"

exit 0