# 🎮 Hytale Web Manager

> Interface web moderne et complète pour gérer votre serveur Hytale via Docker

[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Docker](https://img.shields.io/badge/docker-ready-brightgreen.svg)](https://www.docker.com/)
[![Node.js](https://img.shields.io/badge/node-20+-green.svg)](https://nodejs.org/)
[![React](https://img.shields.io/badge/react-18+-61dafb.svg)](https://reactjs.org/)
[![Developed with Claude AI](https://img.shields.io/badge/developed%20with-Claude%20AI-orange.svg)](https://claude.ai)

## 🤖 Développé avec Claude AI

Ce projet a été développé en majorité par **Claude AI** (Anthropic), un assistant IA avancé capable de :
- Concevoir et implémenter des architectures complètes (frontend + backend + Docker)
- Débugger des systèmes complexes avec analyse méthodique
- Intégrer des APIs officielles (Hytale downloader, OAuth device flow)
- Créer des solutions élégantes à des problèmes techniques difficiles

Claude a géré :
- Architecture complète du système (Docker multi-conteneurs)
- Développement frontend React avec Tailwind CSS
- API Backend Node.js avec WebSocket
- Scripts bash de contrôle et monitoring
- Système de mise à jour automatique avec OAuth
- Debug et résolution de problèmes complexes

## ✨ Fonctionnalités

### 🎛️ Contrôle du Serveur
- ✅ **Démarrer/Arrêter/Redémarrer** le serveur Hytale depuis l'interface web
- ✅ **Wrapper intelligent** : contrôle du processus Java sans redémarrer le conteneur
- ✅ **Monitoring en temps réel** : CPU, mémoire RAM, uptime, PID du processus

### 📊 Informations en Temps Réel
- ✅ **Logs live** : Visualisation des logs du serveur via WebSocket
- ✅ **Version Hytale** : Affichage de la version actuelle et révision
- ✅ **Statistiques système** : CPU, RAM utilisée/limite, pourcentage d'utilisation
- ✅ **Uptime** : Temps de fonctionnement du serveur

### 👥 Gestion des Joueurs
- ✅ **Liste en direct** : Joueurs connectés avec heure de connexion
- ✅ **Actions rapides** : Kick, Ban, Pardon, Op, Deop
- ✅ **Parsing intelligent** : Extraction automatique depuis les logs du serveur

### 💻 Console Interactive
- ✅ **Exécution de commandes** : Interface web pour envoyer des commandes `/`
- ✅ **Historique** : Mémorisation des commandes précédentes
- ✅ **Feedback immédiat** : Résultats visibles dans les logs en temps réel

### 🔄 Mise à Jour Automatique ✨ NOUVEAU
- ✅ **Détection de version** : Vérifie automatiquement les nouvelles versions Hytale
- ✅ **Mise à jour en un clic** : Bouton dans l'interface web
- ✅ **Intégration hytale-downloader** : Utilise l'outil officiel Hytale
- ✅ **Authentification intelligente** : Réutilise auth.enc quand possible
- ✅ **Popup OAuth automatique** : Si authentification nécessaire, popup avec lien cliquable
- ✅ **Workflow complet** : Arrêt → Téléchargement → Installation → Redémarrage automatique
- ✅ **Volume partagé** : Communication inter-conteneurs pour l'URL OAuth
- ✅ **Gestion d'erreurs** : Rollback automatique en cas d'échec

### 🐳 Intégration Docker Native
- ✅ **Docker API** : Communication directe avec le daemon Docker
- ✅ **Multi-conteneurs** : Frontend, Backend, Serveur Hytale orchestrés
- ✅ **Réseau isolé** : Sécurité via réseau Docker dédié

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
git clone https://github.com/votre-username/hytale-web-manager.git
cd hytale-web-manager
```

### 2. Migrer depuis un serveur existant (optionnel)

Si vous avez déjà un serveur Hytale avec des données :

```bash
# Copier vos données existantes (monde, configuration, tokens)
cp -r /chemin/vers/votre/data ./data

# Votre configuration, token OAuth et monde sont préservés !
```

### 3. Configuration

```bash
# Copier le fichier de configuration exemple
cp .env.example .env

# Éditer selon vos besoins (optionnel)
nano .env
```

Variables principales :
```bash
MEMORY=4G              # Mémoire allouée au serveur
SERVER_PORT=5520       # Port UDP du serveur
TZ=Europe/Paris        # Votre timezone
ENABLE_AOT=false       # Cache AOT pour démarrage rapide
```

### 4. Lancer l'application

```bash
# Démarrer tous les services
docker compose up -d

# Suivre les logs
docker compose logs -f
```

### 5. Première authentification

Si c'est votre première installation, le serveur vous demandera de vous authentifier :

```bash
# Vérifier les logs du serveur
docker compose logs -f hytale-server

# Vous verrez un lien et un code :
# Visit: https://accounts.hytale.com/device
# Enter code: XXXX-XXXX
```

Ouvrez le lien, entrez le code, et l'authentification sera sauvegardée dans `data/auth.enc`.

### 6. Accéder à l'interface

Ouvrez votre navigateur : **http://localhost:3000**

## 📁 Structure du Projet

```
hytale-web-manager/
│
├── backend/                    # 🟢 API Node.js + Express + WebSocket
│   ├── src/
│   │   ├── index.js           # Point d'entrée
│   │   ├── routes/            # Routes API REST
│   │   │   ├── server.js      # /api/server/* (start/stop/update/version)
│   │   │   ├── players.js     # /api/players/* (kick/ban/op)
│   │   │   └── commands.js    # /api/commands/execute
│   │   ├── services/
│   │   │   ├── docker.js      # Communication Docker API
│   │   │   └── players.js     # Gestion des joueurs
│   │   └── websocket/
│   │       └── logs-stream.js # Stream logs temps réel
│   ├── Dockerfile
│   └── package.json
│
├── frontend/                   # 🔵 Interface React + Tailwind
│   ├── src/
│   │   ├── App.jsx            # Application principale
│   │   ├── main.jsx           # Point d'entrée React
│   │   └── index.css          # Styles Tailwind
│   ├── Dockerfile
│   ├── nginx.conf             # Config Nginx production
│   └── package.json
│
├── hytale-server-wrapper/      # 🟠 Wrapper de contrôle serveur
│   ├── Dockerfile             # Extension de enesbakis/hytale-docker
│   ├── wrapper.sh             # Script de gestion du processus Java
│   ├── control-server.sh      # Script de contrôle externe
│   └── update-server.sh       # 🆕 Mise à jour automatique Hytale
│
├── scripts/                    # 🔧 Scripts utilitaires
│   ├── backup.sh              # Backup automatique
│   └── restore.sh             # Restauration
│
├── data/                       # 💾 Données serveur Hytale
│   ├── HytaleServer.jar       # Binaire serveur
│   ├── Assets.zip             # Assets du jeu
│   ├── universe/              # Monde sauvegardé
│   ├── auth.enc               # 🆕 Token OAuth chiffré
│   └── config.json            # Configuration serveur
│
├── docker-compose.yml          # Orchestration des conteneurs
├── .env.example               # Configuration exemple
├── install.sh                 # Script d'installation automatique
└── Makefile                   # Commandes simplifiées
```

## 🎯 Utilisation

### Interface Web

L'interface web affiche en temps réel :

**Panneau de contrôle** :
- 🟢 Statut du serveur (Running/Stopped)
- 🔄 Boutons Start/Stop/Restart
- 🆕 **Bouton "Mettre à jour"** : Lance la mise à jour automatique Hytale
- 📊 CPU, RAM, Uptime
- 🏷️ Version Hytale actuelle

**Joueurs connectés** :
- Liste en temps réel avec heure de connexion
- Actions rapides : Op, Kick, Ban

**Console interactive** :
- Affichage des logs en direct (WebSocket)
- Champ de saisie pour commandes `/`
- Auto-scroll sur les nouveaux logs

### Mise à Jour Automatique 🆕

Le système de mise à jour est entièrement automatisé :

#### Workflow automatique
1. Cliquez sur **"Mettre à jour"** dans l'interface
2. Le système vérifie si une nouvelle version est disponible
3. Si oui :
   - Arrêt propre du serveur (`/stop`)
   - Téléchargement via `hytale-downloader` officiel
   - Installation automatique
   - Redémarrage du serveur

#### Authentification intelligente
- **Tokens valides** : Réutilise `auth.enc` → Aucune action requise
- **Tokens expirés** : Popup OAuth automatique avec lien cliquable
- L'authentification est sauvegardée pour les prochaines fois

#### Sécurité
- Volume Docker partagé sécurisé pour communication OAuth
- Timeout de 10 minutes pour le processus complet
- Rollback automatique en cas d'échec

### Gestion des Joueurs

Actions disponibles pour chaque joueur connecté :

```bash
# Promouvoir en opérateur
/op PlayerName

# Expulser du serveur
/kick PlayerName

# Bannir définitivement
/ban PlayerName

# Gracier un joueur banni
/pardon PlayerName

# Retirer les privilèges
/deop PlayerName
```

### Console Interactive

Exemples de commandes :

```bash
/list                           # Liste des joueurs
/time set day                   # Changer l'heure
/gamemode creative PlayerName   # Changer le mode de jeu
/tp PlayerName 0 100 0          # Téléporter un joueur
/say Message public             # Message serveur
/whitelist add PlayerName       # Ajouter à la whitelist
```

## 🔧 Configuration Avancée

### Variables d'environnement (.env)

```bash
# Ressources serveur
MEMORY=4G              # RAM allouée (2G minimum, 8G recommandé)
INIT_MEMORY=           # RAM initiale (optionnel)
MAX_MEMORY=            # RAM maximale (optionnel)

# Réseau
SERVER_PORT=5520       # Port UDP du serveur
SERVER_HOST=0.0.0.0    # Interface réseau

# Système
TZ=Europe/Paris        # Timezone
UID=1000               # User ID
GID=1000               # Group ID

# Performance
ENABLE_AOT=false       # Cache AOT (true pour démarrage rapide)
JVM_OPTS=              # Options JVM supplémentaires
EXTRA_ARGS=            # Arguments serveur additionnels
DEBUG=false            # Mode debug
```

### Personnaliser les ports

Modifiez `docker-compose.yml` :

```yaml
services:
  frontend:
    ports:
      - "8080:80"      # Changer le port frontend

  backend:
    ports:
      - "8000:4000"    # Changer le port backend

  hytale-server:
    ports:
      - "25565:5520/udp"  # Changer le port Hytale
```

## 📡 API Endpoints

### Serveur

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| `GET` | `/api/server/status` | Statut du serveur (container, server, uptime, pid) |
| `GET` | `/api/server/stats` | Statistiques (CPU, RAM) |
| `GET` | `/api/server/version` | 🆕 Version Hytale actuelle |
| `POST` | `/api/server/start` | Démarrer le serveur |
| `POST` | `/api/server/stop` | Arrêter le serveur |
| `POST` | `/api/server/restart` | Redémarrer le serveur |
| `POST` | `/api/server/update` | 🆕 Lancer mise à jour automatique |
| `GET` | `/api/server/oauth-url` | 🆕 Récupérer URL OAuth si nécessaire |
| `GET` | `/api/server/logs?lines=100` | Récupérer les logs |

### Joueurs

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| `GET` | `/api/players` | Liste des joueurs connectés |
| `POST` | `/api/players/:name/kick` | Expulser un joueur |
| `POST` | `/api/players/:name/ban` | Bannir un joueur |
| `POST` | `/api/players/:name/pardon` | Gracier un joueur banni |
| `POST` | `/api/players/:name/op` | Promouvoir en opérateur |
| `POST` | `/api/players/:name/deop` | Retirer les privilèges |

### Commandes

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| `POST` | `/api/commands/execute` | Exécuter une commande serveur |

### WebSocket

| Endpoint | Description |
|----------|-------------|
| `ws://localhost:4000/ws/logs` | Stream des logs en temps réel |

## 🐳 Commandes Docker

### Makefile (recommandé)

```bash
make help          # Afficher toutes les commandes disponibles
make start         # Démarrer tous les services
make stop          # Arrêter tous les services
make restart       # Redémarrer tous les services
make status        # Afficher le statut
make logs          # Voir tous les logs
make logs-server   # Logs du serveur Hytale uniquement
make logs-backend  # Logs du backend uniquement
make build         # Reconstruire les images
make clean         # Nettoyer containers et images
make backup        # Créer un backup
make restore       # Restaurer depuis un backup
make health        # Vérifier la santé de l'application
make info          # Afficher les informations du projet
```

### Docker Compose

```bash
# Démarrer
docker compose up -d

# Arrêter
docker compose down

# Logs
docker compose logs -f
docker compose logs -f hytale-server
docker compose logs -f backend

# Redémarrer un service
docker compose restart hytale-server
docker compose restart backend

# Reconstruire
docker compose build --no-cache
docker compose up -d --force-recreate
```

## 🔒 Sécurité

⚠️ **Important** : Cette application est conçue pour un usage local/homelab.

### Pour une utilisation en production :

1. **Authentification** : Ajouter un système de login (JWT, OAuth)
2. **HTTPS** : Utiliser un reverse proxy (nginx, Traefik) avec certificat SSL
3. **Firewall** : Restreindre l'accès aux ports 3000 et 4000
4. **Variables d'environnement** : Ne JAMAIS commiter le fichier `.env`
5. **Docker socket** : Utiliser un proxy Docker au lieu d'exposer `/var/run/docker.sock`

### Recommandations :

```bash
# Exemple avec Traefik + Let's Encrypt
services:
  frontend:
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.hytale.rule=Host(`hytale.example.com`)"
      - "traefik.http.routers.hytale.tls.certresolver=letsencrypt"
```

## 🐛 Dépannage

### Le serveur ne démarre pas

```bash
# Vérifier les logs
docker compose logs hytale-server | tail -100

# Vérifier que les fichiers requis existent
ls -la data/HytaleServer.jar
ls -la data/Assets.zip

# Vérifier les permissions
sudo chown -R 1000:1000 data/
chmod -R 755 data/
```

### Impossible de se connecter à l'interface web

```bash
# Vérifier que les conteneurs tournent
docker compose ps

# Tester l'API backend
curl http://localhost:4000/api/health

# Vérifier les logs frontend
docker compose logs frontend

# Redémarrer le frontend
docker compose restart frontend
```

### Les logs ne s'affichent pas

```bash
# Vérifier la connexion WebSocket (F12 dans le navigateur)
# Onglet Network → WS → Vérifier la connexion

# Redémarrer le backend
docker compose restart backend

# Tester manuellement le WebSocket
wscat -c ws://localhost:4000/ws/logs
```

### Erreur "Cannot connect to Docker daemon"

Le backend nécessite l'accès au socket Docker :

```bash
# Vérifier les permissions
ls -la /var/run/docker.sock

# Ajouter votre utilisateur au groupe docker (Linux)
sudo usermod -aG docker $USER
newgrp docker

# Redémarrer le service Docker
sudo systemctl restart docker
```

### La mise à jour échoue

```bash
# Vérifier les logs du script de mise à jour
docker compose exec hytale-server cat /data/logs/update.log

# Vérifier que hytale-downloader fonctionne
docker compose exec hytale-server /usr/local/bin/hytale-downloader -print-version

# Vérifier l'authentification
docker compose exec hytale-server cat /data/auth.enc
```

### Popup OAuth n'apparaît pas

```bash
# Vérifier que l'URL OAuth est générée
docker compose exec hytale-server cat /tmp/oauth-shared/oauth-url.txt

# Tester l'API backend
curl http://localhost:4000/api/server/oauth-url

# Vérifier les logs backend
docker compose logs backend | grep oauth
```

## 📊 Architecture Technique

### Système de Mise à Jour

```
┌─────────────────────┐
│  Interface Web      │ ← User clique "Mettre à jour"
└──────────┬──────────┘
           │ POST /api/server/update
┌──────────▼──────────┐
│  Backend API        │ ← Lance update-server.sh
└──────────┬──────────┘
           │ docker exec
┌──────────▼──────────────────────────┐
│  Hytale Server Container            │
│  ┌────────────────────────────────┐ │
│  │ update-server.sh               │ │ ← Télécharge via hytale-downloader
│  │ 1. Arrêt serveur (/stop)       │ │
│  │ 2. Télécharge nouvelle version │ │
│  │ 3. Authentification OAuth ?    │ │
│  │    → Si oui : écrit URL        │ │
│  │ 4. Extrait et installe         │ │
│  │ 5. Redémarre serveur           │ │
│  └────────────────────────────────┘ │
└───────────────────────────────────────┘
           │
           │ Volume partagé : /tmp/oauth-shared/oauth-url.txt
           ▼
┌──────────────────────┐
│  Backend API         │ ← Lit l'URL OAuth
│  GET /oauth-url      │
└──────────┬───────────┘
           │
┌──────────▼──────────┐
│  Frontend            │ ← Popup automatique avec lien
│  Polling /oauth-url │
└─────────────────────┘
```

### Communication inter-conteneurs

- **Frontend ↔ Backend** : HTTP REST + WebSocket
- **Backend ↔ Hytale Server** : Docker API + docker exec
- **OAuth URL sharing** : Volume Docker partagé `/tmp/oauth-shared`

## 🤝 Contribution

Les contributions sont les bienvenues ! Pour contribuer :

1. Fork le projet
2. Créez une branche (`git checkout -b feature/amazing-feature`)
3. Committez vos changements (`git commit -m 'Add amazing feature'`)
4. Push vers la branche (`git push origin feature/amazing-feature`)
5. Ouvrez une Pull Request

Consultez [CONTRIBUTING.md](CONTRIBUTING.md) pour plus de détails.

## 📝 TODO / Roadmap

### Court terme
- [ ] Authentification utilisateur (JWT)
- [ ] Backup automatique avant mise à jour
- [ ] Notifications Discord/Webhook pour mises à jour

### Moyen terme
- [ ] Graphiques de performance (historique CPU/RAM sur 24h)
- [ ] Planification de tâches (restart automatique, backup programmé)
- [ ] Support multi-serveurs (gérer plusieurs instances Hytale)
- [ ] Éditeur de fichiers de configuration en ligne

### Long terme
- [ ] Gestion des mods/plugins depuis l'interface
- [ ] Système de permissions utilisateurs (admin/modérateur/viewer)
- [ ] API publique pour intégrations tierces
- [ ] Application mobile (React Native)

## 📚 Ressources & Références

### Documentation Officielle Hytale
- [Hytale Server Manual](https://support.hytale.com/hc/en-us/articles/45326769420827-Hytale-Server-Manual)
- [Server Provider Authentication Guide](https://support.hytale.com/hc/en-us/articles/45328341414043-Server-Provider-Authentication-Guide)
- [Hytale Downloader](https://downloader.hytale.com/hytale-downloader.zip)

### Projets Connexes
- [enesbakis/hytale-docker](https://github.com/enesbakis/hytale-docker) - Image Docker de base
- [Hytale Official](https://hytale.com) - Site officiel du jeu

## 📄 Licence

Ce projet est sous licence MIT. Voir le fichier [LICENSE](LICENSE) pour plus de détails.

## 🙏 Remerciements

- **Claude AI (Anthropic)** - Développement principal du projet
- [enesbakis/hytale-docker](https://github.com/enesbakis/hytale-docker) - Image Docker de base
- La communauté Hytale - Tests et retours
- Tous les contributeurs du projet

## 📧 Support

Pour toute question ou problème :

- 🐛 Ouvrez une [issue](https://github.com/votre-username/hytale-web-manager/issues)
- 💬 Consultez les [discussions](https://github.com/votre-username/hytale-web-manager/discussions)
- 📖 Lisez la documentation complète

## 🌟 Fonctionnalités Avancées

### Backup & Restore

```bash
# Créer un backup manuel
make backup

# OU
./scripts/backup.sh ./backups

# Restaurer depuis un backup
make restore BACKUP=./backups/hytale-backup-20260124_120000.tar.gz

# OU
./scripts/restore.sh ./backups/hytale-backup-20260124_120000.tar.gz
```

### Monitoring Système

L'interface affiche en temps réel :
- **CPU** : Pourcentage d'utilisation
- **RAM** : Utilisée / Limite (en MB et %)
- **Uptime** : Temps de fonctionnement formaté (ex: 2h 34m 12s)
- **PID** : Process ID du serveur Java
- **Version** : Version Hytale complète (ex: 2026.01.24-6e2d4fc36)

### Logs en Temps Réel

- WebSocket pour streaming sans latence
- Buffer de 200 dernières lignes
- Auto-scroll sur nouveaux messages
- Format coloré avec timestamps

## 🔧 Scripts Utilitaires

### install.sh

Script d'installation automatique interactif :
- Détecte la configuration système (RAM disponible)
- Copie les données d'un serveur existant si fourni
- Configure `.env` automatiquement
- Build les images Docker
- Démarre les services

```bash
./install.sh                              # Installation standard
./install.sh /chemin/vers/data/existant   # Avec migration de données
```

### Diagnostic

```bash
# Vérifier la santé complète du système
make health

# Afficher les informations du projet
make info

# Accéder au shell du serveur
make shell-server

# Accéder au shell du backend
make shell-backend
```

## 🎮 Se Connecter au Serveur

Une fois le serveur démarré :

1. **Récupérer votre IP publique** :
   ```bash
   curl ifconfig.me
   ```

2. **Dans Hytale** :
   - IP : `votre-ip-publique`
   - Port : `5520`

3. **Configuration Firewall/Router** :
   - Ouvrir le port `5520/UDP`
   - Rediriger vers l'IP de la machine hôte

## 💡 Conseils de Performance

### Pour de meilleures performances

```bash
# Dans .env
MEMORY=8G                    # Plus de RAM = meilleur
ENABLE_AOT=true              # Démarrage plus rapide (après 1er démarrage)
JVM_OPTS=-XX:+UseG1GC        # Garbage collector optimisé
```

### Optimiser Docker

```bash
# Limiter les ressources Docker
# docker-compose.yml
services:
  hytale-server:
    deploy:
      resources:
        limits:
          cpus: '4'
          memory: 8G
        reservations:
          memory: 4G
```

## 📈 Évolution du Projet

### v1.0.0 - Release Initiale (Janvier 2026)
- ✅ Interface web React + Tailwind
- ✅ API REST backend Node.js
- ✅ WebSocket pour logs temps réel
- ✅ Contrôle serveur (start/stop/restart)
- ✅ Gestion des joueurs
- ✅ Console interactive
- ✅ Wrapper bash pour contrôle fin du processus Java

### v1.1.0 - Mise à Jour Automatique (Janvier 2026) 🆕
- ✅ Système de mise à jour automatique Hytale
- ✅ Intégration hytale-downloader officiel
- ✅ Popup OAuth automatique et interactive
- ✅ Réutilisation intelligente des tokens d'authentification
- ✅ Affichage de la version Hytale
- ✅ Volume partagé pour communication OAuth
- ✅ Gestion d'erreurs avec rollback

### v2.0.0 - Prévue (Futur)
- 🔜 Authentification multi-utilisateurs
- 🔜 Graphiques de performance historiques
- 🔜 Support multi-serveurs
- 🔜 Notifications Discord/Email
- 🔜 Éditeur de configuration en ligne

---

<div align="center">

**Développé avec ❤️ par Claude AI pour la communauté Hytale**

[⭐ Star ce projet](https://github.com/votre-username/hytale-web-manager) • [🐛 Signaler un bug](https://github.com/votre-username/hytale-web-manager/issues) • [💬 Discussions](https://github.com/votre-username/hytale-web-manager/discussions)

</div>
