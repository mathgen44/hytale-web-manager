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

// GET /api/server/version - Obtenir la version du serveur
router.get('/version', async (req, res) => {
  try {
    const logs = await dockerService.getLogs(2000);
    
    // DEBUG : Voir ce qu'on reçoit vraiment
    console.log('=== DEBUG LOGS ===');
    console.log('Longueur:', logs.length);
    console.log('Premiers 500 caractères:', logs.substring(0, 500));
    console.log('Contient "Version"?', logs.includes('Version'));
    console.log('Contient "HytaleServer"?', logs.includes('HytaleServer'));
    console.log('==================');
    
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
    res.status(500).json({ error: error.message });
  }
});

export default router;