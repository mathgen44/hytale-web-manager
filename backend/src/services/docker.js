import Docker from 'dockerode';
import dotenv from 'dotenv';

dotenv.config();

console.log('🔧 [docker.js] Module chargé !');

class DockerService {
  constructor() {
	console.log('🔧 [DockerService] Constructor appelé !');
    this.docker = new Docker();
    this.containerName = process.env.CONTAINER_NAME || 'hytale-server';
    this.container = null;
    this.initialized = false;
  }

  async init() {
  // Toujours réinitialiser si plus de 5 minutes
  const now = Date.now();
  if (this.initialized && this.container && this.lastInit && (now - this.lastInit < 300000)) {
    return;
  }

  try {
    const containers = await this.docker.listContainers({ all: true });
    
    const found = containers.find(c => 
      c.Names.some(name => 
        name.includes('hytale-server') || 
        name.includes(this.containerName)
      )
    );
    
    if (found) {
      this.container = this.docker.getContainer(found.Id);
      this.initialized = true;
      this.lastInit = now;  // ← AJOUTER
      console.log('✅ Conteneur Hytale trouvé:', found.Names[0]);
    }
  } catch (error) {
    console.error('❌ Erreur init Docker:', error.message);
    this.initialized = false;
  }
}

  async getContainer() {
    if (!this.container || !this.initialized) {
      await this.init();
    }
    return this.container;
  }

async getServerStatus() {
  try {
    console.log('🔍 [getServerStatus] Début de la vérification du statut...');
    
    const container = await this.getContainer();
    if (!container) {
      console.log('❌ [getServerStatus] Container not found');
      return { 
        container: 'not_found', 
        server: 'unknown', 
        uptime: 0,
        pid: 0
      };
    }

    console.log('✅ [getServerStatus] Container trouvé');
    
    const info = await container.inspect();
    const containerRunning = info.State.Running;
    
    console.log(`🔍 [getServerStatus] Container running: ${containerRunning}`);
    
    if (!containerRunning) {
      console.log('⚠️ [getServerStatus] Container stopped, retour server:stopped');
      return { 
        container: 'stopped', 
        server: 'stopped', 
        uptime: 0,
        pid: 0
      };
    }

    // Vérifier le statut du serveur via le script de contrôle
    try {
      console.log('🔍 [getServerStatus] Appel de executeCommand("status", false)...');
      const statusOutput = await this.executeCommand('status', false);
      console.log(`📝 [getServerStatus] Sortie brute: "${statusOutput}"`);
      
      const statusLine = statusOutput.trim();
      console.log(`📝 [getServerStatus] Après trim: "${statusLine}"`);
      
      // Format attendu: "running:PID" ou "stopped:0"
      const [serverStatus, pidStr] = statusLine.split(':');
      console.log(`📝 [getServerStatus] Split: serverStatus="${serverStatus}", pidStr="${pidStr}"`);
      
      const serverRunning = serverStatus === 'running';
      const pid = parseInt(pidStr) || 0;
      
      console.log(`🔍 [getServerStatus] serverRunning: ${serverRunning}, pid: ${pid}`);

      // Calculer l'uptime
      let uptime = 0;
      if (containerRunning && serverRunning) {
        const startTime = new Date(info.State.StartedAt);
        uptime = Math.floor((Date.now() - startTime.getTime()) / 1000);
        console.log(`⏱️ [getServerStatus] Uptime calculé: ${uptime}s`);
      }

      const result = {
        container: containerRunning ? 'running' : 'stopped',
        server: serverRunning ? 'running' : 'stopped',
        uptime,
        pid
      };
      
      console.log('✅ [getServerStatus] Résultat final:', JSON.stringify(result));
      return result;
      
    } catch (execError) {
      console.error('❌ [getServerStatus] Erreur executeCommand:', execError.message);
      console.error('❌ [getServerStatus] Stack:', execError.stack);
      
      // En cas d'erreur, retourner un statut par défaut
      return {
        container: containerRunning ? 'running' : 'stopped',
        server: 'unknown',
        uptime: 0,
        pid: 0
      };
    }
  } catch (error) {
    console.error('❌ [getServerStatus] Erreur globale:', error.message);
    console.error('❌ [getServerStatus] Stack:', error.stack);
    return { 
      container: 'error', 
      server: 'error', 
      uptime: 0,
      pid: 0
    };
  }
}

