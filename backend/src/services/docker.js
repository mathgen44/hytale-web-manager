import Docker from 'dockerode';

const docker = new Docker({ socketPath: '/var/run/docker.sock' });
const CONTAINER_NAME = process.env.HYTALE_CONTAINER_NAME || 'hytale-server';

class DockerService {
  async getContainer() {
    try {
      const container = docker.getContainer(CONTAINER_NAME);
      await container.inspect();
      return container;
    } catch (error) {
      throw new Error(`Conteneur Hytale introuvable: ${error.message}`);
    }
  }

  async getServerStatus() {
    try {
      const container = await this.getContainer();
      const inspect = await container.inspect();
      
      // Vérifier si le conteneur est en cours d'exécution
      if (!inspect.State.Running) {
        return {
          container: 'stopped',
          server: 'stopped',
          uptime: 0
        };
      }

      // Exécuter la commande de statut dans le conteneur
      const exec = await container.exec({
        Cmd: ['/control-server.sh', 'status'],
        AttachStdout: true,
        AttachStderr: true
      });

      const stream = await exec.start();
      
      let output = '';
      stream.on('data', (chunk) => {
        output += chunk.toString();
      });

      await new Promise((resolve) => {
        stream.on('end', resolve);
      });

      const status = output.trim();
      
      if (status.startsWith('running:')) {
        const pid = status.split(':')[1];
        return {
          container: 'running',
          server: 'running',
          pid: parseInt(pid),
          uptime: inspect.State.StartedAt
        };
      }

      return {
        container: 'running',
        server: 'stopped',
        uptime: 0
      };
    } catch (error) {
      throw new Error(`Erreur lors de la récupération du statut: ${error.message}`);
    }
  }

  async getContainerStats() {
    try {
      const container = await this.getContainer();
      const stats = await container.stats({ stream: false });
      
      // Calculer l'utilisation CPU
      const cpuDelta = stats.cpu_stats.cpu_usage.total_usage - stats.precpu_stats.cpu_usage.total_usage;
      const systemDelta = stats.cpu_stats.system_cpu_usage - stats.precpu_stats.system_cpu_usage;
      const cpuPercent = (cpuDelta / systemDelta) * stats.cpu_stats.online_cpus * 100;
      
      // Calculer l'utilisation mémoire
      const memUsage = stats.memory_stats.usage;
      const memLimit = stats.memory_stats.limit;
      const memPercent = (memUsage / memLimit) * 100;
      
      return {
        cpu: cpuPercent.toFixed(2),
        memory: {
          used: (memUsage / 1024 / 1024).toFixed(2), // MB
          limit: (memLimit / 1024 / 1024).toFixed(2), // MB
          percent: memPercent.toFixed(2)
        }
      };
    } catch (error) {
      throw new Error(`Erreur lors de la récupération des stats: ${error.message}`);
    }
  }

  async startServer() {
    try {
      const container = await this.getContainer();
      
      const exec = await container.exec({
        Cmd: ['/control-server.sh', 'start'],
        AttachStdout: true,
        AttachStderr: true
      });

      await exec.start();
      
      // Attendre un peu que le serveur démarre
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      return { success: true, message: 'Serveur en cours de démarrage' };
    } catch (error) {
      throw new Error(`Erreur lors du démarrage: ${error.message}`);
    }
  }

  async stopServer() {
    try {
      const container = await this.getContainer();
      
      const exec = await container.exec({
        Cmd: ['/control-server.sh', 'stop'],
        AttachStdout: true,
        AttachStderr: true
      });

      await exec.start();
      
      return { success: true, message: 'Serveur en cours d\'arrêt' };
    } catch (error) {
      throw new Error(`Erreur lors de l'arrêt: ${error.message}`);
    }
  }

  async restartServer() {
    try {
      const container = await this.getContainer();
      
      const exec = await container.exec({
        Cmd: ['/control-server.sh', 'restart'],
        AttachStdout: true,
        AttachStderr: true
      });

      await exec.start();
      
      // Attendre que le redémarrage se fasse
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      return { success: true, message: 'Serveur en cours de redémarrage' };
    } catch (error) {
      throw new Error(`Erreur lors du redémarrage: ${error.message}`);
    }
  }

  async executeCommand(command) {
    try {
      const container = await this.getContainer();
      
      // Vérifier que le serveur est en cours d'exécution
      const status = await this.getServerStatus();
      if (status.server !== 'running') {
        throw new Error('Le serveur n\'est pas en cours d\'exécution');
      }

      const exec = await container.exec({
        Cmd: ['sh', '-c', `echo "${command}" > /proc/$(cat /tmp/hytale-server.pid)/fd/0`],
        AttachStdout: true,
        AttachStderr: true
      });

      await exec.start();
      
      return { success: true, message: `Commande exécutée: ${command}` };
    } catch (error) {
      throw new Error(`Erreur lors de l'exécution de la commande: ${error.message}`);
    }
  }

  async getLogs(lines = 100) {
    try {
      const container = await this.getContainer();
      
      const logs = await container.logs({
        stdout: true,
        stderr: true,
        tail: lines,
        timestamps: true
      });

      return logs.toString('utf-8');
    } catch (error) {
      throw new Error(`Erreur lors de la récupération des logs: ${error.message}`);
    }
  }

  async streamLogs(callback) {
    try {
      const container = await this.getContainer();
      
      const stream = await container.logs({
        follow: true,
        stdout: true,
        stderr: true,
        timestamps: true
      });

      stream.on('data', (chunk) => {
        callback(chunk.toString('utf-8'));
      });

      return stream;
    } catch (error) {
      throw new Error(`Erreur lors du streaming des logs: ${error.message}`);
    }
  }
}

export default new DockerService();