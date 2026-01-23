#!/bin/bash

# Script pour envoyer des commandes de contrôle au serveur
# Utilisé par le backend via docker exec

CONTROL_PIPE="/tmp/server-control"

if [ $# -eq 0 ]; then
    echo "Usage: $0 {start|stop|restart|status}"
    exit 1
fi

COMMAND=$1

case "$COMMAND" in
    start|stop|restart|status)
        echo "$COMMAND" > "$CONTROL_PIPE"
        
        # Pour la commande status, attendre la réponse
        if [ "$COMMAND" = "status" ]; then
            sleep 0.5
            if [ -f "/tmp/hytale-server.pid" ]; then
                pid=$(cat /tmp/hytale-server.pid)
                if kill -0 "$pid" 2>/dev/null; then
                    echo "running:$pid"
                else
                    echo "stopped"
                fi
            else
                echo "stopped"
            fi
        fi
        ;;
    *)
        echo "Commande invalide: $COMMAND"
        echo "Commandes disponibles: start, stop, restart, status"
        exit 1
        ;;
esac