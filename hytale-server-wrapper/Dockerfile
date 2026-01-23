FROM enesbakis/hytale-docker:latest

# Installer les outils nécessaires pour le contrôle du serveur
RUN apk add --no-cache \
    bash \
    procps \
    coreutils

# Copier les scripts de contrôle
COPY wrapper.sh /wrapper.sh
COPY control-server.sh /control-server.sh

RUN chmod +x /wrapper.sh /control-server.sh

# Créer le pipe pour les commandes de contrôle
RUN mkfifo /tmp/server-control

# Utiliser le wrapper comme entrypoint
ENTRYPOINT ["/wrapper.sh"]