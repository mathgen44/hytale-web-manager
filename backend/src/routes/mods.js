import express from 'express';
import multer from 'multer';
import modsService from '../services/mods.js';

const router = express.Router();

// Configuration multer pour l'upload de fichiers
const storage = multer.memoryStorage();
const upload = multer({ 
  storage,
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB max
  },
  fileFilter: (req, file, cb) => {
    if (file.originalname.endsWith('.jar')) {
      cb(null, true);
    } else {
      cb(new Error('Seuls les fichiers .jar sont acceptés'));
    }
  }
});

// GET /api/mods - Obtenir la liste des mods installés
router.get('/', async (req, res) => {
  try {
    const mods = await modsService.getMods();
    res.json({ 
      mods, 
      count: mods.length 
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/mods/upload - Upload un nouveau mod
router.post('/upload', upload.single('mod'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Aucun fichier fourni' });
    }

    const result = await modsService.uploadMod(
      req.file.buffer,
      req.file.originalname
    );

    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/mods/:filename/enable - Activer un mod
router.post('/:filename/enable', async (req, res) => {
  try {
    const result = await modsService.enableMod(req.params.filename);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/mods/:filename/disable - Désactiver un mod
router.post('/:filename/disable', async (req, res) => {
  try {
    const result = await modsService.disableMod(req.params.filename);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE /api/mods/:filename - Supprimer un mod
router.delete('/:filename', async (req, res) => {
  try {
    const result = await modsService.deleteMod(req.params.filename);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/mods/:filename/status - Vérifier si un mod est chargé
router.get('/:filename/status', async (req, res) => {
  try {
    const modName = req.params.filename.replace('.jar', '');
    const status = await modsService.checkModLoaded(modName);
    res.json(status);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/mods/scan - Forcer un scan du dossier mods
router.post('/scan', async (req, res) => {
  try {
    const mods = await modsService.scanMods();
    res.json({ 
      success: true, 
      message: 'Scan terminé',
      mods,
      count: mods.length 
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
