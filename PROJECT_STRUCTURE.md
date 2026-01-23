# 📁 Structure Complète du Projet

## 🌳 Arborescence

```
hytale-web-manager/
│
├── 📄 README.md                      # Documentation principale
├── 📄 QUICKSTART.md                  # Guide de démarrage rapide
├── 📄 MIGRATION.md                   # Guide de migration
├── 📄 CONTRIBUTING.md                # Guide de contribution
├── 📄 LICENSE                        # Licence MIT
├── 📄 PROJECT_STRUCTURE.md           # Ce fichier
│
├── ⚙️ .env.example                   # Configuration exemple
├── ⚙️ .gitignore                     # Fichiers à ignorer
├── ⚙️ docker-compose.yml             # Orchestration Docker
├── ⚙️ Makefile                       # Commandes simplifiées
├── 🔧 install.sh                     # Script d'installation
│
├── 📂 backend/                       # ═══ API Node.js + Express ═══
│   ├── 📄 Dockerfile                 # Image Docker backend
│   ├── 📄 package.json               # Dépendances Node.js
│   ├── 📄 .env                       # Config backend (gitignored)
│   │
│   └── 📂 src/                       # Code source
│       ├── 📄 index.js               # Point d'entrée
│       │
│       ├── 📂 routes/                # Routes API REST
│       │   ├── 📄 server.js          # /api/server/* (start/stop/status)
│       │   ├── 📄 players.js         # /api/players/* (kick/ban/op)
│       │   └── 📄 commands.js        # /api/commands/execute
│       │
│       ├── 📂 services/              # Logique métier
│       │   ├── 📄 docker.js          # Communication Docker API
│       │   └── 📄 players.js         # Gestion des joueurs
│       │
│       └── 📂 websocket/             # WebSocket
│           └── 📄 logs-stream.js     # Stream logs temps réel
│
├── 📂 frontend/                      # ═══ Interface React ═══
│   ├── 📄 Dockerfile                 # Image Docker frontend
│   ├── 📄 package.json               # Dépendances React
│   ├── 📄 vite.config.js             # Configuration Vite
│   ├── 📄 tailwind.config.js         # Configuration Tailwind
│   ├── 📄 postcss.config.js          # Configuration PostCSS
│   ├── 📄 nginx.conf                 # Config Nginx production
│   ├── 📄 index.html                 # Point d'entrée HTML
│   │
│   └── 📂 src/                       # Code source
│       ├── 📄 main.jsx               # Point d'entrée React
│       ├── 📄 App.jsx                # Application principale
│       └── 📄 index.css              # Styles Tailwind
│
├── 📂 hytale-server-wrapper/         # ═══ Wrapper Serveur Hytale ═══
│   ├── 📄 Dockerfile                 # Extension de enesbakis/hytale-docker
│   ├── 🔧 wrapper.sh                 # Script principal de contrôle
│   └── 🔧 control-server.sh          # Script de contrôle externe
│
├── 📂 scripts/                       # ═══ Scripts Utilitaires ═══
│   ├── 🔧 backup.sh                  # Backup automatique
│   └── 🔧 restore.sh                 # Restauration depuis backup
│
├── 📂 .github/                       # ═══ GitHub Actions ═══
│   └── 📂 workflows/
│       └── 📄 ci.yml                 # Pipeline CI/CD
│
├── 📂 data/                          # ═══ Données Serveur Hytale ═══
│   ├── 📦 HytaleServer.jar           # Binaire serveur (requis)
│   ├── 📦 Assets.zip                 # Assets du jeu (requis)
│   │
│   ├── 📂 universe/                  # Monde sauvegardé
│   │   ├── 📂 region/
│   │   └── 📄 world.dat
│   │
│   ├── 📂 oauth/                     # Tokens d'authentification
│   │   └── 📄 device_token.json
│   │
│   ├── 📂 config/                    # Fichiers de configuration
│   │   └── 📄 server.properties
│   │
│   ├── 📂 mods/                      # Mods/Plugins
│   │   └── 📦 *.jar
│   │
│   └── 📂 logs/                      # Logs du serveur
│       └── 📄 latest.log
│
└── 📂 backups/                       # ═══ Backups Automatiques ═══
    ├── 📦 hytale-backup-20240123_120000.tar.gz
    ├── 📄 hytale-backup-20240123_120000.info
    └── ...
```

## 📦 Conteneurs Docker

### 1. `hytale-server` (Serveur Hytale)
- **Image**: Custom (basée sur `enesbakis/hytale-docker`)
- **Port**: 5520/UDP
- **Volumes**: `./data:/data`
- **Fonction**: Exécute le serveur Hytale avec wrapper de contrôle

### 2. `backend` (API Node.js)
- **Image**: Custom (Node.js 20 Alpine)
- **Port**: 4000
- **Volumes**: `/var/run/docker.sock` (accès Docker)
- **Fonction**: API REST + WebSocket pour contrôle du serveur

### 3. `frontend` (Interface Web)
- **Image**: Custom (Nginx Alpine)
- **Port**: 3000 (80 dans le conteneur)
- **Fonction**: Interface utilisateur React

## 🔌 Architecture Réseau

