# 🎮 Hytale Web Manager

Projet dévelloppé entièrement par IA.
Interface web complète pour gérer votre serveur Hytale via Docker. Cette solution vous permet de contrôler, surveiller et administrer votre serveur Hytale depuis une interface web moderne et intuitive.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Docker](https://img.shields.io/badge/docker-ready-brightgreen.svg)

## ✨ Fonctionnalités

- 🎛️ **Contrôle du serveur** : Démarrer, arrêter et redémarrer le serveur Hytale
- 📊 **Monitoring en temps réel** : CPU, mémoire, et statut du serveur
- 📜 **Logs en direct** : Visualisation des logs du serveur via WebSocket
- 👥 **Gestion des joueurs** : Liste des joueurs connectés avec actions rapides (kick, ban, op)
- 💻 **Console interactive** : Exécution de commandes directement sur le serveur
- 🐳 **Docker natif** : Intégration complète avec Docker et votre serveur existant

## 📋 Prérequis

- Docker et Docker Compose installés
- Un serveur Hytale basé sur [enesbakis/hytale-docker](https://github.com/enesbakis/hytale-docker)
- Minimum 4GB de RAM
- Ports disponibles : 3000 (frontend), 4000 (backend), 5520/UDP (Hytale)

## 🚀 Installation

### 1. Cloner le projet

```bash
git clone https://github.com/votre-username/hytale-web-manager.git
cd hytale-web-manager
```

### 2. Migration depuis votre serveur existant

Si vous avez déjà un serveur Hytale avec `enesbakis/hytale-docker` :

```bash
# Copier vos données du serveur existant
cp -r /chemin/vers/votre/data ./data

# Votre configuration, token et monde sont préservés !
```

### 3. Configuration

```bash
cp .env.example .env
# Éditer le fichier .env selon vos besoins
```

### 4. Construire le wrapper Hytale

Le wrapper permet de contrôler le processus serveur sans redémarrer le conteneur :

```bash
cd hytale-server-wrapper
# Copier les scripts de contrôle
cp ../scripts/* .
```

### 5. Lancer l'application

```bash
docker compose up -d
```

### 6. Accéder à l'interface

Ouvrez votre navigateur et rendez-vous sur : **http://localhost:3000**

## 📁 Structure du Projet

```
hytale-web-manager/
├── backend/                    # API Node.js + Express
│   ├── src/
│   │   ├── index.js           # Point d'entrée
│   │   ├── routes/            # Routes API
│   │   ├── services/          # Services (Docker, joueurs)
│   │   └── websocket/         # WebSocket pour logs
│   ├── Dockerfile
│   └── package.json
│
├── frontend/                   # Interface React
│   ├── src/
│   │   ├── App.jsx            # Application principale
│   │   └── index.css          # Styles Tailwind
│   ├── Dockerfile
│   ├── nginx.conf
│   └── package.json
│
├── hytale-server-wrapper/      # Wrapper de contrôle serveur
│   ├── Dockerfile             # Extension de enesbakis/hytale-docker
│   ├── wrapper.sh             # Script de gestion du processus
│   └── control-server.sh      # Script de contrôle externe
│
├── data/                       # Données du serveur Hytale
│   ├── HytaleServer.jar
│   ├── Assets.zip
│   ├── universe/              # Monde sauvegardé
│   └── ...
│
├── docker-compose.yml          # Orchestration des conteneurs
├── .env.example               # Configuration exemple
└── README.md
```

## 🔧 Configuration Avancée

### Variables d'environnement

Éditez le fichier `.env` :

```bash
# Mémoire allouée au serveur
MEMORY=4G

# Port du serveur (UDP)
SERVER_PORT=5520

# Timezone
TZ=Europe/Paris

# Activer le cache AOT pour démarrage rapide
ENABLE_AOT=false

# Options JVM supplémentaires
JVM_OPTS=-XX:+UseG1GC
```

### Personnaliser les ports

Modifiez le `docker-compose.yml` :

```yaml
services:
  frontend:
    ports:
      - "8080:80"  # Changer le port frontend
  
  backend:
    ports:
      - "8000:4000"  # Changer le port backend
```

## 🎯 Utilisation

### Contrôler le serveur

- **Démarrer** : Cliquez sur le bouton "Démarrer" dans l'interface
- **Arrêter** : Cliquez sur "Arrêter" (arrêt propre avec `/stop`)
- **Redémarrer** : Cliquez sur "Redémarrer" (arrêt puis démarrage)

### Gérer les joueurs

1. La liste des joueurs connectés s'affiche en temps réel
2. Actions rapides disponibles :
   - **OP** : Promouvoir en opérateur
   - **Kick** : Expulser du serveur
   - **Ban** : Bannir définitivement

### Console interactive

Tapez vos commandes dans la console (doivent commencer par `/`) :

```
/list
/time set day
/gamemode creative PlayerName
/tp PlayerName 0 100 0
```

### Logs en temps réel

Les logs du serveur sont affichés en temps réel dans la console. Les 50 dernières lignes sont visibles, et s'actualisent automatiquement.

## 🐳 Commandes Docker Utiles

```bash
# Voir les logs du backend
docker compose logs -f backend

# Voir les logs du serveur Hytale
docker compose logs -f hytale-server

# Redémarrer un service
docker compose restart backend

# Arrêter tous les services
docker compose down

# Reconstruire les images
docker compose build --no-cache
```

## 🔒 Sécurité

⚠️ **Important** : Cette application est conçue pour un usage local/homelab. Pour une utilisation en production :

1. **Ajouter une authentification** : Implémenter un système de login
2. **HTTPS** : Utiliser un reverse proxy (nginx, Traefik) avec SSL
3. **Firewall** : Restreindre l'accès aux ports 3000 et 4000
4. **Variables d'environnement** : Ne jamais commiter le fichier `.env`

## 📊 API Endpoints

### Serveur

- `GET /api/server/status` - Statut du serveur
- `GET /api/server/stats` - Statistiques (CPU, RAM)
- `POST /api/server/start` - Démarrer le serveur
- `POST /api/server/stop` - Arrêter le serveur
- `POST /api/server/restart` - Redémarrer le serveur
- `GET /api/server/logs?lines=100` - Récupérer les logs

### Joueurs

- `GET /api/players` - Liste des joueurs connectés
- `POST /api/players/:name/kick` - Expulser un joueur
- `POST /api/players/:name/ban` - Bannir un joueur
- `POST /api/players/:name/op` - Promouvoir en opérateur

### Commandes

- `POST /api/commands/execute` - Exécuter une commande

### WebSocket

- `ws://localhost:4000/ws/logs` - Stream des logs en temps réel

## 🐛 Dépannage

### Le serveur ne démarre pas

1. Vérifiez que `HytaleServer.jar` et `Assets.zip` sont dans `/data`
2. Consultez les logs : `docker compose logs hytale-server`
3. Vérifiez les permissions : `ls -la data/`

### Impossible de se connecter à l'interface

1. Vérifiez que les conteneurs sont lancés : `docker compose ps`
2. Testez l'API : `curl http://localhost:4000/api/health`
3. Vérifiez les logs du backend : `docker compose logs backend`

### Les logs ne s'affichent pas

1. Vérifiez la connexion WebSocket dans la console navigateur (F12)
2. Redémarrez le backend : `docker compose restart backend`

### Erreur "Cannot connect to Docker daemon"

Le backend a besoin d'accéder au socket Docker :

```bash
# Vérifier les permissions
ls -la /var/run/docker.sock

# Ajouter votre utilisateur au groupe docker (Linux)
sudo usermod -aG docker $USER
```

## 🤝 Contribution

Les contributions sont les bienvenues ! Pour contribuer :

1. Fork le projet
2. Créez une branche (`git checkout -b feature/amazing-feature`)
3. Commit vos changements (`git commit -m 'Add amazing feature'`)
4. Push vers la branche (`git push origin feature/amazing-feature`)
5. Ouvrez une Pull Request

## 📝 TODO / Améliorations Futures

- [ ] Authentification utilisateur (JWT)
- [ ] Backup automatique du monde
- [ ] Planification de tâches (restart automatique)
- [ ] Graphiques de performance (historique CPU/RAM)
- [ ] Support multi-serveurs
- [ ] Notifications Discord/Webhook
- [ ] Éditeur de fichiers de configuration
- [ ] Gestion des mods/plugins

## 📄 Licence

Ce projet est sous licence MIT. Voir le fichier [LICENSE](LICENSE) pour plus de détails.

## 🙏 Remerciements

- [enesbakis/hytale-docker](https://github.com/enesbakis/hytale-docker) pour le conteneur Hytale de base
- La communauté Hytale pour les tests et retours
- Tous les contributeurs du projet

## 📧 Support

Pour toute question ou problème :

- Ouvrez une [issue](https://github.com/votre-username/hytale-web-manager/issues)
- Consultez les [discussions](https://github.com/votre-username/hytale-web-manager/discussions)

---

**Développé avec ❤️ pour la communauté Hytale**