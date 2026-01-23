import dockerService from '../services/docker.js';

export function setupLogsWebSocket(wss) {
  const activeStreams = new Map();

  wss.on('connection', (ws) => {
    console.log('📡 Nouveau client WebSocket connecté');
    
    let logStream = null;
    const clientId = Date.now();

    // Fonction pour envoyer les logs au client
    const sendLog = (logLine) => {
      if (ws.readyState === 1) { // OPEN
        try {
          ws.send(JSON.stringify({
            type: 'log',
            timestamp: new Date().toISOString(),
            data: logLine
          }));
        } catch (error) {
          console.error('Erreur lors de l\'envoi du log:', error);
        }
      }
    };

    // Démarrer le streaming des logs
    const startStreaming = async () => {
      try {
        // Envoyer d'abord les logs récents
        const recentLogs = await dockerService.getLogs(50);
        const lines = recentLogs.split('\n').filter(line => line.trim());
        
        lines.forEach(line => {
          sendLog(line);
        });

        // Puis démarrer le streaming en temps réel
        logStream = await dockerService.streamLogs((logLine) => {
          sendLog(logLine);
        });

        activeStreams.set(clientId, logStream);

        ws.send(JSON.stringify({
          type: 'connected',
          message: 'Streaming des logs démarré'
        }));
      } catch (error) {
        ws.send(JSON.stringify({
          type: 'error',
          message: error.message
        }));
      }
    };

    // Démarrer le streaming
    startStreaming();

    // Gérer les messages du client
    ws.on('message', (message) => {
      try {
        const data = JSON.parse(message.toString());
        
        if (data.type === 'ping') {
          ws.send(JSON.stringify({ type: 'pong' }));
        }
      } catch (error) {
        console.error('Erreur lors du traitement du message:', error);
      }
    });

    // Gérer la déconnexion
    ws.on('close', () => {
      console.log('📡 Client WebSocket déconnecté');
      
      // Arrêter le stream
      if (logStream) {
        try {
          logStream.destroy();
        } catch (error) {
          console.error('Erreur lors de la fermeture du stream:', error);
        }
      }
      
      activeStreams.delete(clientId);
    });

    // Gérer les erreurs
    ws.on('error', (error) => {
      console.error('Erreur WebSocket:', error);
    });
  });

  console.log('✅ WebSocket configuré pour les logs');
}