#!/bin/bash

# Script d'installation automatique de Hytale Web Manager
# Usage: ./install.sh [chemin-vers-donnees-existantes]

set -e

# Couleurs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}"
cat << "EOF"
  _   _       _        _        __        __   _     
 | | | |_   _| |_ __ _| | ___   \ \      / /__| |__  
 | |_| | | | | __/ _` | |/ _ \   \ \ /\ / / _ \ '_ \ 
 |  _  | |_| | || (_| | |  __/    \ V  V /  __/ |_) |
 |_| |_|\__, |\__\__,_|_|\___|     \_/\_/ \___|_.__/ 
        |___/                                          
  __  __                                   
 |  \/  | __ _ _ __   __ _  __ _  ___ _ __ 
 | |\/| |/ _` | '_ \ / _` |/ _` |/ _ \ '__|
 | |  | | (_| | | | | (_| | (_| |  __/ |   
 |_|  |_|\__,_|_| |_|\__,_|\__, |\___|_|   
                           |___/            
EOF
echo -e "${NC}"

echo -e "${GREEN}=== Installation de Hytale Web Manager ===${NC}\n"

# Vérifier Docker
if ! command -v docker &> /dev/null; then
    echo -e "${RED}❌ Docker n'est pas installé${NC}"
    echo "Installez Docker: https://docs.docker.com/get-docker/"
    exit 1
fi

# Vérifier Docker Compose
if ! command -v docker compose &> /dev/null; then
    echo -e "${RED}❌ Docker Compose n'est pas installé${NC}"
    echo "Installez Docker Compose: https://docs.docker.com/compose/install/"
    exit 1
fi

echo -e "${GREEN}✓ Docker et Docker Compose sont installés${NC}\n"

# Demander le chemin des données existantes
DATA_PATH=""
if [ ! -z "$1" ]; then
    DATA_PATH="$1"
else
    echo -e "${YELLOW}Avez-vous déjà un serveur Hytale avec des données existantes ? (o/N)${NC}"
    read -r EXISTING_DATA
    
    if [[ "$EXISTING_DATA" =~ ^[Oo]$ ]]; then
        echo -e "${YELLOW}Entrez le chemin vers votre dossier data (ou conteneur:chemin) :${NC}"
        read -r DATA_PATH
    fi
fi

# Créer le dossier data
mkdir -p data

# Copier les données existantes si fournies
if [ ! -z "$DATA_PATH" ]; then
    echo -e "${BLUE}📦 Copie des données existantes...${NC}"
    
    # Vérifier si c'est un conteneur Docker
    if [[ "$DATA_PATH" == *":"* ]]; then
        docker cp "$DATA_PATH" ./data/
    else
        cp -r "$DATA_PATH"/* ./data/ 2>/dev/null || true
    fi
    
    echo -e "${GREEN}✓ Données copiées${NC}\n"
fi

# Créer le fichier .env
if [ ! -f ".env" ]; then
    echo -e "${BLUE}⚙️  Configuration...${NC}"
    cp .env.example .env
    
    # Détecter la mémoire disponible
    if command -v free &> /dev/null; then
        TOTAL_MEM=$(free -g | awk '/^Mem:/{print $2}')
        RECOMMENDED_MEM=$((TOTAL_MEM / 2))
        if [ $RECOMMENDED_MEM -lt 2 ]; then
            RECOMMENDED_MEM=2
        fi
        echo -e "${YELLOW}Mémoire disponible: ${TOTAL_MEM}G - Recommandé: ${RECOMMENDED_MEM}G${NC}"
        sed -i "s/MEMORY=4G/MEMORY=${RECOMMENDED_MEM}G/" .env
    fi
    
    echo -e "${GREEN}✓ Configuration créée (.env)${NC}\n"
else
    echo -e "${YELLOW}⚠️  Le fichier .env existe déjà, on le garde${NC}\n"
fi

# Vérifier la présence des fichiers du serveur
if [ ! -f "data/HytaleServer.jar" ]; then
    echo -e "${YELLOW}⚠️  HytaleServer.jar introuvable dans ./data/${NC}"
    echo -e "${YELLOW}Vous devez télécharger les fichiers du serveur Hytale.${NC}"
    echo -e "${YELLOW}Consultez le README.md pour les instructions.${NC}\n"
fi

# Construire les images
echo -e "${BLUE}🏗️  Construction des images Docker...${NC}"
echo -e "${YELLOW}Cela peut prendre quelques minutes...${NC}\n"

docker compose build

echo -e "${GREEN}✓ Images construites${NC}\n"

# Demander si on lance maintenant
echo -e "${YELLOW}Voulez-vous démarrer les services maintenant ? (O/n)${NC}"
read -r START_NOW

if [[ ! "$START_NOW" =~ ^[Nn]$ ]]; then
    echo -e "${BLUE}🚀 Démarrage des services...${NC}\n"
    docker compose up -d
    
    echo -e "${GREEN}✓ Services démarrés !${NC}\n"
    
    # Attendre un peu
    sleep 3
    
    # Afficher le statut
    echo -e "${BLUE}📊 Statut des services :${NC}"
    docker compose ps
    
    echo -e "\n${GREEN}✨ Installation terminée !${NC}\n"
    echo -e "${BLUE}Interface web :${NC} http://localhost:3000"
    echo -e "${BLUE}API :${NC} http://localhost:4000"
    echo -e "${BLUE}Serveur Hytale :${NC} localhost:5520 (UDP)\n"
    
    echo -e "${YELLOW}📝 Consultez les logs :${NC} docker compose logs -f"
    echo -e "${YELLOW}📚 Documentation complète :${NC} README.md\n"
    
    # Vérifier si le serveur nécessite une authentification
    echo -e "${BLUE}🔐 Si c'est votre première utilisation, consultez les logs pour l'authentification :${NC}"
    echo -e "   docker compose logs -f hytale-server\n"
else
    echo -e "${GREEN}✓ Installation terminée !${NC}\n"
    echo -e "${YELLOW}Pour démarrer les services :${NC} docker compose up -d"
    echo -e "${YELLOW}Pour consulter la documentation :${NC} cat README.md\n"
fi

echo -e "${GREEN}✅ Tout est prêt ! Bon jeu ! 🎮${NC}"