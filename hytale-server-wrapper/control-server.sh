#!/bin/bash

# Script pour envoyer des commandes de contrôle au serveur
# Utilisé par le backend via docker exec

CONTROL_PIPE="/tmp/server-control"
STATUS_FILE="/tmp/hytale-server.status"
SERVER_PID_FILE="/tmp/hytale-server.pid"

if [ $# -eq 0 ]; then
    echo "Usage: $0 {start|stop|restart|status}"
    exit 1
fi

COMMAND=$1

# Fonction pour lire le statut depuis le fichier
read_status() {
    if [ -f "$STATUS_FILE" ]; then
        cat "$STATUS_FILE"
    else
        echo "stopped:0:0"
    fi
}

case "$COMMAND" in
    start)
        echo "start" > "$CONTROL_PIPE"
        sleep 1
        read_status
        ;;
    stop)
        echo "stop" > "$CONTROL_PIPE"
        sleep 1
        read_status
        ;;
    restart)
        echo "restart" > "$CONTROL_PIPE"
        sleep 3
        read_status
        ;;
	update)
        /update-server.sh
        ;;
    status)
        # Pour status, pas besoin d'envoyer au pipe, on lit directement le fichier
        if [ -f "$STATUS_FILE" ]; then
            status_line=$(cat "$STATUS_FILE")
            status=$(echo "$status_line" | cut -d':' -f1)
            pid=$(echo "$status_line" | cut -d':' -f2)
            
            # Vérifier que le PID est toujours valide
            if [ "$status" = "running" ] && [ "$pid" != "0" ]; then
                if kill -0 "$pid" 2>/dev/null; then
                    echo "running:$pid"
                else
                    echo "stopped:0"
                fi
            else
                echo "stopped:0"
            fi
        else
            # Fallback : vérifier le PID file
            if [ -f "$SERVER_PID_FILE" ]; then
                pid=$(cat "$SERVER_PID_FILE")
                if kill -0 "$pid" 2>/dev/null; then
                    echo "running:$pid"
                else
                    echo "stopped:0"
                fi
            else
                echo "stopped:0"
            fi
        fi
        ;;
    *)
        echo "Commande invalide: $COMMAND"
        echo "Commandes disponibles: start, stop, restart, update, status"
        exit 1
        ;;
esac

exit 0
