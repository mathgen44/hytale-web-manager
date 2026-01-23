FROM enesbakis/hytale-docker:latest

# Détecter et installer les outils nécessaires selon la distribution
RUN if command -v apk >/dev/null 2>&1; then \
        apk add --no-cache bash procps coreutils; \
    elif command -v apt-get >/dev/null 2>&1; then \
        apt-get update && apt-get install -y bash procps coreutils && rm -rf /var/lib/apt/lists/*; \
    elif command -v yum >/dev/null 2>&1; then \
        yum install -y bash procps coreutils && yum clean all; \
    fi

# Copier les scripts de contrôle
COPY wrapper.sh /wrapper.sh
COPY control-server.sh /control-server.sh

RUN chmod +x /wrapper.sh /control-server.sh

# Créer le pipe pour les commandes de contrôle
RUN mkfifo /tmp/server-control

# Utiliser le wrapper comme entrypoint
ENTRYPOINT ["/wrapper.sh"]