```
┌─────────────────────────────────────────┐
│         Réseau Docker: hytale-network   │
│                                          │
│  ┌────────────┐    ┌──────────────┐    │
│  │  Frontend  │◄───┤   Backend    │    │
│  │   :3000    │    │    :4000     │    │
│  └────────────┘    └──────┬───────┘    │
│                            │             │
│                    ┌───────▼───────┐    │
│                    │ Hytale Server │    │
│                    │    :5520/UDP  │    │
│                    └───────────────┘    │
└─────────────────────────────────────────┘
         │                    │
         │                    │
    [Navigateur]         [Jeu Hytale]
```

## 🌐 Endpoints API

### Serveur
```
GET    /api/server/status     → Statut du serveur
GET    /api/server/stats      → CPU, RAM, uptime
POST   /api/server/start      → Démarrer le serveur
POST   /api/server/stop       → Arrêter le serveur
POST   /api/server/restart    → Redémarrer le serveur
GET    /api/server/logs       → Récupérer les logs
```

### Joueurs
```
GET    /api/players            → Liste des joueurs
POST   /api/players/:name/kick → Expulser
POST   /api/players/:name/ban  → Bannir
POST   /api/players/:name/op   → Promouvoir OP
POST   /api/players/:name/deop → Retirer OP
```

### Commandes
```
POST   /api/commands/execute   → Exécuter une commande
```

### WebSocket
```
WS     /ws/logs                → Stream logs temps réel
```

## 🔧 Variables d'Environnement

### Serveur Hytale (.env)
```bash
MEMORY=4G                # Mémoire allouée
INIT_MEMORY=            # Mémoire initiale
MAX_MEMORY=             # Mémoire maximale
SERVER_PORT=5520        # Port UDP
SERVER_HOST=0.0.0.0     # Interface réseau
TZ=Europe/Paris         # Timezone
UID=1000                # User ID
GID=1000                # Group ID
ENABLE_AOT=false        # Cache AOT
JVM_OPTS=               # Options JVM
EXTRA_ARGS=             # Arguments serveur
DEBUG=false             # Mode debug
```

### Backend
```bash
PORT=4000
HYTALE_CONTAINER_NAME=hytale-server
NODE_ENV=production
```

### Frontend
```bash
VITE_API_URL=http://localhost:4000
VITE_WS_URL=ws://localhost:4000
```

## 📊 Flux de Données

### Démarrage du Serveur
```
User Interface
    ↓ [Clic bouton "Start"]
Frontend (React)
    ↓ [POST /api/server/start]
Backend (Express)
    ↓ [docker exec control-server.sh start]
Wrapper Script
    ↓ [echo "start" > /tmp/server-control]
Control Listener
    ↓ [lance java -jar HytaleServer.jar]
Serveur Hytale
    ↓ [processus démarré]
Status Update
    ↑ [streaming via WebSocket]
User Interface
```

### Logs en Temps Réel
```
Serveur Hytale
    ↓ [stdout/stderr]
Docker Logs
    ↓ [docker logs -f]
Backend WebSocket
    ↓ [ws://localhost:4000/ws/logs]
Frontend WebSocket Client
    ↓ [affichage dans console]
User Interface
```

## 🔒 Sécurité

### Fichiers Sensibles (gitignored)
- `.env` - Configuration avec credentials
- `data/` - Données du serveur
- `data/oauth/` - Tokens d'authentification
- `backups/` - Sauvegardes

### Permissions Docker
- Backend a accès au socket Docker (`/var/run/docker.sock`)
- Nécessaire pour contrôler le conteneur serveur
- En production : utiliser Docker socket proxy

### Réseau
- Frontend ← Backend : HTTP REST + WebSocket
- Backend ← Serveur : Docker API
- Isolement via réseau Docker dédié

## 🚀 Commandes Rapides

```bash
# Démarrage
make start              # ou: docker compose up -d

# Logs
make logs               # Tous les logs
make logs-server        # Logs serveur uniquement

# Backup/Restore
make backup             # Créer un backup
make restore BACKUP=... # Restaurer

# Développement
make dev-backend        # Mode dev backend
make dev-frontend       # Mode dev frontend

# Maintenance
make clean              # Nettoyer
make update             # Mettre à jour depuis Git
make health             # Vérifier la santé
```

## 📚 Documentation Complémentaire

- **README.md** : Documentation complète et détaillée
- **QUICKSTART.md** : Démarrage rapide en 5 minutes
- **MIGRATION.md** : Migrer depuis serveur existant
- **CONTRIBUTING.md** : Comment contribuer au projet

## 🎯 Fonctionnalités Clés

### Actuelles
✅ Contrôle serveur (start/stop/restart)
✅ Monitoring temps réel (CPU, RAM)
✅ Logs en streaming (WebSocket)
✅ Gestion des joueurs (kick/ban/op)
✅ Console interactive
✅ Backup/Restore automatique

### Prévues
🔜 Authentification utilisateur
🔜 Graphiques de performance
🔜 Support multi-serveurs
🔜 Notifications Discord/Webhook
🔜 Éditeur de configuration
🔜 Planification de tâches

---

**Pour toute question sur la structure, consultez CONTRIBUTING.md**