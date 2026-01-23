#!/bin/bash

# Script de diagnostic et correction intelligente
# Analyse l'état actuel et applique uniquement les corrections nécessaires

set -e

# Couleurs
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║  Diagnostic et Correction du Serveur Hytale Web Manager  ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""

# Vérifier qu'on est dans le bon répertoire
if [ ! -f "docker-compose.yml" ]; then
    echo -e "${RED}❌ Erreur: docker-compose.yml non trouvé${NC}"
    echo "   Veuillez exécuter ce script depuis le répertoire racine du projet"
    exit 1
fi

echo -e "${YELLOW}📋 Étape 1: Analyse de l'état actuel${NC}"
echo ""

# Variables pour tracker ce qui doit être corrigé
NEEDS_WRAPPER_FIX=false
NEEDS_CONTROL_FIX=false
NEEDS_DOCKER_JS_FIX=false

# Fonction pour vérifier si un fichier contient une chaîne
file_contains() {
    grep -q "$2" "$1" 2>/dev/null
}

# 1. Vérifier wrapper.sh
echo -n "   Vérification de wrapper.sh... "
if [ -f "hytale-server-wrapper/wrapper.sh" ]; then
    if file_contains "hytale-server-wrapper/wrapper.sh" "STATUS_FILE"; then
        echo -e "${GREEN}✓ OK (déjà corrigé)${NC}"
    else
        echo -e "${YELLOW}⚠ Besoin de correction${NC}"
        NEEDS_WRAPPER_FIX=true
    fi
else
    echo -e "${RED}✗ Fichier manquant${NC}"
    NEEDS_WRAPPER_FIX=true
fi

# 2. Vérifier control-server.sh
echo -n "   Vérification de control-server.sh... "
if [ -f "hytale-server-wrapper/control-server.sh" ]; then
    if file_contains "hytale-server-wrapper/control-server.sh" "STATUS_FILE"; then
        echo -e "${GREEN}✓ OK (déjà corrigé)${NC}"
    else
        echo -e "${YELLOW}⚠ Besoin de correction${NC}"
        NEEDS_CONTROL_FIX=true
    fi
else
    echo -e "${RED}✗ Fichier manquant${NC}"
    NEEDS_CONTROL_FIX=true
fi

# 3. Vérifier docker.js
echo -n "   Vérification de backend/src/services/docker.js... "
if [ -f "backend/src/services/docker.js" ]; then
    if file_contains "backend/src/services/docker.js" "getStatus"; then
        echo -e "${GREEN}✓ OK (existe)${NC}"
        # Vérifier si la version est correcte
        if file_contains "backend/src/services/docker.js" "serverStatus.*pidStr"; then
            echo -e "${GREEN}      Version corrigée détectée${NC}"
        else
            echo -e "${YELLOW}      Version ancienne détectée, correction recommandée${NC}"
            NEEDS_DOCKER_JS_FIX=true
        fi
    else
        echo -e "${RED}✗ Fichier incomplet${NC}"
        NEEDS_DOCKER_JS_FIX=true
    fi
else
    echo -e "${RED}✗ Fichier manquant${NC}"
    NEEDS_DOCKER_JS_FIX=true
fi

echo ""

# 4. Test du conteneur actuel
echo -n "   État du conteneur... "
if docker compose ps | grep -q "hytale-server.*Up"; then
    echo -e "${GREEN}✓ En cours d'exécution${NC}"
    
    # Test du statut
    echo -n "   Test du statut actuel... "
    STATUS=$(docker compose exec -T hytale-server /control-server.sh status 2>/dev/null || echo "ERROR")
    
    if echo "$STATUS" | grep -q "running\|stopped"; then
        echo -e "${GREEN}✓ Fonctionne${NC}"
        echo "      Résultat: $STATUS"
    else
        echo -e "${RED}✗ Ne fonctionne pas${NC}"
        echo "      Résultat: $STATUS"
    fi
else
    echo -e "${YELLOW}⚠ Arrêté${NC}"
fi

echo ""
echo -e "${BLUE}════════════════════════════════════════════════════════════${NC}"
echo ""

# Résumé
echo -e "${YELLOW}📊 Résumé de l'analyse:${NC}"
echo ""

NEEDS_FIX=false

if [ "$NEEDS_WRAPPER_FIX" = true ]; then
    echo -e "   ${YELLOW}⚠${NC} wrapper.sh nécessite une correction"
    NEEDS_FIX=true
fi

if [ "$NEEDS_CONTROL_FIX" = true ]; then
    echo -e "   ${YELLOW}⚠${NC} control-server.sh nécessite une correction"
    NEEDS_FIX=true
fi

if [ "$NEEDS_DOCKER_JS_FIX" = true ]; then
    echo -e "   ${YELLOW}⚠${NC} docker.js nécessite une mise à jour"
    NEEDS_FIX=true
fi

if [ "$NEEDS_FIX" = false ]; then
    echo -e "   ${GREEN}✓ Tous les fichiers semblent corrects !${NC}"
    echo ""
    echo "Si vous rencontrez toujours le problème 'server: stopped',"
    echo "essayez de redémarrer le conteneur:"
    echo ""
    echo "   docker compose restart hytale-server"
    echo ""
    exit 0
fi

echo ""
echo -e "${YELLOW}💡 Des corrections sont nécessaires.${NC}"
echo ""
read -p "Voulez-vous appliquer les corrections ? (o/N) " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Oo]$ ]]; then
    echo "Opération annulée."
    exit 0
fi

echo ""
echo -e "${YELLOW}📋 Étape 2: Sauvegarde de sécurité${NC}"
echo ""

