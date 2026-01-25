# ⚡ Quick Start - Hytale Web Manager

Guide de démarrage ultra-rapide en **5 minutes**.

## 🚀 Installation Express

### Prérequis
- Docker et Docker Compose installés
- Ports disponibles : 3000, 4000, 5520/UDP

### Option 1 : Script Automatique (Recommandé)

```bash
# 1. Cloner le projet
git clone https://github.com/mathgen44/hytale-web-manager.git
cd hytale-web-manager

# 2. Lancer le script d'installation
chmod +x install.sh
./install.sh

# C'est tout ! 🎉
```

### Option 2 : Installation Manuelle

```bash
# 1. Cloner
git clone https://github.com/mathgen44/hytale-web-manager.git
cd hytale-web-manager

# 2. Copier vos données Hytale existantes (optionnel)
cp -r /chemin/vers/votre/data ./data

# 3. Configuration
cp .env.example .env
# Éditer .env si nécessaire (optionnel)

# 4. Lancer tous les services
docker compose up -d

# 5. Accéder à l'interface
# http://localhost:3000
```

## 📦 Structure Minimale Requise

Pour que le serveur démarre, vous aurez besoin de :

```
hytale-web-manager/
├── data/
│   ├── HytaleServer.jar     # ⚠️ Requis (téléchargé automatiquement)
│   ├── Assets.zip           # ⚠️ Requis (téléchargé automatiquement)
│   └── universe/            # Optionnel (votre monde sauvegardé)
├── docker-compose.yml
└── .env
```

**Note** : Si `HytaleServer.jar` et `Assets.zip` ne sont pas présents, vous pourrez les télécharger via le bouton "Mettre à jour" dans l'interface web après authentification.

## ⚙️ Configuration Rapide (.env)

```bash
# Mémoire (ajuster selon votre machine)
MEMORY=4G              # 4GB recommandé minimum

# Port du serveur
SERVER_PORT=5520       # Port UDP pour Hytale

# Timezone
TZ=Europe/Paris        # Votre timezone
```

## 🔐 Première Authentification

Lors du premier démarrage, le serveur Hytale nécessite une authentification OAuth :

### 1. Vérifier les logs

```bash
docker compose logs -f hytale-server
```

Vous verrez un message comme :
```
===================================================================
DEVICE AUTHORIZATION
===================================================================
Visit: https://accounts.hytale.com/device
Enter code: XXXX-XXXX
===================================================================
```

### 2. S'authentifier

- Ouvrez le lien affiché : `https://accounts.hytale.com/device`
- Entrez le code à 8 caractères (ex: `ABCD-1234`)
- Connectez-vous avec votre compte Hytale
- Le serveur confirmera : `Authentication successful!`

### 3. Authentification sauvegardée

Votre token sera sauvegardé dans `data/auth.enc` et réutilisé automatiquement. Vous n'aurez plus besoin de vous authentifier à chaque démarrage.

## 🎮 Première Utilisation

### 1. Accéder à l'Interface Web

Ouvrez votre navigateur : **http://localhost:3000**

Vous verrez :
- 🟢 **Statut du serveur** : Running/Stopped
- 📊 **Statistiques** : CPU, RAM, Uptime
- 🏷️ **Version Hytale** : Version actuelle installée
- 👥 **Joueurs connectés** : Liste en temps réel
- 💻 **Console** : Logs en direct + commandes

### 2. Contrôler le Serveur

Trois boutons principaux :
- **▶️ Démarrer** : Lance le serveur Hytale
- **⏹️ Arrêter** : Arrête proprement le serveur
- **🔄 Redémarrer** : Redémarre le serveur

### 3. 🆕 Mise à Jour Automatique

Le bouton **"Mettre à jour"** permet de :
- Vérifier si une nouvelle version Hytale est disponible
- Télécharger et installer automatiquement
- Gérer l'authentification OAuth si nécessaire
- Redémarrer le serveur avec la nouvelle version

**Workflow automatique** :
1. Cliquez sur "Mettre à jour"
2. Si authentification nécessaire : popup avec lien cliquable
3. Le serveur se met à jour automatiquement
4. Redémarrage automatique

### 4. Se Connecter au Serveur

Dans le jeu Hytale :
- **IP** : `votre-ip` (ou `localhost` si en local)
- **Port** : `5520`

Pour connaître votre IP publique :
```bash
curl ifconfig.me
```

## 📱 Commandes Essentielles

### Via Makefile (recommandé)

```bash
make start          # Démarrer tous les services
make stop           # Arrêter tous les services
make restart        # Redémarrer tous les services
make logs           # Voir tous les logs
make logs-server    # Logs du serveur Hytale uniquement
make status         # Afficher le statut des conteneurs
make help           # Voir toutes les commandes disponibles
```

### Via Docker Compose

```bash
# Démarrer
docker compose up -d

# Arrêter
docker compose down

# Voir les logs
docker compose logs -f
docker compose logs -f hytale-server

# Redémarrer un service spécifique
docker compose restart hytale-server
docker compose restart backend

# Voir le statut
docker compose ps
```

## 🐛 Dépannage Express

### Le serveur ne démarre pas ?

```bash
# 1. Vérifier les logs
docker compose logs hytale-server | tail -50

# 2. Vérifier que les fichiers requis existent
ls -la data/HytaleServer.jar
ls -la data/Assets.zip

# 3. Corriger les permissions si nécessaire
sudo chown -R 1000:1000 data/
chmod -R 755 data/

# 4. Redémarrer
docker compose restart hytale-server
```

### L'interface web ne s'affiche pas ?

