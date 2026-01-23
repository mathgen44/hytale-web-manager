#!/bin/bash

# Couleurs pour les logs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Variables
SERVER_JAR="/data/HytaleServer.jar"
SERVER_PID_FILE="/tmp/hytale-server.pid"
CONTROL_PIPE="/tmp/server-control"
SERVER_RUNNING=false

# Fonction pour démarrer le serveur
start_server() {
    if [ -f "$SERVER_PID_FILE" ]; then
        local pid=$(cat "$SERVER_PID_FILE")
        if kill -0 "$pid" 2>/dev/null; then
            log_warn "Le serveur est déjà en cours d'exécution (PID: $pid)"
            return 1
        fi
    fi

    log_info "Démarrage du serveur Hytale..."
    
    # Construction des arguments JVM
    JVM_ARGS=""
    
    if [ -n "$INIT_MEMORY" ]; then
        JVM_ARGS="$JVM_ARGS -Xms$INIT_MEMORY"
    fi
    
    if [ -n "$MAX_MEMORY" ]; then
        JVM_ARGS="$JVM_ARGS -Xmx$MAX_MEMORY"
    elif [ -n "$MEMORY" ]; then
        JVM_ARGS="$JVM_ARGS -Xmx$MEMORY"
    fi
    
    if [ "$ENABLE_AOT" = "true" ] && [ -f "/data/HytaleServer.aot" ]; then
        JVM_ARGS="$JVM_ARGS -XX:AOTCache=/data/HytaleServer.aot"
    fi
    
    if [ -n "$JVM_OPTS" ]; then
        JVM_ARGS="$JVM_ARGS $JVM_OPTS"
    fi
    
    # Arguments du serveur
    SERVER_ARGS=""
    
    if [ -n "$SERVER_HOST" ]; then
        SERVER_ARGS="$SERVER_ARGS --host=$SERVER_HOST"
    fi
    
    if [ -n "$SERVER_PORT" ]; then
        SERVER_ARGS="$SERVER_ARGS --port=$SERVER_PORT"
    fi
    
    if [ -n "$EXTRA_ARGS" ]; then
        SERVER_ARGS="$SERVER_ARGS $EXTRA_ARGS"
    fi
    
    # Démarrage du serveur en arrière-plan
    cd /data
    java $JVM_ARGS -jar "$SERVER_JAR" $SERVER_ARGS &
    local server_pid=$!
    
    echo "$server_pid" > "$SERVER_PID_FILE"
    SERVER_RUNNING=true
    
    log_info "Serveur démarré avec le PID: $server_pid"
}

# Fonction pour arrêter le serveur
stop_server() {
    if [ ! -f "$SERVER_PID_FILE" ]; then
        log_warn "Le serveur n'est pas en cours d'exécution"
        return 1
    fi
    
    local pid=$(cat "$SERVER_PID_FILE")
    
    if ! kill -0 "$pid" 2>/dev/null; then
        log_warn "Le serveur n'est pas en cours d'exécution (PID invalide: $pid)"
        rm -f "$SERVER_PID_FILE"
        SERVER_RUNNING=false
        return 1
    fi
    
    log_info "Arrêt du serveur Hytale (PID: $pid)..."
    
    # Envoi de la commande /stop au serveur
    echo "/stop" > "/proc/$pid/fd/0" 2>/dev/null || true
    
    # Attendre que le serveur s'arrête (max 30 secondes)
    local count=0
    while kill -0 "$pid" 2>/dev/null && [ $count -lt 30 ]; do
        sleep 1
        count=$((count + 1))
    done
    
    # Si le serveur ne s'est pas arrêté, le forcer
    if kill -0 "$pid" 2>/dev/null; then
        log_warn "Le serveur ne répond pas, arrêt forcé..."
        kill -9 "$pid" 2>/dev/null || true
    fi
    
    rm -f "$SERVER_PID_FILE"
    SERVER_RUNNING=false
    log_info "Serveur arrêté"
}

# Fonction pour redémarrer le serveur
restart_server() {
    log_info "Redémarrage du serveur..."
    stop_server
    sleep 2
    start_server
}

# Fonction pour obtenir le statut du serveur
get_status() {
    if [ -f "$SERVER_PID_FILE" ]; then
        local pid=$(cat "$SERVER_PID_FILE")
        if kill -0 "$pid" 2>/dev/null; then
            echo "running:$pid"
            return 0
        fi
    fi
    echo "stopped"
}

# Listener de commandes de contrôle
control_listener() {
    log_info "Listener de contrôle démarré"
    
    while true; do
        if read -r cmd < "$CONTROL_PIPE"; then
            log_info "Commande reçue: $cmd"
            
            case "$cmd" in
                start)
                    start_server
                    ;;
                stop)
                    stop_server
                    ;;
                restart)
                    restart_server
                    ;;
                status)
                    get_status
                    ;;
                *)
                    log_warn "Commande inconnue: $cmd"
                    ;;
            esac
        fi
    done
}

# Gestion des signaux
trap 'log_info "Signal reçu, arrêt du serveur..."; stop_server; exit 0' SIGTERM SIGINT

# Point d'entrée principal
main() {
    log_info "=== Hytale Server Wrapper ==="
    log_info "Version: 1.0.0"
    
    # Vérifier que le fichier JAR existe
    if [ ! -f "$SERVER_JAR" ]; then
        log_error "HytaleServer.jar introuvable dans /data"
        exit 1
    fi
    
    # Démarrer le listener de contrôle en arrière-plan
    control_listener &
    local listener_pid=$!
    
    # Démarrer le serveur automatiquement
    start_server
    
    # Boucle principale - garder le conteneur actif
    while true; do
        if [ -f "$SERVER_PID_FILE" ]; then
            local pid=$(cat "$SERVER_PID_FILE")
            if ! kill -0 "$pid" 2>/dev/null; then
                log_warn "Le serveur s'est arrêté de manière inattendue"
                SERVER_RUNNING=false
                rm -f "$SERVER_PID_FILE"
            fi
        fi
        
        sleep 5
    done
}

# Lancer le wrapper
main