# Créer un dossier de backup avec timestamp
BACKUP_DIR="backup-$(date +%Y%m%d-%H%M%S)"
mkdir -p "$BACKUP_DIR"

if [ -f "hytale-server-wrapper/wrapper.sh" ]; then
    cp hytale-server-wrapper/wrapper.sh "$BACKUP_DIR/"
    echo -e "   ${GREEN}✓${NC} wrapper.sh sauvegardé"
fi

if [ -f "hytale-server-wrapper/control-server.sh" ]; then
    cp hytale-server-wrapper/control-server.sh "$BACKUP_DIR/"
    echo -e "   ${GREEN}✓${NC} control-server.sh sauvegardé"
fi

if [ -f "backend/src/services/docker.js" ]; then
    cp backend/src/services/docker.js "$BACKUP_DIR/"
    echo -e "   ${GREEN}✓${NC} docker.js sauvegardé"
fi

echo -e "   ${GREEN}✓${NC} Sauvegarde complète dans: ${BACKUP_DIR}"
echo ""

echo -e "${YELLOW}📋 Étape 3: Application des corrections${NC}"
echo ""

# Appliquer les corrections nécessaires
if [ "$NEEDS_WRAPPER_FIX" = true ]; then
    echo "   → Correction de wrapper.sh..."
    
    # Télécharger ou créer la version corrigée
    if [ -f "wrapper-fixed.sh" ]; then
        cp wrapper-fixed.sh hytale-server-wrapper/wrapper.sh
        chmod +x hytale-server-wrapper/wrapper.sh
        echo -e "   ${GREEN}✓${NC} wrapper.sh corrigé"
    else
        echo -e "   ${RED}✗${NC} wrapper-fixed.sh non trouvé dans le répertoire actuel"
        echo "      Veuillez télécharger wrapper-fixed.sh depuis les fichiers fournis"
        exit 1
    fi
fi

if [ "$NEEDS_CONTROL_FIX" = true ]; then
    echo "   → Correction de control-server.sh..."
    
    if [ -f "control-server-fixed.sh" ]; then
        cp control-server-fixed.sh hytale-server-wrapper/control-server.sh
        chmod +x hytale-server-wrapper/control-server.sh
        echo -e "   ${GREEN}✓${NC} control-server.sh corrigé"
    else
        echo -e "   ${RED}✗${NC} control-server-fixed.sh non trouvé dans le répertoire actuel"
        echo "      Veuillez télécharger control-server-fixed.sh depuis les fichiers fournis"
        exit 1
    fi
fi

if [ "$NEEDS_DOCKER_JS_FIX" = true ]; then
    echo "   → Mise à jour de docker.js..."
    
    mkdir -p backend/src/services
    
    if [ -f "docker-fixed.js" ]; then
        cp docker-fixed.js backend/src/services/docker.js
        echo -e "   ${GREEN}✓${NC} docker.js mis à jour"
    else
        echo -e "   ${RED}✗${NC} docker-fixed.js non trouvé dans le répertoire actuel"
        echo "      Veuillez télécharger docker-fixed.js depuis les fichiers fournis"
        exit 1
    fi
fi

echo ""
echo -e "${YELLOW}📋 Étape 4: Redémarrage des services${NC}"
echo ""

read -p "Voulez-vous redémarrer les services maintenant ? (o/N) " -n 1 -r
echo ""

if [[ $REPLY =~ ^[Oo]$ ]]; then
    echo "   → Arrêt des services..."
    docker compose down
    
    echo "   → Reconstruction de l'image..."
    docker compose build --no-cache hytale-server
    
    echo "   → Redémarrage..."
    docker compose up -d
    
    echo -e "   ${GREEN}✓${NC} Services redémarrés"
    echo ""
    
    echo "   → Attente du démarrage (15 secondes)..."
    sleep 15
    
    echo ""
    echo -e "${YELLOW}📋 Étape 5: Vérification${NC}"
    echo ""
    
    # Test de l'API
    echo -n "   Test de l'API backend... "
    STATUS_RESULT=$(curl -s http://localhost:4000/api/server/status 2>/dev/null || echo '{"error":"unreachable"}')
    
    if echo "$STATUS_RESULT" | grep -q '"server"'; then
        echo -e "${GREEN}✓ OK${NC}"
        echo ""
        echo "   Résultat:"
        echo "$STATUS_RESULT" | python3 -m json.tool 2>/dev/null || echo "$STATUS_RESULT"
    else
        echo -e "${RED}✗ Erreur${NC}"
        echo "   Résultat: $STATUS_RESULT"
    fi
else
    echo ""
    echo -e "${YELLOW}⚠${NC} Services non redémarrés."
    echo ""
    echo "Pour appliquer les changements, exécutez manuellement:"
    echo ""
    echo "   docker compose down"
    echo "   docker compose build --no-cache hytale-server"
    echo "   docker compose up -d"
fi

echo ""
echo -e "${BLUE}════════════════════════════════════════════════════════════${NC}"
echo ""
echo -e "${GREEN}✅ Correction terminée !${NC}"
echo ""
echo -e "${YELLOW}📝 Notes importantes:${NC}"
echo "   • Backup sauvegardé dans: ${BACKUP_DIR}"
echo "   • En cas de problème, restaurez avec:"
echo "     cp ${BACKUP_DIR}/* hytale-server-wrapper/"
echo "     cp ${BACKUP_DIR}/docker.js backend/src/services/"
echo ""
echo -e "${YELLOW}🧪 Commandes de test:${NC}"
echo "   • Statut API:     curl http://localhost:4000/api/server/status"
echo "   • Statut wrapper: docker compose exec hytale-server /control-server.sh status"
echo "   • Logs serveur:   docker compose logs -f hytale-server"
echo ""
