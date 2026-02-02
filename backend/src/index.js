import express from 'express';
import cors from 'cors';
import { WebSocketServer } from 'ws';
import http from 'http';
import dotenv from 'dotenv';
import serverRoutes from './routes/server.js';
import playersRoutes from './routes/players.js';
import commandsRoutes from './routes/commands.js';
import modsRoutes from './routes/mods.js';
import { setupLogsWebSocket } from './websocket/logs-stream.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/server', serverRoutes);
app.use('/api/players', playersRoutes);
app.use('/api/commands', commandsRoutes);
app.use('/api/mods', modsRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Créer le serveur HTTP
const server = http.createServer(app);

// Créer le serveur WebSocket
const wss = new WebSocketServer({ server, path: '/ws/logs' });

// Configurer le WebSocket pour les logs
setupLogsWebSocket(wss);

// Démarrer le serveur
server.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Backend API démarré sur le port ${PORT}`);
  console.log(`📡 WebSocket disponible sur ws://localhost:${PORT}/ws/logs`);
  console.log(`🔧 API Mods disponible sur http://localhost:${PORT}/api/mods`);
});
