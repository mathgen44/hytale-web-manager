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