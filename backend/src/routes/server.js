import express from 'express';
import dockerService from '../services/docker.js';

const router = express.Router();

// GET /api/server/status - Obtenir le statut du serveur
router.get('/status', async (req, res) => {
  try {
    const status = await dockerService.getServerStatus();
    res.json(status);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/server/stats - Obtenir les statistiques du conteneur
router.get('/stats', async (req, res) => {
  try {
    const stats = await dockerService.getContainerStats();
    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/server/version - Obtenir la version du serveur
router.get('/version', async (req, res) => {
  try {
    const logs = await dockerService.getLogs(2000);
    
    // Regex pour extraire la version des logs
    const versionMatch = logs.match(/Version:\s*([\d]{4}\.[\d]{2}\.[\d]{2}-[a-f0-9]+)/i);
    const revisionMatch = logs.match(/Revision:\s*([a-f0-9]{8})/i);
    
    const currentVersion = versionMatch ? versionMatch[1] : 'unknown';
    const currentRevision = revisionMatch ? revisionMatch[1] : 'unknown';
    
    res.json({ 
      current: currentVersion,
      revision: currentRevision,
      full: `${currentVersion} (${currentRevision})`
    });
  } catch (error) {
    console.error('Erreur route /version:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET /api/server/version-check - Vérifier si mise à jour disponible 🆕
router.get('/version-check', async (req, res) => {
  try {
    const container = await dockerService.getContainer();
    if (!container) {
      return res.json({ 
        updateAvailable: false, 
        currentVersion: 'unknown',
        availableVersion: 'unknown',
        message: 'Container not found'
      });
    }

    // Vérifier l'état du conteneur
    const info = await container.inspect();
    if (!info.State.Running) {
      return res.json({ 
        updateAvailable: false, 
        currentVersion: 'unknown',
        availableVersion: 'unknown',
        message: 'Container not running'
      });
    }

    // Exécuter hytale-downloader -print-version pour obtenir la version disponible
    const exec = await container.exec({
      Cmd: ['sh', '-c', '/usr/local/bin/hytale-downloader -print-version 2>&1 || echo "error"'],
      AttachStdout: true,
      AttachStderr: true
    });

    const stream = await exec.start();
    let output = '';
    
    stream.on('data', (chunk) => {
      const text = chunk.toString('utf8');
      // Nettoyer les headers Docker (8 premiers octets)
      output += text.length > 8 ? text.substring(8) : text;
    });

    await new Promise((resolve, reject) => {
      stream.on('end', resolve);
      stream.on('error', reject);
      // Timeout 30 secondes
      setTimeout(() => reject(new Error('Timeout')), 30000);
    });
    
    // Parser la sortie pour extraire la version
    // Format attendu : "2026.01.28-87d03be09"
    const versionLineMatch = output.match(/([\d]{4}\.[\d]{2}\.[\d]{2}-[a-f0-9]+)/i);
    const availableVersion = versionLineMatch ? versionLineMatch[1] : 'unknown';
    
    // Récupérer version actuelle depuis les logs
    const logs = await dockerService.getLogs(2000);
    const currentVersionMatch = logs.match(/Version:\s*([\d]{4}\.[\d]{2}\.[\d]{2}-[a-f0-9]+)/i);
    const currentVersion = currentVersionMatch ? currentVersionMatch[1] : 'unknown';
    
    // Comparer versions (simple comparaison de strings)
    const updateAvailable = availableVersion !== 'unknown' && 
                           currentVersion !== 'unknown' && 
                           availableVersion !== currentVersion;
    
    console.log('🔍 [version-check] Version actuelle:', currentVersion);
    console.log('🔍 [version-check] Version disponible:', availableVersion);
    console.log('🔍 [version-check] Mise à jour disponible:', updateAvailable);
    
    res.json({ 
      updateAvailable, 
      currentVersion,
      availableVersion,
      message: updateAvailable ? 'Nouvelle version disponible' : 'Serveur à jour'
    });
  } catch (error) {
    console.error('❌ [version-check] Erreur:', error.message);
    res.json({ 
      updateAvailable: false, 
      currentVersion: 'unknown',
      availableVersion: 'unknown',
      error: error.message,
      message: 'Erreur lors de la vérification'
    });
  }
});

// GET /api/server/oauth-url - Récupérer l'URL OAuth du downloader
router.get('/oauth-url', async (req, res) => {
  try {
    const fs = await import('fs/promises');
    
    // Lire le fichier depuis le volume partagé
    const url = await fs.readFile('/tmp/oauth-shared/oauth-url.txt', 'utf8')
      .then(content => content.trim())
      .catch(() => '');
    
    console.log('📋 [oauth-url] Lecture fichier partagé:', url || '(vide)');
    
    if (url && url.startsWith('https://oauth.accounts.hytale.com/')) {
      console.log('✅ [oauth-url] URL OAuth détectée');
      res.json({ url, active: true });
    } else {
      res.json({ url: null, active: false });
    }
  } catch (error) {
    console.error('❌ [oauth-url] Erreur:', error.message);
    res.json({ url: null, active: false });
  }
});

// POST /api/server/start - Démarrer le serveur
router.post('/start', async (req, res) => {
  try {
    const result = await dockerService.startServer();
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/server/stop - Arrêter le serveur
router.post('/stop', async (req, res) => {
  try {
    const result = await dockerService.stopServer();
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/server/restart - Redémarrer le serveur
router.post('/restart', async (req, res) => {
  try {
    const result = await dockerService.restartServer();
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/server/update - Mettre à jour le serveur
router.post('/update', async (req, res) => {
  try {
    const result = await dockerService.updateServer();
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/server/logs - Récupérer les logs
router.get('/logs', async (req, res) => {
  try {
    const lines = parseInt(req.query.lines) || 100;
    const logs = await dockerService.getLogs(lines);
    res.json({ logs });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
