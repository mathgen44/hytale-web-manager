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
  const leavePattern = /Player '([^']+)' left world/i;

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

    // Détection de déconnexion
    const leaveMatch = line.match(leavePattern);
    if (leaveMatch) {
      const playerName = leaveMatch[1];
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
      // Récupérer les logs récents
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
      await dockerService.executeCommand(`/kick ${playerName}`);
      return { success: true, message: `Joueur ${playerName} expulsé` };
    } catch (error) {
      throw new Error(`Erreur lors de l'expulsion: ${error.message}`);
    }
  }

  async banPlayer(playerName) {
    try {
      await dockerService.executeCommand(`/ban ${playerName}`);
      return { success: true, message: `Joueur ${playerName} banni` };
    } catch (error) {
      throw new Error(`Erreur lors du bannissement: ${error.message}`);
    }
  }

  async pardonPlayer(playerName) {
    try {
      await dockerService.executeCommand(`/pardon ${playerName}`);
      return { success: true, message: `Joueur ${playerName} gracié` };
    } catch (error) {
      throw new Error(`Erreur lors de la grâce: ${error.message}`);
    }
  }

  async opPlayer(playerName) {
    try {
      await dockerService.executeCommand(`/op ${playerName}`);
      return { success: true, message: `Joueur ${playerName} promu opérateur` };
    } catch (error) {
      throw new Error(`Erreur lors de la promotion: ${error.message}`);
    }
  }

  async deopPlayer(playerName) {
    try {
      await dockerService.executeCommand(`/deop ${playerName}`);
      return { success: true, message: `Privilèges retirés à ${playerName}` };
    } catch (error) {
      throw new Error(`Erreur lors du retrait des privilèges: ${error.message}`);
    }
  }
}

export default new PlayersService();