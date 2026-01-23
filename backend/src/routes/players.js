import express from 'express';
import playersService from '../services/players.js';

const router = express.Router();

// GET /api/players - Obtenir la liste des joueurs connectés
router.get('/', async (req, res) => {
  try {
    const players = await playersService.getConnectedPlayers();
    res.json({ players, count: players.length });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/players/:name/kick - Expulser un joueur
router.post('/:name/kick', async (req, res) => {
  try {
    const result = await playersService.kickPlayer(req.params.name);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/players/:name/ban - Bannir un joueur
router.post('/:name/ban', async (req, res) => {
  try {
    const result = await playersService.banPlayer(req.params.name);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/players/:name/pardon - Gracier un joueur
router.post('/:name/pardon', async (req, res) => {
  try {
    const result = await playersService.pardonPlayer(req.params.name);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/players/:name/op - Promouvoir en opérateur
router.post('/:name/op', async (req, res) => {
  try {
    const result = await playersService.opPlayer(req.params.name);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/players/:name/deop - Retirer les privilèges d'opérateur
router.post('/:name/deop', async (req, res) => {
  try {
    const result = await playersService.deopPlayer(req.params.name);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;