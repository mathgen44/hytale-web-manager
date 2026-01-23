.PHONY: help install start stop restart status logs logs-server logs-backend logs-frontend build clean backup restore shell-server shell-backend dev-backend dev-frontend

# Variables
COMPOSE := docker compose
DATA_DIR := ./data
BACKUP_DIR := ./backups

# Couleurs
RED := \033[0;31m
GREEN := \033[0;32m
YELLOW := \033[1;33m
BLUE := \033[0;34m
NC := \033[0m # No Color

help: ## Afficher l'aide
	@echo "$(BLUE)Hytale Web Manager - Commandes Disponibles$(NC)"
	@echo ""
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "  $(GREEN)%-20s$(NC) %s\n", $$1, $$2}'
	@echo ""

install: ## Installer et configurer le projet
	@echo "$(BLUE)Installation de Hytale Web Manager...$(NC)"
	@chmod +x install.sh
	@./install.sh

start: ## Démarrer tous les services
	@echo "$(GREEN)Démarrage des services...$(NC)"
	@$(COMPOSE) up -d
	@echo "$(GREEN)✓ Services démarrés$(NC)"
	@$(MAKE) status

stop: ## Arrêter tous les services
	@echo "$(YELLOW)Arrêt des services...$(NC)"
	@$(COMPOSE) down
	@echo "$(YELLOW)✓ Services arrêtés$(NC)"

restart: ## Redémarrer tous les services
	@echo "$(BLUE)Redémarrage des services...$(NC)"
	@$(COMPOSE) restart
	@echo "$(GREEN)✓ Services redémarrés$(NC)"

status: ## Afficher le statut des services
	@echo "$(BLUE)Statut des services:$(NC)"
	@$(COMPOSE) ps

logs: ## Voir tous les logs
	@$(COMPOSE) logs -f

logs-server: ## Voir les logs du serveur Hytale
	@$(COMPOSE) logs -f hytale-server

logs-backend: ## Voir les logs du backend
	@$(COMPOSE) logs -f backend

logs-frontend: ## Voir les logs du frontend
	@$(COMPOSE) logs -f frontend

build: ## Reconstruire les images Docker
	@echo "$(BLUE)Reconstruction des images...$(NC)"
	@$(COMPOSE) build --no-cache
	@echo "$(GREEN)✓ Images reconstruites$(NC)"

clean: ## Nettoyer les containers et images
	@echo "$(YELLOW)Nettoyage...$(NC)"
	@$(COMPOSE) down -v
	@docker system prune -f
	@echo "$(GREEN)✓ Nettoyage terminé$(NC)"

backup: ## Créer un backup du serveur
	@echo "$(BLUE)Création d'un backup...$(NC)"
	@mkdir -p $(BACKUP_DIR)
	@chmod +x scripts/backup.sh
	@./scripts/backup.sh $(BACKUP_DIR)

restore: ## Restaurer depuis un backup (usage: make restore BACKUP=file.tar.gz)
	@if [ -z "$(BACKUP)" ]; then \
		echo "$(RED)Erreur: Spécifiez un fichier de backup$(NC)"; \
		echo "Usage: make restore BACKUP=./backups/hytale-backup-xxx.tar.gz"; \
		exit 1; \
	fi
	@chmod +x scripts/restore.sh
	@./scripts/restore.sh $(BACKUP)

shell-server: ## Accéder au shell du conteneur serveur
	@$(COMPOSE) exec hytale-server sh

shell-backend: ## Accéder au shell du conteneur backend
	@$(COMPOSE) exec backend sh

dev-backend: ## Lancer le backend en mode développement
	@cd backend && npm run dev

dev-frontend: ## Lancer le frontend en mode développement
	@cd frontend && npm run dev

update: ## Mettre à jour le projet depuis Git
	@echo "$(BLUE)Mise à jour depuis Git...$(NC)"
	@git pull
	@echo "$(GREEN)✓ Projet mis à jour$(NC)"
	@echo "$(YELLOW)N'oubliez pas de rebuild: make build$(NC)"

test: ## Lancer les tests
	@echo "$(BLUE)Lancement des tests...$(NC)"
	@cd backend && npm test
	@cd frontend && npm test
	@echo "$(GREEN)✓ Tests terminés$(NC)"

health: ## Vérifier la santé de l'application
	@echo "$(BLUE)Vérification de la santé...$(NC)"
	@echo ""
	@echo "$(BLUE)Backend API:$(NC)"
	@curl -s http://localhost:4000/api/health | python3 -m json.tool || echo "$(RED)✗ Backend inaccessible$(NC)"
	@echo ""
	@echo "$(BLUE)Frontend:$(NC)"
	@curl -s -o /dev/null -w "%{http_code}" http://localhost:3000 | grep -q 200 && echo "$(GREEN)✓ Frontend accessible$(NC)" || echo "$(RED)✗ Frontend inaccessible$(NC)"
	@echo ""
	@echo "$(BLUE)Serveur Hytale:$(NC)"
	@$(COMPOSE) exec hytale-server sh -c "/control-server.sh status" || echo "$(RED)✗ Serveur inaccessible$(NC)"

info: ## Afficher les informations du projet
	@echo "$(BLUE)═══════════════════════════════════════$(NC)"
	@echo "$(GREEN)  Hytale Web Manager$(NC)"
	@echo "$(BLUE)═══════════════════════════════════════$(NC)"
	@echo ""
	@echo "$(BLUE)URLs:$(NC)"
	@echo "  Frontend:  $(GREEN)http://localhost:3000$(NC)"
	@echo "  Backend:   $(GREEN)http://localhost:4000$(NC)"
	@echo "  Server:    $(GREEN)localhost:5520$(NC) (UDP)"
	@echo ""
	@echo "$(BLUE)Données:$(NC)"
	@echo "  Data:      $(DATA_DIR)"
	@echo "  Backups:   $(BACKUP_DIR)"
	@echo ""
	@echo "$(BLUE)Commandes utiles:$(NC)"
	@echo "  make start      - Démarrer"
	@echo "  make logs       - Voir les logs"
	@echo "  make backup     - Créer un backup"
	@echo "  make help       - Voir toutes les commandes"
	@echo ""