```bash
# 1. Vérifier que tous les conteneurs tournent
docker compose ps

# 2. Tester l'API backend
curl http://localhost:4000/api/health

# 3. Redémarrer le frontend si nécessaire
docker compose restart frontend
```

### Impossible de se connecter au serveur Hytale ?

```bash
# 1. Vérifier que le port est bien exposé
docker compose ps | grep 5520

# 2. Ouvrir le port dans le firewall (Linux)
sudo ufw allow 5520/udp

# 3. Vérifier la configuration du routeur
# Rediriger le port 5520/UDP vers votre machine
```

### Les logs ne s'affichent pas dans l'interface ?

```bash
# 1. Vérifier la connexion WebSocket
# F12 dans le navigateur → Onglet Network → WS

# 2. Redémarrer le backend
docker compose restart backend

# 3. Vérifier les logs backend
docker compose logs backend | tail -50
```

### La mise à jour échoue ?

```bash
# 1. Vérifier les logs de mise à jour
docker compose exec hytale-server cat /data/logs/update.log

# 2. Tester manuellement le downloader
docker compose exec hytale-server /usr/local/bin/hytale-downloader -print-version

# 3. Vérifier l'authentification
docker compose logs hytale-server | grep -i auth
```

## 🎯 Fonctionnalités Principales

### 🎛️ Contrôle du Serveur
- Start/Stop/Restart depuis l'interface web
- Monitoring CPU, RAM, Uptime en temps réel
- Affichage de la version Hytale actuelle

### 📊 Logs en Direct
- Streaming WebSocket sans latence
- Auto-scroll sur nouveaux messages
- Historique des 200 dernières lignes

### 👥 Gestion des Joueurs
- Liste des joueurs connectés avec heure
- Actions rapides : Kick, Ban, Op, Deop, Pardon
- Parsing automatique depuis les logs

### 💻 Console Interactive
- Envoi de commandes `/` depuis l'interface
- Historique des commandes
- Résultats visibles immédiatement

### 🔄 Mise à Jour Automatique 🆕
- Détection de nouvelles versions Hytale
- Téléchargement et installation en un clic
- Authentification OAuth automatisée
- Réutilisation des tokens d'authentification
- Rollback automatique en cas d'échec

## 📚 Documentation Complète

Pour plus de détails, consultez :

- **[README.md](README.md)** - Documentation complète du projet
- **[MIGRATION.md](MIGRATION.md)** - Migrer depuis un serveur existant
- **[CONTRIBUTING.md](CONTRIBUTING.md)** - Contribuer au projet
- **[PROJECT_STRUCTURE.md](PROJECT_STRUCTURE.md)** - Architecture détaillée

## 🔧 Configuration Avancée

### Personnaliser la mémoire

```bash
# .env
MEMORY=8G              # Plus de RAM = meilleures performances
ENABLE_AOT=true        # Cache pour démarrage plus rapide
```

### Personnaliser les ports

```yaml
# docker-compose.yml
services:
  frontend:
    ports:
      - "8080:80"      # Changer le port de l'interface web
  
  backend:
    ports:
      - "8000:4000"    # Changer le port de l'API
  
  hytale-server:
    ports:
      - "25565:5520/udp"  # Changer le port du serveur
```

### Activer le cache AOT (démarrage rapide)

```bash
# .env
ENABLE_AOT=true
```

Après le premier démarrage, un fichier `.aot` sera créé, accélérant les redémarrages suivants.

## 🌟 Nouvelles Fonctionnalités v1.1.0

### Système de Mise à Jour Automatique ✨

**Ce qui a changé** :
- ✅ Bouton "Mettre à jour" dans l'interface
- ✅ Vérification automatique des nouvelles versions
- ✅ Téléchargement via `hytale-downloader` officiel
- ✅ Popup OAuth interactive si authentification requise
- ✅ Réutilisation intelligente du token d'authentification
- ✅ Workflow entièrement automatisé

**Comment l'utiliser** :
1. Cliquez sur "Mettre à jour" dans l'interface
2. Si une nouvelle version existe : téléchargement automatique
3. Si OAuth requis : popup avec lien cliquable apparaît
4. Une fois authentifié : installation et redémarrage automatiques

**Avantages** :
- Plus besoin de SSH pour mettre à jour
- Authentification sauvegardée pour les prochaines fois
- Zéro downtime manuel
- Rollback automatique en cas d'erreur

## 🆘 Besoin d'Aide ?

- 🐛 [Ouvrir une issue](https://github.com/mathgen44/hytale-web-manager/issues)
- 💬 [Discussions](https://github.com/mathgen44/hytale-web-manager/discussions)
- 📖 Lire la [documentation complète](README.md)

## 🎓 Concepts Clés

### Architecture
- **Frontend** : Interface web React + Tailwind (port 3000)
- **Backend** : API Node.js + WebSocket (port 4000)
- **Serveur Hytale** : Conteneur Docker avec wrapper de contrôle (port 5520/UDP)

### Données Persistantes
Toutes les données du serveur sont dans `./data/` :
- Monde sauvegardé (`universe/`)
- Configuration (`config.json`)
- Token d'authentification (`auth.enc`)
- Logs (`logs/`)

### Backup
Vos données sont précieuses ! Pour créer un backup :
```bash
make backup
```

Les backups sont sauvegardés dans `./backups/` avec horodatage.

---

<div align="center">

**Vous êtes prêt ! Bon jeu ! 🎮**

[⭐ Star ce projet](https://github.com/mathgen44/hytale-web-manager) • [📖 Documentation complète](README.md)

**Développé avec ❤️ par Claude AI pour la communauté Hytale**

</div>
