import express from 'express';
import dockerService from '../services/docker.js';

const router = express.Router();

// POST /api/commands/execute - Exécuter une commande sur le serveur
router.post('/execute', async (req, res) => {
  try {
    const { command } = req.body;
    
    if (!command || typeof command !== 'string') {
      return res.status(400).json({ error: 'Commande invalide' });
    }

    // Sécurité: s'assurer que la commande commence par /
    const cleanCommand = command.trim();
    if (!cleanCommand.startsWith('/')) {
      return res.status(400).json({ error: 'Les commandes doivent commencer par /' });
    }

    const result = await dockerService.executeCommand(cleanCommand);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;