# 🤝 Contribuer à Hytale Web Manager

Merci de votre intérêt pour contribuer à Hytale Web Manager ! Ce guide vous aidera à démarrer.

## 📋 Table des Matières

- [Code de Conduite](#code-de-conduite)
- [Comment Contribuer](#comment-contribuer)
- [Configuration de Développement](#configuration-de-développement)
- [Structure du Projet](#structure-du-projet)
- [Standards de Code](#standards-de-code)
- [Tests](#tests)
- [Processus de Pull Request](#processus-de-pull-request)

## 📜 Code de Conduite

En participant à ce projet, vous acceptez de respecter notre code de conduite :

- Soyez respectueux et inclusif
- Acceptez les critiques constructives
- Concentrez-vous sur ce qui est le mieux pour la communauté
- Faites preuve d'empathie envers les autres membres

## 🚀 Comment Contribuer

### Signaler des Bugs

Les bugs sont suivis via [GitHub Issues](https://github.com/votre-username/hytale-web-manager/issues).

Avant de créer un bug report :
- Vérifiez qu'il n'existe pas déjà
- Collectez les informations nécessaires (logs, configuration, OS)

Template de bug report :
```markdown
**Description du bug**
Description claire et concise du problème.

**Comment Reproduire**
1. Aller sur '...'
2. Cliquer sur '...'
3. Voir l'erreur

**Comportement Attendu**
Ce qui devrait se passer normalement.

**Logs**
```
Collez les logs pertinents ici
```

**Environnement**
- OS: [ex: Ubuntu 22.04]
- Docker: [ex: 24.0.7]
- Version du projet: [ex: 1.0.0]
```

### Proposer des Fonctionnalités

Les nouvelles fonctionnalités sont également suivies via GitHub Issues.

Template de feature request :
```markdown
**Problème à Résoudre**
Description du problème que cette fonctionnalité résoudrait.

**Solution Proposée**
Description de la fonctionnalité que vous souhaitez voir.

**Alternatives Considérées**
Autres solutions envisagées.

**Contexte Additionnel**
Tout autre contexte utile.
```

### Contribuer au Code

1. **Fork** le projet
2. **Clone** votre fork
3. **Créez une branche** pour votre fonctionnalité
4. **Committez** vos changements
5. **Push** vers votre fork
6. **Ouvrez une Pull Request**

## 🛠️ Configuration de Développement

### Prérequis

- Node.js 20+
- Docker & Docker Compose
- Git
- Un éditeur de code (VS Code recommandé)

### Installation Locale

```bash
# Cloner le repo
git clone https://github.com/votre-username/hytale-web-manager.git
cd hytale-web-manager

# Backend
cd backend
npm install
npm run dev

# Frontend (nouveau terminal)
cd frontend
npm install
npm run dev

# Serveur Hytale (nouveau terminal)
cd hytale-server-wrapper
docker build -t hytale-wrapper .
docker run -v ./data:/data hytale-wrapper
```

### Variables d'Environnement de Dev

Backend `.env` :
```bash
PORT=4000
HYTALE_CONTAINER_NAME=hytale-server
NODE_ENV=development
```

Frontend `.env` :
```bash
VITE_API_URL=http://localhost:4000
VITE_WS_URL=ws://localhost:4000
```

## 📁 Structure du Projet

```
hytale-web-manager/
├── backend/              # API Node.js
│   ├── src/
│   │   ├── routes/      # Endpoints API
│   │   ├── services/    # Logique métier
│   │   └── websocket/   # WebSocket handlers
│   └── tests/           # Tests backend
│
├── frontend/            # Application React
│   ├── src/
│   │   ├── components/  # Composants React
│   │   └── services/    # API clients
│   └── tests/           # Tests frontend
│
└── hytale-server-wrapper/  # Extension Docker
    ├── wrapper.sh          # Script principal
    └── control-server.sh   # Script de contrôle
```

## 📝 Standards de Code

### JavaScript/React

- Utiliser ES6+ moderne
- Préférer les fonctions fléchées
- Utiliser async/await plutôt que Promises
- Hooks React pour la logique de composant
- Nommer les composants en PascalCase
- Nommer les fichiers en camelCase

Exemple :
```javascript
// ✅ Bon
const ServerStatus = () => {
  const [status, setStatus] = useState('loading');
  
  useEffect(() => {
    fetchStatus();
  }, []);
  
  return <div>{status}</div>;
};

// ❌ Mauvais
function server_status() {
  var status = 'loading';
  return <div>{status}</div>;
}
```

### CSS/Tailwind

- Utiliser Tailwind autant que possible
- Classes responsives : `sm:`, `md:`, `lg:`
- Éviter le CSS inline sauf nécessité

```jsx
// ✅ Bon
<button className="px-4 py-2 bg-blue-500 hover:bg-blue-600 rounded">
  Click
</button>

// ❌ Mauvais
<button style={{padding: '8px 16px', backgroundColor: 'blue'}}>
  Click
</button>
```

### Bash Scripts

- Toujours `set -e` en début de script
- Utiliser des variables en MAJUSCULES
- Commenter les sections importantes
- Gérer les erreurs proprement

```bash
#!/bin/bash
set -e

# Configuration
CONTAINER_NAME="hytale-server"

# Fonction avec gestion d'erreur
start_server() {
    if ! docker start "$CONTAINER_NAME"; then
        echo "Erreur: Impossible de démarrer le serveur"
        return 1
    fi
}
```

## 🧪 Tests

### Backend

```bash
cd backend
npm test
npm run test:coverage
```

### Frontend

```bash
cd frontend
npm test
npm run test:coverage
```

### Tests E2E

```bash
# Lancer tous les services
docker compose up -d

# Exécuter les tests
npm run test:e2e
```

## 🔄 Processus de Pull Request

### Checklist Avant PR

- [ ] Le code suit les standards du projet
- [ ] Les tests passent (`npm test`)
- [ ] Le code est documenté (JSDoc pour fonctions complexes)
- [ ] Le README est mis à jour si nécessaire
- [ ] Les commits sont clairs et descriptifs
- [ ] La branche est à jour avec `main`

### Template de Pull Request

```markdown
## Description
Description concise des changements.

## Type de Changement
- [ ] Bug fix (non-breaking change)
- [ ] Nouvelle fonctionnalité (non-breaking change)
- [ ] Breaking change (changement majeur)
- [ ] Documentation

## Comment Tester
1. Étape 1
2. Étape 2
3. Vérifier que...

## Checklist
- [ ] Tests ajoutés/mis à jour
- [ ] Documentation mise à jour
- [ ] Code review effectué
- [ ] Pas de warnings de linting

## Screenshots (si applicable)
```

### Conventions de Commit

Utiliser [Conventional Commits](https://www.conventionalcommits.org/) :

```
feat: ajouter l'export des logs en CSV
fix: corriger le reconnect WebSocket
docs: mettre à jour le guide d'installation
style: formater le code avec prettier
refactor: simplifier la gestion des états
test: ajouter tests pour l'API players
chore: mettre à jour les dépendances
```

### Processus de Review

1. **Automated checks** : Tests, linting, build
2. **Code review** : Au moins 1 approbation requise
3. **Testing** : Vérification manuelle si nécessaire
4. **Merge** : Squash and merge vers `main`

## 🎯 Priorités Actuelles

### Fonctionnalités Recherchées

- [ ] Authentification utilisateur (JWT)
- [ ] Backup automatique du monde
- [ ] Graphiques de performance
- [ ] Support multi-serveurs
- [ ] Notifications Discord
- [ ] Éditeur de configuration

### Bugs Connus

Consultez les [issues labelées "bug"](https://github.com/votre-username/hytale-web-manager/labels/bug).

## 📞 Questions ?

- Ouvrir une [discussion](https://github.com/votre-username/hytale-web-manager/discussions)
- Poser une question dans les issues avec le label "question"
- Rejoindre notre Discord (lien à venir)

## 🙏 Remerciements

Merci à tous les contributeurs qui aident à améliorer Hytale Web Manager !

---

**Prêt à contribuer ? Forkez le projet et codez ! 🚀**