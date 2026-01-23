# 🔄 Guide de Migration - Serveur Hytale Existant

Ce guide vous aide à migrer votre serveur Hytale existant (basé sur `enesbakis/hytale-docker`) vers Hytale Web Manager tout en conservant :

- ✅ Votre token d'authentification
- ✅ Votre monde sauvegardé
- ✅ Toutes vos configurations
- ✅ Vos mods et plugins

## 📦 Prérequis

1. Votre serveur Hytale actuel doit être arrêté
2. Sauvegardez vos données avant toute manipulation
3. Notez le nom de votre conteneur actuel

## 🚀 Étapes de Migration

### Étape 1 : Sauvegarder vos données

```bash
# Identifier votre conteneur Hytale actuel
docker ps -a | grep hytale

# Sauvegarder le dossier data
docker cp votre-conteneur-hytale:/data ./backup-hytale-data

# OU si vous avez un volume monté
cp -r /chemin/vers/votre/data ./backup-hytale-data
```

### Étape 2 : Arrêter l'ancien serveur

```bash
# Arrêter le conteneur
docker stop votre-conteneur-hytale

# Optionnel : supprimer le conteneur (les données restent)
docker rm votre-conteneur-hytale
```

### Étape 3 : Cloner Hytale Web Manager

```bash
git clone https://github.com/votre-username/hytale-web-manager.git
cd hytale-web-manager
```

### Étape 4 : Copier vos données

```bash
# Créer le dossier data
mkdir -p data

# Copier toutes vos données sauvegardées
cp -r ../backup-hytale-data/* ./data/

# Vérifier que tout est là
ls -la data/
# Vous devriez voir :
# - HytaleServer.jar
# - Assets.zip
# - universe/ (votre monde)
# - oauth/ (vos tokens d'authentification)
# - logs/
# - mods/ (si vous avez des mods)
```

### Étape 5 : Configuration

```bash
# Copier le fichier de configuration
cp .env.example .env

# Éditer la configuration pour correspondre à votre ancienne config
nano .env
```

Ajustez les valeurs selon votre configuration précédente :

```bash
MEMORY=4G              # Même mémoire qu'avant
SERVER_PORT=5520       # Même port qu'avant
SERVER_HOST=0.0.0.0
TZ=Europe/Paris        # Votre timezone
ENABLE_AOT=false       # true si vous aviez le fichier .aot
```

### Étape 6 : Lancer le nouveau setup

```bash
# Construire et lancer tous les services
docker compose up -d

# Suivre les logs pour vérifier le démarrage
docker compose logs -f hytale-server
```

### Étape 7 : Vérification

1. **Vérifier que le serveur démarre** :
   ```bash
   docker compose logs hytale-server | grep "Server started"
   ```

2. **Accéder à l'interface web** :
   - Ouvrez http://localhost:3000
   - Vérifiez que le statut du serveur est "RUNNING"

3. **Tester la connexion au serveur** :
   - Connectez-vous depuis le jeu Hytale
   - Vérifiez que votre monde est là

4. **Vérifier l'authentification** :
   - Si le serveur demande une nouvelle authentification, c'est normal la première fois
   - Suivez le lien d'authentification dans les logs
   - Votre token sera sauvegardé automatiquement

## 🔍 Vérifications Post-Migration

### Checklist

- [ ] Le serveur Hytale démarre correctement
- [ ] L'interface web est accessible sur http://localhost:3000
- [ ] Les boutons start/stop/restart fonctionnent
- [ ] Les logs s'affichent en temps réel
- [ ] Vous pouvez vous connecter au serveur depuis le jeu
- [ ] Votre monde est intact
- [ ] Les joueurs peuvent rejoindre

### Commandes de diagnostic

```bash
# Vérifier que tous les conteneurs tournent
docker compose ps

# Logs du serveur Hytale
docker compose logs -f hytale-server

# Logs du backend
docker compose logs -f backend

# Statut via l'API
curl http://localhost:4000/api/server/status

# Tester le WebSocket des logs
curl -i -N -H "Connection: Upgrade" \
     -H "Upgrade: websocket" \
     -H "Sec-WebSocket-Version: 13" \
     -H "Sec-WebSocket-Key: test" \
     http://localhost:4000/ws/logs
```

## 🐛 Problèmes Courants

### Le serveur ne démarre pas

**Symptôme** : Le conteneur tourne mais le serveur reste "stopped"

**Solution** :
```bash
# Vérifier les logs
docker compose logs hytale-server

# Vérifier les permissions
ls -la data/
sudo chown -R 1000:1000 data/

# Redémarrer
docker compose restart hytale-server
```

### "Permission denied" sur le fichier JAR

**Solution** :
```bash
# Donner les bonnes permissions
chmod 644 data/HytaleServer.jar
chmod 644 data/Assets.zip
chmod 755 data/universe/
```

### Le monde ne charge pas

**Symptôme** : Le serveur démarre mais le monde est vide

**Solution** :
```bash
# Vérifier que le dossier universe existe
ls -la data/universe/

# Comparer avec votre backup
diff -r data/universe/ backup-hytale-data/universe/

# Si nécessaire, recopier
rm -rf data/universe/
cp -r backup-hytale-data/universe/ data/
```

### Authentification demandée à nouveau

**Symptôme** : Le serveur demande de s'authentifier alors que vous l'étiez déjà

**C'est normal** ! Suivez simplement le processus :
```bash
# Regarder les logs
docker compose logs -f hytale-server

# Copier le lien et le code
# Ouvrir le lien dans un navigateur
# Entrer le code

# Le token sera sauvegardé dans data/oauth/
```

## 🔄 Retour en Arrière (Rollback)

Si quelque chose ne fonctionne pas, vous pouvez revenir à votre configuration précédente :

```bash
# Arrêter le nouveau setup
cd hytale-web-manager
docker compose down

# Restaurer l'ancien conteneur
docker run -d \
  --name votre-conteneur-hytale \
  -p 5520:5520/udp \
  -v /chemin/vers/backup-hytale-data:/data \
  enesbakis/hytale-docker:latest

# Vérifier
docker logs -f votre-conteneur-hytale
```

## ✅ Validation de la Migration

Une fois la migration réussie :

1. **Testez toutes les fonctionnalités** :
   - Start/Stop/Restart
   - Logs en temps réel
   - Gestion des joueurs
   - Exécution de commandes

2. **Gardez votre backup** pendant quelques jours

3. **Supprimez l'ancien conteneur** :
   ```bash
   docker rm votre-conteneur-hytale
   ```

4. **Configurez des backups automatiques** (voir README.md)

## 📞 Besoin d'aide ?

Si vous rencontrez des problèmes lors de la migration :

1. Consultez les logs : `docker compose logs`
2. Vérifiez la checklist ci-dessus
3. Ouvrez une issue sur GitHub avec :
   - Votre configuration (.env)
   - Les logs d'erreur
   - Les étapes que vous avez suivies

---

**Migration réussie ? Profitez de votre nouvelle interface web ! 🎉**