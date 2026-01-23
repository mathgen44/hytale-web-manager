# ⚡ Quick Start - Hytale Web Manager

Guide de démarrage ultra-rapide en 5 minutes.

## 🚀 Installation Express

### Option 1 : Script Automatique (Recommandé)

```bash
# Cloner le projet
git clone https://github.com/votre-username/hytale-web-manager.git
cd hytale-web-manager

# Lancer le script d'installation
chmod +x install.sh
./install.sh

# C'est tout ! 🎉
```

### Option 2 : Manuel

```bash
# 1. Cloner
git clone https://github.com/votre-username/hytale-web-manager.git
cd hytale-web-manager

# 2. Copier vos données Hytale (si existantes)
cp -r /chemin/vers/votre/data ./data

# 3. Configuration
cp .env.example .env
# Éditer .env si nécessaire

# 4. Lancer
docker compose up -d

# 5. Accéder à l'interface
# http://localhost:3000
```

## 📦 Structure Minimale Requise

```
hytale-web-manager/
├── data/
│   ├── HytaleServer.jar     # ⚠️ Requis
│   ├── Assets.zip           # ⚠️ Requis
│   └── universe/            # Optionnel (votre monde)
├── docker-compose.yml
└── .env
```

## ⚙️ Configuration Rapide (.env)

```bash
# Mémoire (ajuster selon votre machine)
MEMORY=4G

# Port du serveur
SERVER_PORT=5520

# Timezone
TZ=Europe/Paris
```

## 🎮 Première Utilisation

### 1. Authentification

Lors du premier démarrage :

```bash
# Voir les logs
docker compose logs -f hytale-server

# Vous verrez :
# Visit: https://oauth.accounts.hytale.com/oauth2/device/verify
# Enter code: XXXX-XXXX

# Suivre le lien et entrer le code
```

### 2. Accéder à l'Interface

Ouvrez **http://localhost:3000**

Vous verrez :
- 🟢 Statut du serveur
- 📊 Statistiques CPU/RAM
- 👥 Joueurs connectés
- 💻 Console de logs
- 🎮 Contrôles (Start/Stop/Restart)

### 3. Se Connecter au Serveur

Dans le jeu Hytale :
- IP : `votre-ip`
- Port : `5520`

## 📱 Commandes Essentielles

```bash
# Démarrer tout
docker compose up -d

# Voir les logs
docker compose logs -f

# Arrêter tout
docker compose down

# Redémarrer un service
docker compose restart hytale-server

# Voir le statut
docker compose ps

# Reconstruire après modif
docker compose build --no-cache
```

## 🐛 Dépannage Express

### Le serveur ne démarre pas ?

```bash
# Vérifier les logs
docker compose logs hytale-server

# Vérifier que les fichiers sont présents
ls -la data/

# Corriger les permissions
sudo chown -R 1000:1000 data/
```

### L'interface ne s'affiche pas ?

```bash
# Vérifier que les conteneurs tournent
docker compose ps

# Redémarrer le frontend
docker compose restart frontend

# Tester l'API
curl http://localhost:4000/api/health
```

### Impossible de se connecter au serveur ?

```bash
# Vérifier le port
docker compose ps | grep 5520

# Vérifier le firewall
sudo ufw allow 5520/udp

# Tester depuis l'hôte
nc -u -v localhost 5520
```

## 🎯 Prochaines Étapes

1. **Personnaliser** : Modifier le `.env` selon vos besoins
2. **Sécuriser** : Ajouter un reverse proxy avec SSL
3. **Automatiser** : Configurer des backups automatiques
4. **Monitorer** : Consulter les statistiques régulièrement

## 📚 Documentation Complète

Pour plus de détails :
- [README.md](README.md) - Documentation complète
- [MIGRATION.md](MIGRATION.md) - Migrer depuis un serveur existant
- [CONTRIBUTING.md](CONTRIBUTING.md) - Contribuer au projet

## ❓ Besoin d'Aide ?

- 🐛 [Ouvrir une issue](https://github.com/votre-username/hytale-web-manager/issues)
- 💬 [Discussions](https://github.com/votre-username/hytale-web-manager/discussions)
- 📖 Lire la [documentation complète](README.md)

---

**Vous êtes prêt ! Bon jeu ! 🎮**