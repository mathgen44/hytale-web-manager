import fs from 'fs/promises';
import path from 'path';
import dockerService from './docker.js';

class ModsService {
  constructor() {
    this.modsPath = '/data/mods';
    this.modsCache = new Map();
    this.lastScan = 0;
  }

  /**
   * Scanner le dossier mods et récupérer la liste
   */
  async scanMods() {
    try {
      const container = await dockerService.getContainer();
      if (!container) {
        throw new Error('Conteneur non trouvé');
      }

      // Vérifier que le dossier existe
      const exec = await container.exec({
        Cmd: ['sh', '-c', `test -d ${this.modsPath} && echo "exists" || echo "missing"`],
        AttachStdout: true,
        AttachStderr: true
      });

      const stream = await exec.start();
      let output = '';

      return new Promise((resolve, reject) => {
        stream.on('data', (chunk) => {
          output += chunk.toString('utf8').substring(8); // Skip Docker headers
        });

        stream.on('end', async () => {
          if (output.trim() === 'missing') {
            // Créer le dossier mods s'il n'existe pas
            await this.createModsDirectory();
            resolve([]);
            return;
          }

          // Lister les fichiers .jar dans le dossier mods
          try {
            const mods = await this.listModFiles();
            this.modsCache = new Map(mods.map(mod => [mod.filename, mod]));
            this.lastScan = Date.now();
            resolve(mods);
          } catch (error) {
            reject(error);
          }
        });

        stream.on('error', reject);
      });
    } catch (error) {
      console.error('❌ Erreur scanMods:', error.message);
      throw error;
    }
  }

  /**
   * Créer le dossier mods s'il n'existe pas
   */
  async createModsDirectory() {
    const container = await dockerService.getContainer();
    const exec = await container.exec({
      Cmd: ['sh', '-c', `mkdir -p ${this.modsPath}`],
      AttachStdout: true,
      AttachStderr: true
    });
    await exec.start();
  }

  /**
   * Lister les fichiers .jar dans le dossier mods
   */
  async listModFiles() {
    const container = await dockerService.getContainer();
    
    const exec = await container.exec({
      Cmd: ['sh', '-c', `find ${this.modsPath} -maxdepth 1 -type f -name "*.jar" -printf "%f\\n"`],
      AttachStdout: true,
      AttachStderr: true
    });

    const stream = await exec.start();
    let output = '';

    return new Promise((resolve, reject) => {
      stream.on('data', (chunk) => {
        output += chunk.toString('utf8').substring(8);
      });

      stream.on('end', async () => {
        const files = output.trim().split('\n').filter(f => f);
        
        // Pour chaque fichier, récupérer les infos (taille, date)
        const mods = [];
        for (const filename of files) {
          try {
            const info = await this.getModInfo(filename);
            mods.push(info);
          } catch (error) {
            console.error(`Erreur lecture mod ${filename}:`, error.message);
          }
        }

        resolve(mods);
      });

      stream.on('error', reject);
    });
  }

  /**
   * Récupérer les informations d'un mod
   */
  async getModInfo(filename) {
    const container = await dockerService.getContainer();
    const filepath = `${this.modsPath}/${filename}`;

    // Récupérer taille et date de modification
    const exec = await container.exec({
      Cmd: ['sh', '-c', `stat -c "%s %Y" ${filepath}`],
      AttachStdout: true,
      AttachStderr: true
    });

    const stream = await exec.start();
    let output = '';

    return new Promise((resolve, reject) => {
      stream.on('data', (chunk) => {
        output += chunk.toString('utf8').substring(8);
      });

      stream.on('end', () => {
        const [size, mtime] = output.trim().split(' ');
        
        resolve({
          filename,
          displayName: filename.replace('.jar', ''),
          size: parseInt(size),
          sizeFormatted: this.formatBytes(parseInt(size)),
          lastModified: new Date(parseInt(mtime) * 1000).toISOString(),
          enabled: true, // Par défaut, tous les mods dans /mods sont actifs
          type: 'plugin' // Type par défaut pour les .jar
        });
      });

      stream.on('error', reject);
    });
  }

  /**
   * Vérifier si un mod est chargé dans les logs serveur
   */
  async checkModLoaded(modName) {
    try {
      const logs = await dockerService.getLogs(500);
      
      // Pattern de détection de chargement de mod
      // Format attendu : "[ModLoader] Loaded mod: ModName"
      const loadPattern = new RegExp(`Loaded.*${modName}`, 'i');
      const errorPattern = new RegExp(`Failed.*${modName}|Error.*${modName}`, 'i');

      const hasLoaded = loadPattern.test(logs);
      const hasError = errorPattern.test(logs);

      return {
        loaded: hasLoaded,
        error: hasError,
        status: hasError ? 'error' : (hasLoaded ? 'loaded' : 'unknown')
      };
    } catch (error) {
      return { loaded: false, error: false, status: 'unknown' };
    }
  }

