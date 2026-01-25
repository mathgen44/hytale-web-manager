# 🎮 Hytale Web Manager

> Interface web moderne et complète pour gérer votre serveur Hytale via Docker

[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Docker](https://img.shields.io/badge/docker-ready-brightgreen.svg)](https://www.docker.com/)
[![Node.js](https://img.shields.io/badge/node-20+-green.svg)](https://nodejs.org/)
[![React](https://img.shields.io/badge/react-18+-61dafb.svg)](https://reactjs.org/)
[![Developed with Claude AI](https://img.shields.io/badge/developed%20with-Claude%20AI-orange.svg)](https://claude.ai)

## 🤖 Développé avec Claude AI

Ce projet a été développé par **Claude AI** (Anthropic), démontrant les capacités de l'IA pour créer des applications full-stack complètes et fonctionnelles.

## ✨ Fonctionnalités

### 🎛️ Contrôle du Serveur
- ✅ Démarrer/Arrêter/Redémarrer le serveur
- ✅ Monitoring temps réel (CPU, RAM, Uptime)
- ✅ Version Hytale affichée
- ✅ Statut détaillé (container, serveur, PID)

### 👥 Gestion des Joueurs
- ✅ Liste des joueurs connectés en temps réel
- ✅ Actions admin : Op, Kick, Ban, Pardon, Deop
- ✅ Détection connexion/déconnexion automatique
- ✅ Commandes via named pipe

### 💻 Console Interactive
- ✅ Logs en temps réel via WebSocket
- ✅ Exécution de commandes `/`
- ✅ Historique des commandes
- ✅ Auto-scroll et recherche

### 🔄 Mise à Jour Automatique
- ✅ Intégration hytale-downloader officiel
- ✅ Authentification OAuth device flow
- ✅ Popup interactive pour OAuth
- ✅ Réutilisation intelligente des tokens
- ✅ Workflow entièrement automatisé

### 📦 Gestionnaire de Mods 🆕
- ✅ **Liste des mods installés** avec métadonnées (nom, taille, date, statut)
- ✅ **Upload de mods** via interface web (.jar uniquement, 50MB max)
- ✅ **Activation/Désactivation** sans suppression
- ✅ **Suppression** de mods avec confirmation
- ✅ **Intégration CurseForge** (liens directs)
- ✅ **Scan automatique** du dossier `/data/mods/`
- ✅ Interface intuitive avec drag & drop

## 📋 Prérequis

- Docker et Docker Compose installés
- Un serveur Hytale basé sur [enesbakis/hytale-docker](https://github.com/enesbakis/hytale-docker)
- Minimum 4GB de RAM (8GB recommandés)
- Ports disponibles : 
  - `3000` (interface web)
  - `4000` (API backend)
  - `5520/UDP` (serveur Hytale)

## 🚀 Installation Rapide

### 1. Cloner le projet

```bash
git clone https://github.com/mathgen44/hytale-web-manager.git
cd hytale-web-manager
```

### 2. Configuration

```bash
cp .env.example .env
# Éditer .env si nécessaire
```

### 3. Lancer l'application

```bash
docker compose up -d
```

### 4. Accéder à l'interface

Ouvrez votre navigateur : **http://localhost:3000**

## 📁 Structure du Projet

```
hytale-web-manager/
├── backend/                    # API Node.js + Express
│   ├── src/
│   │   ├── routes/
│   │   │   ├── server.js      # Contrôle serveur
│   │   │   ├── players.js     # Gestion joueurs
│   │   │   ├── commands.js    # Commandes
│   │   │   └── mods.js        # 🆕 Gestion mods
│   │   ├── services/
│   │   │   ├── docker.js      # Docker API
│   │   │   ├── players.js     # Logique joueurs
│   │   │   └── mods.js        # 🆕 Logique mods
│   │   └── websocket/
│   │       └── logs-stream.js # Stream logs
│   └── package.json           # 🆕 + multer
│
├── frontend/                   # Interface React
│   ├── src/
│   │   ├── App.jsx            # 🆕 + Section Mods
│   │   └── main.jsx
│   └── package.json
│
├── hytale-server-wrapper/      # Scripts de contrôle
│   ├── wrapper.sh             # Named pipe
│   ├── control-server.sh
│   ├── send-command.sh
│   └── update-server.sh
│
├── data/                       # Données serveur
│   ├── mods/                  # 🆕 Dossier mods
│   ├── universe/              # Monde
│   ├── auth.enc               # Token OAuth
│   └── config.json
│
└── docker-compose.yml
```

## 🎮 Utilisation

### Gestionnaire de Mods 🆕

#### Upload d'un mod

1. Téléchargez un mod depuis [CurseForge](https://www.curseforge.com/hytale/search?page=1&pageSize=20&sortBy=relevancy)
2. Dans l'interface web, section "Gestionnaire de Mods"
3. Cliquez sur "Choisir un fichier" et sélectionnez le `.jar`
4. Cliquez sur "Upload"
5. **Redémarrez le serveur** pour charger le mod

#### Activer/Désactiver un mod

- Cliquez sur le bouton "Activer" ou "Désactiver"
- Le fichier est renommé en `.jar.disabled` (ou inversement)
- **Redémarrez le serveur** pour appliquer les changements

#### Supprimer un mod

- Cliquez sur le bouton "Supprimer" (icône poubelle)
- Confirmez la suppression
- Le fichier est supprimé du dossier `/data/mods/`

#### Liens CurseForge

- Bouton "CurseForge" (header) : Ouvre le catalogue complet
- Icône "External Link" (par mod) : Recherche le mod sur CurseForge

### Gestion des Joueurs

Actions disponibles pour chaque joueur :

- **OP** : Promouvoir en opérateur
- **Kick** : Expulser temporairement
- **Ban** : Bannir définitivement
- **Pardon** : Débannir un joueur
- **Deop** : Retirer les privilèges

### Console Interactive

Commandes courantes :

```bash
/list                          # Liste des joueurs
/time set day                  # Changer l'heure
/gamemode creative PlayerName  # Mode créatif
/tp PlayerName x y z           # Téléporter
/say Message                   # Message serveur
/whitelist add PlayerName      # Whitelist
```

### Mise à Jour Serveur

1. Cliquez sur "Mettre à jour" dans l'interface
2. Si OAuth requis : cliquez sur le lien dans la popup
3. Authentifiez-vous
4. Le serveur se met à jour automatiquement

## 📡 API Endpoints

### Serveur
```
GET    /api/server/status      # Statut serveur
GET    /api/server/stats       # Statistiques CPU/RAM
GET    /api/server/version     # Version Hytale
POST   /api/server/start       # Démarrer
POST   /api/server/stop        # Arrêter
POST   /api/server/restart     # Redémarrer
POST   /api/server/update      # Mettre à jour
GET    /api/server/oauth-url   # URL OAuth
```

### Joueurs
```
GET    /api/players                    # Liste joueurs
POST   /api/players/:name/kick         # Kick
POST   /api/players/:name/ban          # Ban
POST   /api/players/:name/pardon       # Pardon
POST   /api/players/:name/op           # Promouvoir OP
POST   /api/players/:name/deop         # Retirer OP
```

### Mods 🆕
```
GET    /api/mods                      # Liste mods
POST   /api/mods/upload               # Upload mod
POST   /api/mods/:filename/enable     # Activer
POST   /api/mods/:filename/disable    # Désactiver
DELETE /api/mods/:filename            # Supprimer
GET    /api/mods/:filename/status     # Vérifier chargement
POST   /api/mods/scan                 # Scan forcé
```

### WebSocket
```
WS     /ws/logs                       # Stream logs
```

## 🔧 Commandes Docker

### Via Makefile

```bash
make start          # Démarrer
make stop           # Arrêter
make restart        # Redémarrer
make logs           # Voir logs
make logs-server    # Logs serveur Hytale
make build          # Rebuild images
make health         # Vérifier santé
make info           # Infos projet
```

### Via Docker Compose

```bash
docker compose up -d                  # Démarrer
docker compose down                   # Arrêter
docker compose logs -f                # Logs
docker compose restart hytale-server  # Redémarrer serveur
docker compose build --no-cache       # Rebuild
```

## 🔒 Sécurité - Gestionnaire de Mods

### Validations

- ✅ Extension : uniquement `.jar`
- ✅ Taille max : 50MB
- ✅ Vérification existence avant upload
- ✅ Pas d'exécution automatique

### Recommandations

1. **Source des mods** :
   - Télécharger uniquement depuis [CurseForge](https://www.curseforge.com/hytale)
   - Vérifier compatibilité version Hytale
   - Lire descriptions et dépendances

2. **Gestion** :
   - Faire un backup avant ajout de mods
   - Tester les mods un par un
   - Redémarrer après changements

3. **Résolution problèmes** :
   - Vérifier logs après ajout
   - Si crash : désactiver dernier mod ajouté
   - Consulter CurseForge pour issues connues

## 🐛 Dépannage

### Le serveur ne démarre pas

```bash
docker compose logs hytale-server | tail -100
ls -la data/HytaleServer.jar
sudo chown -R 1000:1000 data/
```

### Les mods ne se chargent pas

```bash
# Vérifier présence des mods
docker exec hytale-server ls -la /data/mods/

# Vérifier logs de chargement
docker compose logs hytale-server | grep -i "mod\|plugin"

# Redémarrer le serveur
docker compose restart hytale-server
```

### Upload de mod échoue

```bash
# Vérifier taille du fichier (max 50MB)
ls -lh /chemin/vers/mod.jar

# Vérifier extension
file /chemin/vers/mod.jar
# → doit être "Java archive data"

# Vérifier logs backend
docker compose logs backend | tail -50
```

## 📚 Documentation

- [Guide complet mods Hytale](https://hytale.game/guide-des-mods-hytale/)
- [Installation mods (officiel)](https://hytale.game/installer-un-mod-hytale/)
- [CurseForge Hytale](https://www.curseforge.com/hytale)
- [Documentation complète](README.md)
- [Guide migration](MIGRATION.md)
- [Guide contribution](CONTRIBUTING.md)

## 🤝 Contribution

Les contributions sont les bienvenues ! Consultez [CONTRIBUTING.md](CONTRIBUTING.md).

## 📄 Licence

Ce projet est sous licence MIT. Voir [LICENSE](LICENSE).

## 🙏 Remerciements

- **Claude AI (Anthropic)** - Développement principal
- [enesbakis/hytale-docker](https://github.com/enesbakis/hytale-docker) - Image Docker de base
- [CurseForge](https://www.curseforge.com/hytale) - Plateforme de mods
- La communauté Hytale - Tests et retours

## 🌟 Nouveautés v1.1.0

### Gestionnaire de Mods ✨

**Ce qui a été ajouté** :
- ✅ Interface complète de gestion des mods
- ✅ Upload via interface web
- ✅ Activation/Désactivation sans suppression
- ✅ Intégration CurseForge
- ✅ Scan automatique du dossier mods
- ✅ API REST complète pour CRUD mods

**Comment l'utiliser** :
1. Téléchargez des mods depuis CurseForge
2. Uploadez-les via l'interface (section "Gestionnaire de Mods")
3. Activez/Désactivez selon vos besoins
4. Redémarrez le serveur pour appliquer

**Avantages** :
- Plus besoin de SSH/FTP
- Gestion visuelle intuitive
- Test facile (enable/disable)
- Liens directs vers CurseForge

---

<div align="center">

**Développé avec ❤️ par Claude AI pour la communauté Hytale**

[⭐ Star ce projet](https://github.com/mathgen44/hytale-web-manager) • [🐛 Signaler un bug](https://github.com/mathgen44/hytale-web-manager/issues) • [💬 Discussions](https://github.com/mathgen44/hytale-web-manager/discussions)

</div>