  async executeCommand(command, isGameCommand = true) {
    try {
      const container = await this.getContainer();
      if (!container) {
        throw new Error('Conteneur non trouvé');
      }

      // Vérifier que le conteneur est en cours d'exécution
      const info = await container.inspect();
      if (!info.State.Running) {
        throw new Error('Le conteneur n\'est pas en cours d\'exécution');
      }

      // Construction de la commande
      let cmd;
      if (isGameCommand) {
        // Commande de jeu (à implémenter si nécessaire)
        cmd = ['sh', '-c', `echo "/command ${command}" >> /tmp/server-commands`];
      } else {
        // Commande de contrôle
        cmd = ['sh', '-c', `/control-server.sh "${command}"`];
      }

      console.log('🔧 Exécution de la commande:', cmd.join(' '));

      const exec = await container.exec({
        Cmd: cmd,
        AttachStdout: true,
        AttachStderr: true
      });

      const stream = await exec.start();
      
      return new Promise((resolve, reject) => {
        let output = '';
        let error = '';
        
        stream.on('data', (chunk) => {
          const text = chunk.toString('utf8');
          // Les 8 premiers octets sont des headers Docker, on les ignore
          const cleanText = text.length > 8 ? text.substring(8) : text;
          output += cleanText;
        });
        
        stream.on('end', () => {
          if (error) {
            reject(new Error(error));
          } else {
            resolve(output.trim());
          }
        });
        
        stream.on('error', (err) => {
          error = err.message;
          reject(err);
        });

        // Timeout adaptatif : 5 minutes pour update, 10s pour le reste
		const timeoutMs = command === 'update' ? 300000 : 10000;
		setTimeout(() => {
		reject(new Error('Timeout lors de l\'exécution de la commande'));
		}, timeoutMs);
      });
    } catch (error) {
      console.error('❌ Erreur executeCommand:', error.message);
      throw error;
    }
  }

  async startServer() {
    console.log('🚀 Démarrage du serveur...');
    const result = await this.executeCommand('start', false);
    console.log('   Résultat:', result);
    return result;
  }

  async stopServer() {
    console.log('🛑 Arrêt du serveur...');
    const result = await this.executeCommand('stop', false);
    console.log('   Résultat:', result);
    return result;
  }

  async restartServer() {
    console.log('🔄 Redémarrage du serveur...');
    const result = await this.executeCommand('restart', false);
    console.log('   Résultat:', result);
    return result;
  }
  
  async updateServer() {
  console.log('🔄 Lancement de la mise à jour en arrière-plan...');
  
  try {
    const container = await this.getContainer();
    if (!container) {
      throw new Error('Conteneur non trouvé');
    }

    const info = await container.inspect();
    if (!info.State.Running) {
      throw new Error('Le conteneur n\'est pas en cours d\'exécution');
    }

    // Lancer le script en arrière-plan avec nohup
    const cmd = ['sh', '-c', 'nohup /update-server.sh > /tmp/update.log 2>&1 &'];
    
    const exec = await container.exec({
      Cmd: cmd,
      AttachStdout: true,
      AttachStderr: true,
      Detach: true
    });

    await exec.start({ Detach: true });
    
    console.log('✅ Mise à jour lancée en arrière-plan');
    return { 
      success: true, 
      message: 'Mise à jour lancée. Surveillez les logs et la popup OAuth si nécessaire.' 
    };
  } catch (error) {
    console.error('❌ Erreur updateServer:', error.message);
    throw error;
  }
}

  async streamLogs(callback) {
    try {
      const container = await this.getContainer();
      if (!container) {
        throw new Error('Conteneur non trouvé');
      }

      const stream = await container.logs({
        stdout: true,
        stderr: true,
        follow: true,
        timestamps: true
      });

      stream.on('data', (chunk) => {
        const lines = chunk.toString('utf8').split('\n');
        lines.forEach(line => {
          if (line.trim()) {
            callback(line);
          }
        });
      });

      return stream;
    } catch (error) {
      console.error('❌ Erreur streamLogs:', error.message);
      throw error;
    }
  }

  async getContainerStats() {
    try {
      const container = await this.getContainer();
      if (!container) {
        throw new Error('Conteneur non trouvé');
      }

      const stats = await container.stats({ stream: false });
      
      // Calcul du CPU
      const cpuDelta = stats.cpu_stats.cpu_usage.total_usage - 
                      (stats.precpu_stats.cpu_usage?.total_usage || 0);
      const systemDelta = stats.cpu_stats.system_cpu_usage - 
                         (stats.precpu_stats.system_cpu_usage || 0);
      
      let cpuPercent = 0;
      if (systemDelta > 0 && cpuDelta > 0) {
        cpuPercent = (cpuDelta / systemDelta) * 
                     (stats.cpu_stats.online_cpus || 1) * 100;
      }

      // Calcul de la RAM
      const memUsage = stats.memory_stats.usage || 0;
      const memLimit = stats.memory_stats.limit || 1;
      const memPercent = (memUsage / memLimit) * 100;

      return {
        cpu: cpuPercent.toFixed(2),
        memory: {
          used: (memUsage / 1024 / 1024).toFixed(2),
          limit: (memLimit / 1024 / 1024).toFixed(2),
          percent: memPercent.toFixed(2)
        }
      };
    } catch (error) {
      console.error('❌ Erreur getStats:', error.message);
      return {
        cpu: 0,
        memory: { used: 0, limit: 0, percent: 0 }
      };
    }
  }
}

export default new DockerService();
