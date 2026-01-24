import React, { useState, useEffect, useRef } from 'react';
import { Play, Square, RotateCw, Users, Terminal, Activity, HardDrive, Cpu, Clock, Download } from 'lucide-react';

const API_URL = '';  // URL relative
const WS_URL = `ws://${window.location.host}`;

function App() {
  const [serverStatus, setServerStatus] = useState({ server: 'loading', container: 'loading' });
  const [stats, setStats] = useState({ cpu: '0', memory: { used: '0', limit: '0', percent: '0' } });
  const [players, setPlayers] = useState([]);
  const [logs, setLogs] = useState([]);
  const [command, setCommand] = useState('');
  const [commandHistory, setCommandHistory] = useState([]);
  const [serverVersion, setServerVersion] = useState({ current: 'loading...', revision: '' });
  const [oauthUrl, setOauthUrl] = useState(null);
  const [loading, setLoading] = useState({});
  const logsEndRef = useRef(null);
  const wsRef = useRef(null);

  const formatUptime = (seconds) => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (days > 0) return `${days}j ${hours}h ${minutes}m`;
    else if (hours > 0) return `${hours}h ${minutes}m ${secs}s`;
    else if (minutes > 0) return `${minutes}m ${secs}s`;
    else return `${secs}s`;
  };

  // Connexion WebSocket pour les logs
  useEffect(() => {
    const connectWebSocket = () => {
      const ws = new WebSocket(`${WS_URL}/ws/logs`);
      
      ws.onopen = () => {
        console.log('WebSocket connecté');
      };

      ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        if (data.type === 'log') {
          setLogs(prev => [...prev.slice(-200), data.data]);
        }
      };

      ws.onerror = (error) => {
        console.error('Erreur WebSocket:', error);
      };

      ws.onclose = () => {
        console.log('WebSocket déconnecté, reconnexion...');
        setTimeout(connectWebSocket, 3000);
      };

      wsRef.current = ws;
    };

    connectWebSocket();

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, []);

  // Auto-scroll des logs
  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  // Récupération périodique du statut
  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const res = await fetch(`${API_URL}/api/server/status`);
        const data = await res.json();
        setServerStatus(data);
      } catch (error) {
        console.error('Erreur récupération statut:', error);
      }
    };

    fetchStatus();
    const interval = setInterval(fetchStatus, 3000);
    return () => clearInterval(interval);
  }, []);

  // Récupération périodique des stats
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch(`${API_URL}/api/server/stats`);
        const data = await res.json();
        setStats(data);
      } catch (error) {
        console.error('Erreur récupération stats:', error);
      }
    };

    if (serverStatus.container === 'running') {
      fetchStats();
      const interval = setInterval(fetchStats, 5000);
      return () => clearInterval(interval);
    }
  }, [serverStatus.container]);

  // Récupération périodique des joueurs
  useEffect(() => {
    const fetchPlayers = async () => {
      try {
        const res = await fetch(`${API_URL}/api/players`);
        const data = await res.json();
        setPlayers(data.players || []);
      } catch (error) {
        console.error('Erreur récupération joueurs:', error);
      }
    };

    if (serverStatus.server === 'running') {
      fetchPlayers();
      const interval = setInterval(fetchPlayers, 10000);
      return () => clearInterval(interval);
    }
  }, [serverStatus.server]);

  // Récupération de la version
  useEffect(() => {
    const fetchVersion = async () => {
      try {
        const res = await fetch(`${API_URL}/api/server/version`);
        const data = await res.json();
        setServerVersion(data);
      } catch (error) {
        console.error('Erreur récupération version:', error);
      }
    };

    if (serverStatus.server === 'running') {
      fetchVersion();
    }
  }, [serverStatus.server]);

  // Polling pour détecter l'URL OAuth pendant une mise à jour
  useEffect(() => {
    if (!loading.update) {
      setOauthUrl(null); // Reset quand pas en update
      return;
    }
    
    const checkOAuth = setInterval(async () => {
      try {
        const res = await fetch(`${API_URL}/api/server/oauth-url`);
        const data = await res.json();
        if (data.active && data.url) {
          setOauthUrl(data.url);
        } else if (!data.active && oauthUrl) {
          // L'auth est terminée
          setOauthUrl(null);
        }
      } catch (error) {
        console.error('Erreur vérification OAuth:', error);
      }
    }, 3000);
    
    return () => clearInterval(checkOAuth);
  }, [loading.update, oauthUrl]);

  const handleServerAction = async (action) => {
    setLoading({ ...loading, [action]: true });
    try {
      const res = await fetch(`${API_URL}/api/server/${action}`, { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
    } catch (error) {
      alert(`Erreur: ${error.message}`);
    } finally {
      setLoading({ ...loading, [action]: false });
    }
  };

  const handleUpdate = async () => {
    if (!window.confirm('Voulez-vous mettre à jour le serveur ? Il sera redémarré automatiquement.')) {
      return;
    }
    
    setLoading({ ...loading, update: true });
    try {
      const res = await fetch(`${API_URL}/api/server/update`, { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      
      // La mise à jour est lancée, on surveille l'OAuth dans le useEffect
      alert('Mise à jour lancée ! Surveillez les logs. Si une authentification est requise, une popup apparaîtra.');
    } catch (error) {
      alert(`Erreur: ${error.message}`);
      setLoading({ ...loading, update: false });
    }
    
    // On garde loading.update à true jusqu'à ce que le serveur redémarre
    setTimeout(() => {
      setLoading({ ...loading, update: false });
    }, 120000); // Timeout de 2 minutes
  };

  const handlePlayerAction = async (playerName, action) => {
    try {
      const res = await fetch(`${API_URL}/api/players/${playerName}/${action}`, { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      alert(data.message);
    } catch (error) {
      alert(`Erreur: ${error.message}`);
    }
  };

  const handleCommandSubmit = (e) => {
    e.preventDefault();
    if (!command.trim()) return;

    setCommandHistory([...commandHistory, command]);
    
    fetch(`${API_URL}/api/commands/execute`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ command })
    })
    .then(res => res.json())
    .then(data => {
      if (data.error) throw new Error(data.error);
      setCommand('');
    })
    .catch(error => alert(`Erreur: ${error.message}`));
  };

  const getStatusColor = (status) => {
    if (status === 'running') return 'text-green-500';
    if (status === 'stopped') return 'text-red-500';
    return 'text-yellow-500';
  };

  const getStatusBg = (status) => {
    if (status === 'running') return 'bg-green-100 border-green-300';
    if (status === 'stopped') return 'bg-red-100 border-red-300';
    return 'bg-yellow-100 border-yellow-300';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <div className="container mx-auto px-4 py-8">
        <header className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">🎮 Hytale Server Manager</h1>
          <p className="text-slate-400">Interface de gestion pour votre serveur Hytale</p>
        </header>

        {/* Statut du serveur */}
        <div className={`p-6 rounded-lg border-2 mb-6 ${getStatusBg(serverStatus.server)}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Activity className={`w-8 h-8 ${getStatusColor(serverStatus.server)}`} />
              <div>
                <h2 className="text-xl font-bold text-slate-800">Statut du Serveur</h2>
                <p className="text-slate-600">
                  Serveur: <span className={`font-bold ${getStatusColor(serverStatus.server)}`}>
                    {serverStatus.server.toUpperCase()}
                  </span>
                  {serverStatus.pid && ` (PID: ${serverStatus.pid})`}
                </p>
              </div>
            </div>
            
            <div className="flex gap-2">
              <button
                onClick={() => handleServerAction('start')}
                disabled={serverStatus.server === 'running' || loading.start}
                className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2"
              >
                <Play className="w-4 h-4" />
                {loading.start ? 'Démarrage...' : 'Démarrer'}
              </button>
              
              <button
                onClick={() => handleServerAction('stop')}
                disabled={serverStatus.server === 'stopped' || loading.stop}
                className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2"
              >
                <Square className="w-4 h-4" />
                {loading.stop ? 'Arrêt...' : 'Arrêter'}
              </button>
              
              <button
                onClick={() => handleServerAction('restart')}
                disabled={loading.restart}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2"
              >
                <RotateCw className="w-4 h-4" />
                {loading.restart ? 'Redémarrage...' : 'Redémarrer'}
              </button>

              <button
                onClick={handleUpdate}
                disabled={loading.update}
                className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                {loading.update ? 'Mise à jour...' : 'Mettre à jour'}
              </button>
            </div>
          </div>

          {/* Stats */}
          {serverStatus.container === 'running' && (
            <div className="grid grid-cols-4 gap-4 mt-6">
              <div className="bg-white bg-opacity-50 p-4 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Cpu className="w-5 h-5 text-blue-600" />
                  <span className="font-semibold text-slate-700">CPU</span>
                </div>
                <p className="text-2xl font-bold text-slate-800">{stats.cpu}%</p>
              </div>
              
              <div className="bg-white bg-opacity-50 p-4 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <HardDrive className="w-5 h-5 text-purple-600" />
                  <span className="font-semibold text-slate-700">Mémoire</span>
                </div>
                <p className="text-2xl font-bold text-slate-800">{stats.memory.percent}%</p>
                <p className="text-xs text-slate-600">{stats.memory.used} / {stats.memory.limit} MB</p>
              </div>
              
              <div className="bg-white bg-opacity-50 p-4 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="w-5 h-5 text-green-600" />
                  <span className="font-semibold text-slate-700">Uptime</span>
                </div>
                <p className="text-lg font-bold text-slate-800">
                  {serverStatus.uptime ? formatUptime(serverStatus.uptime) : 'N/A'}
                </p>
              </div>

              <div className="bg-white bg-opacity-50 p-4 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Activity className="w-5 h-5 text-orange-600" />
                  <span className="font-semibold text-slate-700">Version</span>
                </div>
                <p className="text-lg font-bold text-slate-800">{serverVersion.current}</p>
                {serverVersion.revision && (
                  <p className="text-xs text-slate-600">Rev: {serverVersion.revision}</p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Popup OAuth */}
        {oauthUrl && (
          <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
            <div className="bg-white p-8 rounded-lg max-w-lg w-full shadow-2xl">
              <h2 className="text-2xl font-bold mb-4 text-slate-800 flex items-center gap-2">
                <Download className="w-6 h-6 text-purple-600" />
                🔐 Authentification OAuth requise
              </h2>
              <p className="mb-4 text-slate-600">
                Le téléchargeur Hytale nécessite une authentification pour accéder aux fichiers de mise à jour.
              </p>
              <div className="bg-slate-100 p-4 rounded mb-4 border border-slate-300">
                <p className="text-sm font-mono text-slate-700 break-all">{oauthUrl}</p>
              </div>
              <a
                href={oauthUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="block w-full px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 text-center font-semibold mb-3 transition-colors"
              >
                🔗 Cliquer ici pour s'authentifier
              </a>
              <p className="text-sm text-slate-500 mb-4">
                ⏱️ Une fois authentifié dans votre navigateur, la mise à jour continuera automatiquement.
                <br />
                💡 Vous avez 15 minutes pour compléter l'authentification.
              </p>
              <button
                onClick={() => setOauthUrl(null)}
                className="text-sm text-slate-400 hover:text-slate-600 underline"
              >
                Fermer cette popup (l'authentification est toujours active)
              </button>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Joueurs */}
          <div className="bg-slate-800 p-6 rounded-lg border border-slate-700">
            <div className="flex items-center gap-2 mb-4">
              <Users className="w-6 h-6 text-blue-400" />
              <h2 className="text-xl font-bold text-white">
                Joueurs Connectés ({players.length})
              </h2>
            </div>
            
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {players.length === 0 ? (
                <p className="text-slate-400 italic">Aucun joueur connecté</p>
              ) : (
                players.map((player) => (
                  <div key={player.name} className="bg-slate-700 p-3 rounded flex justify-between items-center">
                    <div>
                      <p className="font-semibold text-white">{player.name}</p>
                      <p className="text-xs text-slate-400">{new Date(player.joinedAt).toLocaleTimeString('fr-FR')}</p>
                    </div>
                    <div className="flex gap-1">
                      <button
                        onClick={() => handlePlayerAction(player.name, 'op')}
                        className="px-2 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700"
                        title="Op"
                      >
                        OP
                      </button>
                      <button
                        onClick={() => handlePlayerAction(player.name, 'kick')}
                        className="px-2 py-1 bg-yellow-600 text-white text-xs rounded hover:bg-yellow-700"
                        title="Kick"
                      >
                        Kick
                      </button>
                      <button
                        onClick={() => handlePlayerAction(player.name, 'ban')}
                        className="px-2 py-1 bg-red-600 text-white text-xs rounded hover:bg-red-700"
                        title="Ban"
                      >
                        Ban
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Console */}
          <div className="bg-slate-800 p-6 rounded-lg border border-slate-700">
            <div className="flex items-center gap-2 mb-4">
              <Terminal className="w-6 h-6 text-green-400" />
              <h2 className="text-xl font-bold text-white">Console</h2>
            </div>
            
            <div className="bg-black p-4 rounded font-mono text-sm h-64 overflow-y-auto mb-4">
              {logs.slice(-50).map((log, i) => (
                <div key={i} className="text-green-400 whitespace-pre-wrap break-all">
                  {log}
                </div>
              ))}
              <div ref={logsEndRef} />
            </div>
            
            <form onSubmit={handleCommandSubmit} className="flex gap-2">
              <input
                type="text"
                value={command}
                onChange={(e) => setCommand(e.target.value)}
                placeholder="/command"
                className="flex-1 px-3 py-2 bg-slate-700 text-white rounded border border-slate-600 focus:outline-none focus:border-blue-500"
                disabled={serverStatus.server !== 'running'}
              />
              <button
                type="submit"
                disabled={serverStatus.server !== 'running' || !command.trim()}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed"
              >
                Envoyer
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
