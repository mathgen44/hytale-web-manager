# 🌿 Guide de Développement - Branche Dev

Ce guide explique comment utiliser la branche `dev` pour développer de nouvelles fonctionnalités.

## 🎯 Objectif

La branche `dev` permet de :
- Tester de nouvelles fonctionnalités avant de les merger dans `main`
- Éviter de casser la production
- Collaborer sur des fonctionnalités expérimentales
- Valider les changements via CI/CD avant merge

## 📁 Structure des branches

```
main (production)
  ↑
  └─ dev (développement)
       ↑
       └─ feature/nouvelle-fonctionnalite (feature branches)
```

## 🚀 Workflow de développement

### 1. Démarrer une nouvelle fonctionnalité

```bash
# Sur Windows - Se placer dans le projet
cd hytale-web-manager

# Vérifier qu'on est à jour avec dev
git checkout dev
git pull origin dev

# Créer une branche feature depuis dev
git checkout -b feature/ma-nouvelle-fonctionnalite

# Développer la fonctionnalité...
# (modifications de code)

# Commiter régulièrement
git add .
git commit -m "feat: Ajout de ma nouvelle fonctionnalité"

# Pousser la branche feature
git push -u origin feature/ma-nouvelle-fonctionnalite
```

### 2. Tester localement

```bash
# Utiliser la config dev
cp .env.dev .env

# Lancer les services
docker compose down
docker compose build --no-cache
docker compose up -d

# Vérifier les logs
docker compose logs -f

# Tester l'interface web
# http://localhost:3000
```

### 3. Merger dans dev

Une fois la fonctionnalité testée et validée localement :

```bash
# Se placer sur dev
git checkout dev
git pull origin dev

# Merger la feature
git merge feature/ma-nouvelle-fonctionnalite

# Résoudre les conflits si nécessaire
# (éditer les fichiers en conflit)
git add .
git commit -m "Merge feature/ma-nouvelle-fonctionnalite into dev"

# Pousser dev
git push origin dev

# GitHub Actions va automatiquement tester la branche dev
```

### 4. Déployer en dev sur le serveur

```bash
# Sur le serveur Linux
cd ~/hytale-web-manager

# Basculer sur dev
git checkout dev
git pull origin dev

# Utiliser la config dev
cp .env.dev .env

# Redéployer
docker compose down
docker compose build --no-cache
docker compose up -d

# Vérifier
docker compose ps
make health
```

### 5. Merger dev dans main (production)

Quand plusieurs fonctionnalités sont validées en dev :

```bash
# Sur Windows
git checkout main
git pull origin main

# Merger dev dans main
git merge dev

# Résoudre les conflits si nécessaire
git add .
git commit -m "Merge dev into main - Release v1.x.x"

# Pousser main
git push origin main

# Créer un tag de version
git tag -a v1.2.0 -m "Release v1.2.0 - Nouvelles fonctionnalités"
git push origin v1.2.0
```

### 6. Déployer en production

```bash
# Sur le serveur Linux
cd ~/hytale-web-manager

# Basculer sur main
git checkout main
git pull origin main

# Utiliser la config production
cp .env.example .env
nano .env  # Éditer selon la config prod

# Redéployer
docker compose down
docker compose build --no-cache
docker compose up -d

# Vérifier
docker compose ps
make health
```

## 🧪 Tests recommandés avant merge

### Tests manuels
- [ ] Interface web accessible et responsive
- [ ] Logs en temps réel fonctionnent
- [ ] Commandes start/stop/restart fonctionnent
- [ ] Détection des joueurs fonctionne
- [ ] Commandes admin (OP/Kick/Ban) fonctionnent
- [ ] Mise à jour automatique fonctionne (si modifiée)
- [ ] Aucune régression sur fonctionnalités existantes

### Tests automatisés (si configurés)
```bash
# Backend
cd backend
npm test
npm run lint

# Frontend
cd frontend
npm test
npm run build
```

## 🐛 Gestion des bugs en dev

Si un bug est trouvé en dev :

```bash
# Créer une branche fix depuis dev
git checkout dev
git checkout -b fix/correction-bug-x

# Corriger le bug
# (modifications de code)

# Commiter
git add .
git commit -m "fix: Correction du bug X"

# Tester localement
docker compose restart backend  # ou frontend, ou hytale-server

# Merger dans dev
git checkout dev
git merge fix/correction-bug-x
git push origin dev

# Supprimer la branche fix (optionnel)
git branch -d fix/correction-bug-x
git push origin --delete fix/correction-bug-x
```

## 🔄 Synchroniser dev avec main

Régulièrement, mettre à jour dev avec les derniers commits de main :

```bash
# Se placer sur dev
git checkout dev

# Récupérer les changements de main
git fetch origin main
git merge origin/main

# Résoudre les conflits si nécessaire
git add .
git commit -m "Sync dev with main"

# Pousser
git push origin dev
```

## 📊 Conventions de commit

Utiliser [Conventional Commits](https://www.conventionalcommits.org/) :

```
feat: Ajouter une nouvelle fonctionnalité
fix: Corriger un bug
docs: Mettre à jour la documentation
style: Formater le code (pas de changement fonctionnel)
refactor: Refactoriser du code
test: Ajouter ou modifier des tests
chore: Tâches de maintenance (dépendances, config, etc.)
```

Exemples :
```bash
git commit -m "feat: Ajouter bouton d'export des logs en CSV"
git commit -m "fix: Corriger détection des joueurs déconnectés"
git commit -m "docs: Mettre à jour README avec nouvelles commandes"
git commit -m "refactor: Simplifier le parsing des logs"
```

## 🚨 Checklist avant merge dev → main

- [ ] Tous les tests CI/CD passent
- [ ] Fonctionnalités testées manuellement en dev
- [ ] Documentation mise à jour (README, QUICKSTART, etc.)
- [ ] Fichier hytale-project-status.md à jour
- [ ] Aucun secret/credential dans le code
- [ ] .env.example à jour si nouvelles variables
- [ ] CHANGELOG.md mis à jour avec les changements

## 🎓 Commandes Git utiles

```bash
# Voir l'état actuel
git status

# Voir les différences
git diff

# Voir l'historique
git log --oneline --graph --all

# Annuler des changements non commités
git restore <file>
git restore .

# Annuler le dernier commit (garder les changements)
git reset --soft HEAD~1

# Créer un stash (sauvegarder temporairement des changements)
git stash
git stash pop  # Récupérer les changements

# Voir les branches
git branch -a

# Supprimer une branche locale
git branch -d <branch-name>

# Supprimer une branche distante
git push origin --delete <branch-name>
```

## 📚 Ressources

- [Git Book](https://git-scm.com/book/fr/v2)
- [GitHub Flow](https://docs.github.com/en/get-started/quickstart/github-flow)
- [Conventional Commits](https://www.conventionalcommits.org/)

---

**Bon développement ! 🚀**
