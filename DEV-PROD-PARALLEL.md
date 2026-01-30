# 🔀 Guide Dev/Prod Simultanés

Ce guide explique comment faire tourner les environnements dev et production en parallèle sur le même serveur.

## 📊 Architecture avec ports séparés

```
┌─────────────────────────────────────────────────────┐
│                  Serveur Linux                      │
│                                                      │
│  ┌────────────────────┐    ┌───────────────────┐  │
│  │  PRODUCTION        │    │  DEVELOPPEMENT    │  │
│  │  (main)            │    │  (dev)            │  │
│  │                    │    │                   │  │
│  │  Frontend :3000    │    │  Frontend :3001   │  │
│  │  Backend  :4000    │    │  Backend  :4001   │  │
│  │  Hytale   :5520    │    │  Hytale   :5521   │  │
│  │                    │    │                   │  │
│  │  data/             │    │  data-dev/        │  │
│  └────────────────────┘    └───────────────────┘  │
└─────────────────────────────────────────────────────┘
```

## 🎯 Ports utilisés

| Service | Production (main) | Développement (dev) |
|---------|-------------------|---------------------|
| Frontend | 3000 | 3001 |
| Backend API | 4000 | 4001 |
| Serveur Hytale | 5520/UDP | 5521/UDP |
| WebSocket | 4000/ws | 4001/ws |

## 📁 Répertoires séparés

| Type | Production | Développement |
|------|------------|---------------|
| Données serveur | `./data/` | `./data-dev/` |
| Backups | `./backups/` | `./backups-dev/` |
| Conteneurs | `hytale-server`, `backend`, `frontend` | `hytale-server-dev`, `backend-dev`, `frontend-dev` |
| Réseau Docker | `hytale-network` | `hytale-network-dev` |
| Volumes | `oauth-shared` | `oauth-shared-dev` |

## 🚀 Démarrage des environnements

### Production (main)

```bash
cd ~/hytale-web-manager
git checkout main
git pull origin main

# Utiliser la config prod
cp .env.example .env
nano .env  # Configurer pour prod

# Démarrer avec docker-compose.yml par défaut
docker compose up -d

# OU utiliser le script
./switch-env.sh prod
```

### Développement (dev)

```bash
cd ~/hytale-web-manager
git checkout dev
git pull origin dev

# Le script gère tout automatiquement
./switch-env.sh dev

# OU manuellement
cp .env.dev .env
docker compose -f docker-compose.dev.yml up -d
```

## 🔧 Commandes utiles

### Production

```bash
# Makefile standard
make start          # Démarrer prod
make stop           # Arrêter prod
make logs           # Logs prod
make status         # Statut prod
make health         # Santé prod

# Docker Compose
docker compose ps
docker compose logs -f
docker compose restart backend
```

### Développement

```bash
# Makefile dev
make start-dev      # Démarrer dev
make stop-dev       # Arrêter dev
make logs-dev       # Logs dev
make status-dev     # Statut dev
make health-dev     # Santé dev

# Docker Compose dev
docker compose -f docker-compose.dev.yml ps
docker compose -f docker-compose.dev.yml logs -f
docker compose -f docker-compose.dev.yml restart backend-dev
```

## 🔄 Workflow complet

### Scénario : Développer une nouvelle fonctionnalité

**Étape 1 : Sur Windows - Développement local**
```bash
cd hytale-web-manager

# Créer feature branch
git checkout dev
git pull origin dev
git checkout -b feature/nouvelle-fonctionnalite

# Développer et tester localement
# (modifications de code)

# Commiter
git add .
git commit -m "feat: Nouvelle fonctionnalité"
git push -u origin feature/nouvelle-fonctionnalite
```

**Étape 2 : Sur serveur - Tester en dev**
```bash
ssh serveur
cd ~/hytale-web-manager

# Récupérer la feature branch
git fetch origin
git checkout feature/nouvelle-fonctionnalite

# Déployer en dev (si prod tourne déjà)
./switch-env.sh dev

# Tester sur http://IP-SERVEUR:3001
```

**Étape 3 : Sur Windows - Merger dans dev**
```bash
# Si tests OK sur serveur
git checkout dev
git merge feature/nouvelle-fonctionnalite
git push origin dev
```

**Étape 4 : Sur serveur - Valider en dev**
```bash
# Mettre à jour dev
git checkout dev
git pull origin dev

# Redéployer dev
docker compose -f docker-compose.dev.yml down
docker compose -f docker-compose.dev.yml build --no-cache
docker compose -f docker-compose.dev.yml up -d

# Tester à nouveau
make health-dev
```

**Étape 5 : Sur Windows - Merger dans main**
```bash
# Une fois validé en dev
git checkout main
git merge dev

# Tag de version
git tag -a v1.2.0 -m "Release v1.2.0"
git push origin main --tags
```

**Étape 6 : Sur serveur - Déployer en prod**
```bash
# Déployer la nouvelle version
git checkout main
git pull origin main

# Basculer sur prod (arrête dev automatiquement)
./switch-env.sh prod

# Vérifier
make health
```

## 🎮 Accès aux serveurs de jeu

### Production
```
IP: votre-ip-serveur
Port: 5520/UDP
```

### Développement
```
IP: votre-ip-serveur
Port: 5521/UDP
```

**Important** : Ouvrir les deux ports dans le firewall !
```bash
sudo ufw allow 5520/udp  # Production
sudo ufw allow 5521/udp  # Développement
```

## 🌐 Accès aux interfaces web