  /**
   * Upload un nouveau mod
   */
  async uploadMod(fileBuffer, filename) {
    try {
      if (!filename.endsWith('.jar')) {
        throw new Error('Seuls les fichiers .jar sont acceptés');
      }

      const container = await dockerService.getContainer();
      const filepath = `${this.modsPath}/${filename}`;

      // Vérifier si le fichier existe déjà
      const exists = await this.modExists(filename);
      if (exists) {
        throw new Error(`Le mod ${filename} existe déjà`);
      }

      // Créer le fichier dans le conteneur
      // On utilise base64 pour transférer le fichier
      const base64Data = fileBuffer.toString('base64');
      
      const exec = await container.exec({
        Cmd: ['sh', '-c', `echo "${base64Data}" | base64 -d > ${filepath}`],
        AttachStdout: true,
        AttachStderr: true
      });

      await exec.start();

      // Rafraîchir le cache
      await this.scanMods();

      return {
        success: true,
        message: `Mod ${filename} uploadé avec succès`,
        filename
      };
    } catch (error) {
      console.error('❌ Erreur uploadMod:', error.message);
      throw error;
    }
  }

  /**
   * Vérifier si un mod existe
   */
  async modExists(filename) {
    const container = await dockerService.getContainer();
    const filepath = `${this.modsPath}/${filename}`;

    const exec = await container.exec({
      Cmd: ['sh', '-c', `test -f ${filepath} && echo "exists" || echo "missing"`],
      AttachStdout: true,
      AttachStderr: true
    });

    const stream = await exec.start();
    let output = '';

    return new Promise((resolve) => {
      stream.on('data', (chunk) => {
        output += chunk.toString('utf8').substring(8);
      });

      stream.on('end', () => {
        resolve(output.trim() === 'exists');
      });
    });
  }

  /**
   * Supprimer un mod
   */
  async deleteMod(filename) {
    try {
      const container = await dockerService.getContainer();
      const filepath = `${this.modsPath}/${filename}`;

      // Vérifier que le fichier existe
      const exists = await this.modExists(filename);
      if (!exists) {
        throw new Error(`Le mod ${filename} n'existe pas`);
      }

      // Supprimer le fichier
      const exec = await container.exec({
        Cmd: ['sh', '-c', `rm ${filepath}`],
        AttachStdout: true,
        AttachStderr: true
      });

      await exec.start();

      // Rafraîchir le cache
      this.modsCache.delete(filename);

      return {
        success: true,
        message: `Mod ${filename} supprimé avec succès`
      };
    } catch (error) {
      console.error('❌ Erreur deleteMod:', error.message);
      throw error;
    }
  }

  /**
   * Désactiver un mod (le renommer en .jar.disabled)
   */
  async disableMod(filename) {
    try {
      const container = await dockerService.getContainer();
      const filepath = `${this.modsPath}/${filename}`;
      const disabledPath = `${filepath}.disabled`;

      const exec = await container.exec({
        Cmd: ['sh', '-c', `mv ${filepath} ${disabledPath}`],
        AttachStdout: true,
        AttachStderr: true
      });

      await exec.start();

      // Rafraîchir le cache
      await this.scanMods();

      return {
        success: true,
        message: `Mod ${filename} désactivé`,
        requiresRestart: true
      };
    } catch (error) {
      console.error('❌ Erreur disableMod:', error.message);
      throw error;
    }
  }

  /**
   * Activer un mod (retirer l'extension .disabled)
   */
  async enableMod(filename) {
    try {
      const container = await dockerService.getContainer();
      const disabledPath = `${this.modsPath}/${filename}.disabled`;
      const filepath = `${this.modsPath}/${filename}`;

      const exec = await container.exec({
        Cmd: ['sh', '-c', `mv ${disabledPath} ${filepath}`],
        AttachStdout: true,
        AttachStderr: true
      });

      await exec.start();

      // Rafraîchir le cache
      await this.scanMods();

      return {
        success: true,
        message: `Mod ${filename} activé`,
        requiresRestart: true
      };
    } catch (error) {
      console.error('❌ Erreur enableMod:', error.message);
      throw error;
    }
  }

  /**
   * Formater la taille en bytes
   */
  formatBytes(bytes) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  }

  /**
   * Obtenir la liste des mods (avec cache)
   */
  async getMods() {
    // Cache de 30 secondes
    if (Date.now() - this.lastScan < 30000 && this.modsCache.size > 0) {
      return Array.from(this.modsCache.values());
    }

    return await this.scanMods();
  }
}

export default new ModsService();
