#!/bin/bash
# Script pour envoyer des commandes au serveur Hytale via le named pipe
# Usage: send-command.sh <command>
# Example: send-command.sh "/list"

if [ $# -eq 0 ]; then
    echo "Usage: $(basename "$0") <command>"
    echo "Example: $(basename "$0") \"/list\""
    exit 1
fi

# Trouver le pipe d'input Hytale
INPUT_PIPE=$(find /tmp -name "hytale_input_*" -type p 2>/dev/null | head -1)

if [ -z "$INPUT_PIPE" ]; then
    echo "Error: Hytale server input pipe not found. Is the server running?"
    exit 1
fi

# Envoyer la commande au pipe
echo "$*" > "$INPUT_PIPE"
echo "Command sent: $*"
exit 0
