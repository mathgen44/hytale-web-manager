import dockerService from './docker.js';

class PlayersService {
  constructor() {
    this.connectedPlayers = new Map();
  }

  parseLogsForPlayers(logs) {
    const lines = logs.split('\n');
    const players = new Map();

    // Regex pour détecter les connexions/déconnexions (format Hytale réel)
    const joinPattern = /Player '([^']+)' joined world/i;
    // Deux formats de déconnexion détectés dans les logs
    const leavePattern1 = /Removing player '([^']+)' \(/i;  // Format: Removing player 'Mathgen' (uuid)
    const leavePattern2 = /Removing player '([^']+) \([^)]+\)' from world/i;  // Format: Removing player 'Mathgen (Mathgen)' from world

    for (const line of lines) {
      // Détection de connexion
      const joinMatch = line.match(joinPattern);
      if (joinMatch) {
        const playerName = joinMatch[1];
        players.set(playerName, {
          name: playerName,
          connected: true,
          joinedAt: this.extractTimestamp(line)
        });
        continue;
      }

      // Détection de déconnexion (format 1)
      const leaveMatch1 = line.match(leavePattern1);
      if (leaveMatch1) {
        const playerName = leaveMatch1[1].trim();
        players.delete(playerName);
        continue;
      }

      // Détection de déconnexion (format 2)
      const leaveMatch2 = line.match(leavePattern2);
      if (leaveMatch2) {
        const playerName = leaveMatch2[1].trim();
        players.delete(playerName);
      }
    }

    return Array.from(players.values());
  }

  extractTimestamp(line) {
    // Format: 2024-01-23T10:30:45.123456Z [INFO] ...
    const match = line.match(/^(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2})/);
    return match ? match[1] : new Date().toISOString();
  }

  async getConnectedPlayers() {
    try {
      // Récupérer les logs récents (beaucoup de lignes pour capturer toutes les connexions)
      const logs = await dockerService.getLogs(3000);
      
      // Parser les logs pour extraire les joueurs
      const players = this.parseLogsForPlayers(logs);
      
      // Mettre à jour le cache
      this.connectedPlayers.clear();
      players.forEach(player => {
        this.connectedPlayers.set(player.name, player);
      });

      return players;
    } catch (error) {
      throw new Error(`Erreur lors de la récupération des joueurs: ${error.message}`);
    }
  }

  async kickPlayer(playerName) {
    try {
      await dockerService.executeCommand(`kick ${playerName}`);
      return { success: true, message: `Joueur ${playerName} expulsé` };
    } catch (error) {
      throw new Error(`Erreur lors de l'expulsion: ${error.message}`);
    }
  }

  async banPlayer(playerName) {
    try {
      await dockerService.executeCommand(`ban ${playerName}`);
      return { success: true, message: `Joueur ${playerName} banni` };
    } catch (error) {
      throw new Error(`Erreur lors du bannissement: ${error.message}`);
    }
  }

  async pardonPlayer(playerName) {
    try {
      await dockerService.executeCommand(`unban ${playerName}`);
      return { success: true, message: `Joueur ${playerName} débanni` };
    } catch (error) {
      throw new Error(`Erreur lors du débannissement: ${error.message}`);
    }
  }

  async opPlayer(playerName) {
    try {
      await dockerService.executeCommand(`op add ${playerName}`);
      return { success: true, message: `Joueur ${playerName} promu opérateur` };
    } catch (error) {
      throw new Error(`Erreur lors de la promotion: ${error.message}`);
    }
  }

  async deopPlayer(playerName) {
    try {
      await dockerService.executeCommand(`op remove ${playerName}`);
      return { success: true, message: `Privilèges retirés à ${playerName}` };
    } catch (error) {
      throw new Error(`Erreur lors du retrait des privilèges: ${error.message}`);
    }
  }
}

export default new PlayersService();
