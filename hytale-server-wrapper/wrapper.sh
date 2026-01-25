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
STATUS_FILE="/tmp/hytale-server.status"
CONTROL_PIPE="/tmp/server-control"

# Fonction pour mettre à jour le fichier de statut
update_status() {
    local status=$1
    local pid=${2:-0}
    echo "$status:$pid:$(date +%s)" > "$STATUS_FILE"
}

# Fonction pour démarrer le serveur
start_server() {
    if [ -f "$SERVER_PID_FILE" ]; then
        local pid=$(cat "$SERVER_PID_FILE")
        if kill -0 "$pid" 2>/dev/null; then
            log_warn "Le serveur est déjà en cours d'exécution (PID: $pid)"
            update_status "running" "$pid"
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
    SERVER_ARGS="--assets /data/Assets.zip"
    
    # Créer le pipe d'input pour les commandes (avec PID unique)
    INPUT_PIPE="/tmp/hytale_input_$$"
    mkfifo "$INPUT_PIPE"
    log_info "Pipe d'entrée créé: $INPUT_PIPE"
    
    # Démarrage du serveur en arrière-plan avec redirection du pipe vers stdin
    cd /data
    java $JVM_ARGS -jar "$SERVER_JAR" $SERVER_ARGS < "$INPUT_PIPE" 2>&1 &
    local server_pid=$!
    
    # Garder le pipe ouvert avec tail -f en arrière-plan
    # Cela évite que le pipe se ferme prématurément
    tail -f /dev/null > "$INPUT_PIPE" &
    local tail_pid=$!
    
    # Attendre un peu pour vérifier que le serveur démarre bien
    sleep 2
    
    if kill -0 "$server_pid" 2>/dev/null; then
        echo "$server_pid" > "$SERVER_PID_FILE"
        echo "$INPUT_PIPE" > "/tmp/hytale-input-pipe.path"
        update_status "running" "$server_pid"
        log_info "Serveur démarré avec le PID: $server_pid"
        log_info "Pipe d'entrée disponible: $INPUT_PIPE"
        return 0
    else
        log_error "Le serveur n'a pas pu démarrer"
        # Nettoyer le pipe
        kill $tail_pid 2>/dev/null || true
        rm -f "$INPUT_PIPE"
        update_status "stopped" "0"
        return 1
    fi
}

# Fonction pour arrêter le serveur
stop_server() {
    if [ ! -f "$SERVER_PID_FILE" ]; then
        log_warn "Le serveur n'est pas en cours d'exécution"
        update_status "stopped" "0"
        return 1
    fi
    
    local pid=$(cat "$SERVER_PID_FILE")
    
    if ! kill -0 "$pid" 2>/dev/null; then
        log_warn "Le serveur n'est pas en cours d'exécution (PID invalide: $pid)"
        rm -f "$SERVER_PID_FILE"
        update_status "stopped" "0"
        return 1
    fi
    
    log_info "Arrêt du serveur Hytale (PID: $pid)..."
    
    # Trouver et envoyer la commande /stop via le pipe
    INPUT_PIPE=$(cat /tmp/hytale-input-pipe.path 2>/dev/null)
    if [ -n "$INPUT_PIPE" ] && [ -p "$INPUT_PIPE" ]; then
        log_info "Envoi de la commande /stop via le pipe..."
        echo "/stop" > "$INPUT_PIPE" 2>/dev/null || true
        sleep 3
    fi
    
    # Envoi de SIGTERM si le serveur tourne encore
    if kill -0 "$pid" 2>/dev/null; then
        kill -TERM "$pid" 2>/dev/null || true
    fi
    
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
        sleep 1
    fi
    
    # Nettoyer les fichiers
    rm -f "$SERVER_PID_FILE"
    rm -f "/tmp/hytale-input-pipe.path"
    if [ -n "$INPUT_PIPE" ] && [ -p "$INPUT_PIPE" ]; then
        rm -f "$INPUT_PIPE"
    fi
    
    update_status "stopped" "0"
    log_info "Serveur arrêté"
    return 0
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
            update_status "running" "$pid"
            return 0
        else
            rm -f "$SERVER_PID_FILE"
            update_status "stopped" "0"
            return 1
        fi
    else
        update_status "stopped" "0"
        return 1
    fi
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

# Surveillance du serveur en arrière-plan
monitor_server() {
    while true; do
        sleep 5
        
        if [ -f "$SERVER_PID_FILE" ]; then
            local pid=$(cat "$SERVER_PID_FILE")
            if ! kill -0 "$pid" 2>/dev/null; then
                log_warn "Le serveur s'est arrêté de manière inattendue"
                rm -f "$SERVER_PID_FILE"
                rm -f "/tmp/hytale-input-pipe.path"
                update_status "stopped" "0"
            else
                update_status "running" "$pid"
            fi
        else
            update_status "stopped" "0"
        fi
    done
}

# Gestion des signaux
cleanup() {
    log_info "Signal reçu, arrêt du serveur..."
    stop_server
    exit 0
}

trap cleanup SIGTERM SIGINT

# Point d'entrée principal
main() {
    log_info "=== Hytale Server Wrapper ==="
    log_info "Version: 1.0.2 (avec support named pipe)"
    
    # Vérifier que le fichier JAR existe
    if [ ! -f "$SERVER_JAR" ]; then
        log_error "HytaleServer.jar introuvable dans /data"
        log_info "Veuillez placer HytaleServer.jar dans le dossier /data"
        update_status "error" "0"
        exit 1
    fi
    
    # Initialiser le fichier de statut
    update_status "stopped" "0"
    
    # Démarrer le moniteur de serveur en arrière-plan
    monitor_server &
    
    # Démarrer le listener de contrôle en arrière-plan
    control_listener &
    
    # Démarrer le serveur automatiquement
    log_info "Démarrage automatique du serveur..."
    start_server
    
    # Boucle principale - garder le conteneur actif
    log_info "Wrapper actif, en attente de commandes..."
    while true; do
        sleep 60
    done
}

# Lancer le wrapper
main