### Production
- Interface : http://IP-SERVEUR:3000
- API : http://IP-SERVEUR:4000
- WebSocket : ws://IP-SERVEUR:4000/ws/logs

### Développement
- Interface : http://IP-SERVEUR:3001
- API : http://IP-SERVEUR:4001
- WebSocket : ws://IP-SERVEUR:4001/ws/logs

## 🔒 Sécurité - Firewall

Ouvrir uniquement les ports nécessaires :

```bash
# Production (toujours ouvert)
sudo ufw allow 3000/tcp   # Frontend prod
sudo ufw allow 4000/tcp   # Backend prod
sudo ufw allow 5520/udp   # Serveur Hytale prod

# Développement (temporaire, à fermer après tests)
sudo ufw allow 3001/tcp   # Frontend dev
sudo ufw allow 4001/tcp   # Backend dev
sudo ufw allow 5521/udp   # Serveur Hytale dev

# Vérifier
sudo ufw status
```

**Recommandation** : Fermer les ports dev en production
```bash
sudo ufw delete allow 3001/tcp
sudo ufw delete allow 4001/tcp
sudo ufw delete allow 5521/udp
```

## 💾 Gestion des données

### Séparer les données prod/dev

Les données sont complètement séparées :
- Production : `./data/` (monde prod, config prod, auth prod)
- Développement : `./data-dev/` (monde dev, config dev, auth dev)

**Copier les données prod vers dev** (pour tester avec données réelles) :
```bash
# Arrêter dev
docker compose -f docker-compose.dev.yml down

# Copier données prod → dev
rm -rf data-dev/
cp -r data/ data-dev/

# Redémarrer dev
docker compose -f docker-compose.dev.yml up -d
```

**⚠️ ATTENTION** : Ne JAMAIS faire l'inverse (dev → prod) sans validation !

## 🐛 Dépannage

### Les deux environnements tournent en même temps

Vérifier les conteneurs :
```bash
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
```

Vous devriez voir :
```
NAMES                           STATUS      PORTS
hytale-server-dev              Up          0.0.0.0:5521->5520/udp
backend-dev                    Up          0.0.0.0:4001->4000/tcp
frontend-dev                   Up          0.0.0.0:3001->80/tcp
hytale-server                  Up          0.0.0.0:5520->5520/udp
backend                        Up          0.0.0.0:4000->4000/tcp
frontend                       Up          0.0.0.0:3000->80/tcp
```

### Conflit de ports

**Erreur** : `bind: address already in use`

**Solution** :
```bash
# Voir quel processus utilise le port
sudo lsof -i :3000
sudo lsof -i :4000

# Arrêter l'environnement qui pose problème
docker compose down  # Prod
# OU
docker compose -f docker-compose.dev.yml down  # Dev
```

### Container ne démarre pas

```bash
# Voir les logs du container spécifique
docker compose logs hytale-server-dev
docker compose -f docker-compose.dev.yml logs backend-dev

# Reconstruire l'image
docker compose -f docker-compose.dev.yml build --no-cache hytale-server-dev
```

### Espace disque insuffisant

Deux serveurs Hytale = double espace !

```bash
# Voir l'utilisation
df -h
du -sh data data-dev

# Nettoyer les anciennes images
docker system prune -a

# Supprimer les backups dev anciens
rm -rf backups-dev/hytale-backup-*
```

## 💡 Bonnes pratiques

### 1. Ne pas laisser dev tourner H24

Dev est pour les tests, pas pour jouer :
```bash
# Arrêter dev quand pas utilisé
docker compose -f docker-compose.dev.yml down
```

### 2. Backups séparés

```bash
# Backup prod
make backup

# Backup dev (si nécessaire)
BACKUP_DIR=./backups-dev ./scripts/backup.sh
```

### 3. Surveiller les ressources

```bash
# Voir la RAM/CPU utilisée
docker stats

# Si le serveur rame, arrêter dev
docker compose -f docker-compose.dev.yml down
```

### 4. Synchroniser dev avec main régulièrement

```bash
git checkout dev
git merge main
git push origin dev
```

## 📊 Monitoring

### Vérifier que tout fonctionne

```bash
# Health check prod
curl http://localhost:4000/api/health
curl http://localhost:4000/api/server/status

# Health check dev
curl http://localhost:4001/api/health
curl http://localhost:4001/api/server/status
```

### Dashboard rapide

```bash
# Créer un script de monitoring
cat > monitor.sh << 'EOF'
#!/bin/bash
echo "=== Hytale Manager - Status ==="
echo ""
echo "PRODUCTION:"
curl -s http://localhost:4000/api/server/status | python3 -m json.tool 2>/dev/null || echo "  ✗ Offline"
echo ""
echo "DEVELOPPEMENT:"
curl -s http://localhost:4001/api/server/status | python3 -m json.tool 2>/dev/null || echo "  ✗ Offline"
EOF

chmod +x monitor.sh
./monitor.sh
```

## 🎓 Résumé des commandes clés

| Action | Production | Développement |
|--------|------------|---------------|
| **Démarrer** | `./switch-env.sh prod` | `./switch-env.sh dev` |
| **Arrêter** | `docker compose down` | `docker compose -f docker-compose.dev.yml down` |
| **Logs** | `make logs` | `make logs-dev` |
| **Status** | `make status` | `make status-dev` |
| **Health** | `make health` | `make health-dev` |
| **Rebuild** | `docker compose build --no-cache` | `docker compose -f docker-compose.dev.yml build --no-cache` |

---

**Prêt à développer en parallèle ! 🚀**
