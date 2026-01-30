#!/bin/bash

# Script pour basculer entre les environnements dev et production
# Usage: ./switch-env.sh [dev|prod]

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
    log_error "Usage: $0 [dev|prod]"
    exit 1
fi

ENV=$1

case "$ENV" in
    dev)
        log_info "🌿 Basculement vers l'environnement DEV..."
        
        # Vérifier si on est sur la branche dev
        CURRENT_BRANCH=$(git branch --show-current)
        if [ "$CURRENT_BRANCH" != "dev" ]; then
            log_warn "Vous n'êtes pas sur la branche dev (actuelle: $CURRENT_BRANCH)"
            read -p "Voulez-vous basculer sur dev ? (o/N) " -n 1 -r
            echo
            if [[ $REPLY =~ ^[Oo]$ ]]; then
                git checkout dev
                git pull origin dev
            else
                log_error "Opération annulée"
                exit 1
            fi
        fi
        
        # Copier la config dev
        if [ -f ".env.dev" ]; then
            cp .env.dev .env
            log_success "Configuration dev activée"
        else
            log_error "Fichier .env.dev introuvable"
            exit 1
        fi
        
        # Créer le dossier data-dev s'il n'existe pas
        if [ ! -d "data-dev" ]; then
            log_info "Création du dossier data-dev..."
            mkdir -p data-dev
            log_warn "⚠️  Dossier data-dev vide, première utilisation"
            log_info "Le serveur téléchargera les fichiers nécessaires au premier démarrage"
        fi
        
        # Redémarrer les services avec docker-compose.dev.yml
        log_info "Redémarrage des services DEV..."
        docker compose -f docker-compose.dev.yml down
        docker compose -f docker-compose.dev.yml build --no-cache
        docker compose -f docker-compose.dev.yml up -d
        
        log_success "✅ Environnement DEV activé"
        log_info "Interface web DEV: http://localhost:3001"
        log_info "API DEV: http://localhost:4001"
        log_info "Serveur Hytale DEV: localhost:5521/UDP"
        log_info ""
        log_info "📊 Statut des services DEV:"
        docker compose -f docker-compose.dev.yml ps
        ;;
        
    prod)
        log_info "🚀 Basculement vers l'environnement PRODUCTION..."
        
        # Vérifier si on est sur la branche main
        CURRENT_BRANCH=$(git branch --show-current)
        if [ "$CURRENT_BRANCH" != "main" ]; then
            log_warn "Vous n'êtes pas sur la branche main (actuelle: $CURRENT_BRANCH)"
            read -p "Voulez-vous basculer sur main ? (o/N) " -n 1 -r
            echo
            if [[ $REPLY =~ ^[Oo]$ ]]; then
                git checkout main
                git pull origin main
            else
                log_error "Opération annulée"
                exit 1
            fi
        fi
        
        # Vérifier que .env existe
        if [ ! -f ".env" ]; then
            log_warn "Fichier .env introuvable, création depuis .env.example"
            cp .env.example .env
            log_warn "⚠️  Veuillez éditer .env avec votre configuration de production"
            read -p "Appuyez sur Entrée après avoir édité .env..."
        fi
        
        # Confirmation avant de déployer en prod
        log_warn "⚠️  Vous allez déployer en PRODUCTION"
        read -p "Êtes-vous sûr ? (tapez 'oui' pour confirmer) " CONFIRM
        
        if [ "$CONFIRM" != "oui" ]; then
            log_error "Opération annulée"
            exit 1
        fi
        
        # Redémarrer les services
        log_info "Redémarrage des services..."
        docker compose down
        docker compose build --no-cache
        docker compose up -d
        
        log_success "✅ Environnement PRODUCTION activé"
        log_info "Interface web PROD: http://localhost:3000"
        log_info "API PROD: http://localhost:4000"
        log_info "Serveur Hytale PROD: localhost:5520/UDP"
        log_info ""
        log_info "📊 Statut des services PROD:"
        docker compose ps
        ;;
        
    *)
        log_error "Environnement invalide: $ENV"
        log_error "Usage: $0 [dev|prod]"
        exit 1
        ;;
esac

log_info ""
log_info "Commandes utiles:"
if [ "$ENV" = "dev" ]; then
    log_info "  docker compose -f docker-compose.dev.yml logs -f    # Voir les logs DEV"
    log_info "  docker compose -f docker-compose.dev.yml ps          # Statut DEV"
    log_info "  docker compose -f docker-compose.dev.yml down        # Arrêter DEV"
else
    log_info "  make logs          # Voir les logs PROD"
    log_info "  make health        # Vérifier la santé PROD"
    log_info "  make status        # Statut PROD"
fi

exit 0
