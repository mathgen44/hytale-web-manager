import React, { useState, useEffect, useRef } from 'react';
import { 
  Play, Square, RotateCw, Users, Terminal, Activity, HardDrive, 
  Cpu, Clock, Settings, Moon, Sun, Download, Upload, 
  AlertCircle, CheckCircle, XCircle, TrendingUp, Zap,
  Package, Trash2, Power, PowerOff, RefreshCw, AlertTriangle, ExternalLink
} from 'lucide-react';

// CORRECTION: Utiliser des URLs relatives
const API_URL = '';  // URL relative
const WS_URL = `ws://${window.location.host}`;

// Composant Toast pour les notifications
const Toast = ({ message, type, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 4000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const icons = {
    success: <CheckCircle className="w-5 h-5" />,
    error: <XCircle className="w-5 h-5" />,
    warning: <AlertCircle className="w-5 h-5" />,
  };

  const colors = {
    success: 'bg-green-500',
    error: 'bg-red-500',
    warning: 'bg-yellow-500',
  };

  return (
    <div className={`fixed top-4 right-4 ${colors[type]} text-white px-6 py-3 rounded-lg shadow-lg flex items-center gap-3 animate-slide-in z-50`}>
      {icons[type]}
      <span>{message}</span>
    </div>
  );
};

// Composant carte de statistique
const StatCard = ({ icon: Icon, label, value, subtitle, color = 'blue', trend }) => (
  <div className="bg-gradient-to-br from-slate-800 to-slate-900 p-6 rounded-xl border border-slate-700 hover:border-slate-600 transition-all duration-300 hover:shadow-xl hover:scale-105">
    <div className="flex items-start justify-between mb-3">
      <div className={`p-3 rounded-lg bg-${color}-500 bg-opacity-20`}>
        <Icon className={`w-6 h-6 text-${color}-400`} />
      </div>
      {trend && (
        <div className={`flex items-center gap-1 text-sm ${trend > 0 ? 'text-green-400' : 'text-red-400'}`}>
          <TrendingUp className={`w-4 h-4 ${trend < 0 ? 'rotate-180' : ''}`} />
          <span>{Math.abs(trend)}%</span>
        </div>
      )}
    </div>
    <div>
      <p className="text-slate-400 text-sm font-medium mb-1">{label}</p>
      <p className="text-3xl font-bold text-white mb-1">{value}</p>
      {subtitle && <p className="text-slate-500 text-xs">{subtitle}</p>}
    </div>
  </div>
);

// Composant bouton d'action
const ActionButton = ({ icon: Icon, label, onClick, disabled, variant = 'primary', loading }) => {
  const variants = {
    primary: 'bg-blue-600 hover:bg-blue-700 text-white',
    success: 'bg-green-600 hover:bg-green-700 text-white',
    danger: 'bg-red-600 hover:bg-red-700 text-white',
    secondary: 'bg-slate-700 hover:bg-slate-600 text-white',
    purple: 'bg-purple-600 hover:bg-purple-700 text-white',
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled || loading}
      className={`${variants[variant]} px-6 py-3 rounded-lg font-medium flex items-center gap-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg active:scale-95`}
    >
      {loading ? (
        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
      ) : (
        <Icon className="w-5 h-5" />
      )}
      <span>{loading ? 'En cours...' : label}</span>
    </button>
  );
};

function App() {
  // États
  const [serverStatus, setServerStatus] = useState({ server: 'loading', container: 'loading' });
  const [stats, setStats] = useState({ cpu: '0', memory: { used: '0', limit: '0', percent: '0' } });
  const [players, setPlayers] = useState([]);
  const [logs, setLogs] = useState([]);
  const [command, setCommand] = useState('');
  const [commandHistory, setCommandHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [loading, setLoading] = useState({});
  const [toast, setToast] = useState(null);
  const [darkMode, setDarkMode] = useState(true);
  const [autoScroll, setAutoScroll] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  // 🆕 États pour la gestion des mods
  const [mods, setMods] = useState([]);
  const [modsLoading, setModsLoading] = useState(false);
  const [uploadingMod, setUploadingMod] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  
  const logsEndRef = useRef(null);
  const wsRef = useRef(null);
  const commandInputRef = useRef(null);

  // Fonction pour formater l'uptime
  const formatUptime = (seconds) => {
    if (!seconds) return 'N/A';
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (days > 0) return `${days}j ${hours}h ${minutes}m`;
    else if (hours > 0) return `${hours}h ${minutes}m ${secs}s`;
    else if (minutes > 0) return `${minutes}m ${secs}s`;
    else return `${secs}s`;
  };

  // Fonction pour afficher un toast
  const showToast = (message, type = 'success') => {
    setToast({ message, type });
  };

  // 🆕 Fonction pour récupérer les mods
  const fetchMods = async () => {
    try {
      const res = await fetch(`${API_URL}/api/mods`);
      const data = await res.json();
      setMods(data.mods || []);
    } catch (error) {
      console.error('Erreur récupération mods:', error);
    }
  };

  // 🆕 Handler pour l'upload de mod
  const handleModUpload = async (e) => {
    e.preventDefault();
    if (!selectedFile) {
      showToast('Veuillez sélectionner un fichier .jar', 'warning');
      return;
    }

    setUploadingMod(true);
    const formData = new FormData();
    formData.append('mod', selectedFile);

    try {
      const res = await fetch(`${API_URL}/api/mods/upload`, {
        method: 'POST',
        body: formData
      });

      const data = await res.json();
      
      if (!res.ok) throw new Error(data.error);

      showToast(data.message, 'success');
      setSelectedFile(null);
      
      const fileInput = document.getElementById('mod-file-input');
      if (fileInput) fileInput.value = '';

      await fetchMods();
    } catch (error) {
      showToast(`Erreur: ${error.message}`, 'error');
    } finally {
      setUploadingMod(false);
    }
  };

  // 🆕 Handler pour activer/désactiver un mod
  const handleToggleMod = async (filename, currentlyEnabled) => {
    try {
      const action = currentlyEnabled ? 'disable' : 'enable';
      const res = await fetch(`${API_URL}/api/mods/${filename}/${action}`, {
        method: 'POST'
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      showToast(data.message, 'success');
      
      if (data.requiresRestart) {
        showToast('Redémarrage du serveur recommandé', 'warning');
      }

      await fetchMods();
    } catch (error) {
      showToast(`Erreur: ${error.message}`, 'error');
    }
  };

  // 🆕 Handler pour supprimer un mod
  const handleDeleteMod = async (filename) => {
    if (!window.confirm(`Êtes-vous sûr de vouloir supprimer ${filename} ?`)) {
      return;
    }

    try {
      const res = await fetch(`${API_URL}/api/mods/${filename}`, {
        method: 'DELETE'
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      showToast(data.message, 'success');
      await fetchMods();
    } catch (error) {
      showToast(`Erreur: ${error.message}`, 'error');
    }
  };

  // 🆕 Handler pour rafraîchir les mods
  const handleRefreshMods = async () => {
    setModsLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/mods/scan`, {
        method: 'POST'
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      showToast(data.message, 'success');
      setMods(data.mods || []);
    } catch (error) {
      showToast(`Erreur: ${error.message}`, 'error');
    } finally {
      setModsLoading(false);
    }
  };

  // 🆕 Composant ModCard
  const ModCard = ({ mod }) => (
    <div className="bg-slate-700 p-5 rounded-lg hover:bg-slate-650 transition-all duration-200 group">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3 flex-1">
          <div className={`p-3 rounded-lg ${mod.enabled ? 'bg-green-500' : 'bg-slate-600'} bg-opacity-20`}>
            <Package className={`w-6 h-6 ${mod.enabled ? 'text-green-400' : 'text-slate-400'}`} />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-bold text-white text-lg">{mod.displayName}</h3>
              {mod.enabled ? (
                <span className="px-2 py-0.5 bg-green-500 bg-opacity-20 text-green-400 text-xs rounded-full">
                  Actif
                </span>
              ) : (
                <span className="px-2 py-0.5 bg-slate-600 text-slate-400 text-xs rounded-full">
                  Inactif
                </span>
              )}
            </div>
            <div className="flex items-center gap-4 text-xs text-slate-400">
              <span>📦 {mod.sizeFormatted}</span>
              <span>📅 {new Date(mod.lastModified).toLocaleDateString('fr-FR')}</span>
              <span className="px-2 py-0.5 bg-purple-500 bg-opacity-20 text-purple-400 rounded">
                {mod.type}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex gap-2 mt-3">
        <button
          onClick={() => handleToggleMod(mod.filename, mod.enabled)}
          className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
            mod.enabled 
              ? 'bg-yellow-600 hover:bg-yellow-700 text-white' 
              : 'bg-green-600 hover:bg-green-700 text-white'
          }`}
          title={mod.enabled ? "Désactiver" : "Activer"}
        >
          {mod.enabled ? (
            <>
              <PowerOff className="w-4 h-4 inline mr-1" />
              Désactiver
            </>
          ) : (
            <>
              <Power className="w-4 h-4 inline mr-1" />
              Activer
            </>
          )}
        </button>

        <button
          onClick={() => handleDeleteMod(mod.filename)}
          className="px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium transition-all duration-200"
          title="Supprimer"
        >
          <Trash2 className="w-4 h-4" />
        </button>

        <a
          href={`https://www.curseforge.com/hytale/search?page=1&pageSize=20&sortBy=relevancy&search=${encodeURIComponent(mod.displayName)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-all duration-200"
          title="Voir sur CurseForge"
        >
          <ExternalLink className="w-4 h-4" />
        </a>
      </div>
    </div>
  );

  // WebSocket pour les logs
  useEffect(() => {
    const connectWebSocket = () => {
      const ws = new WebSocket(`${WS_URL}/ws/logs`);
      
      ws.onopen = () => {
        console.log('✅ WebSocket connecté');
        showToast('Connexion aux logs établie', 'success');
      };

      ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        if (data.type === 'log') {
          setLogs(prev => [...prev.slice(-500), data.data]);
        }
      };

      ws.onerror = (error) => {
        console.error('❌ Erreur WebSocket:', error);
      };

      ws.onclose = () => {
        console.log('🔄 WebSocket déconnecté, reconnexion...');
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
    if (autoScroll) {
      logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs, autoScroll]);

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

  // 🆕 Charger les mods au démarrage
  useEffect(() => {
    fetchMods();
    const interval = setInterval(fetchMods, 30000); // Refresh toutes les 30s
    return () => clearInterval(interval);
  }, []);

  const handleServerAction = async (action) => {
    setLoading({ ...loading, [action]: true });
    try {
      const res = await fetch(`${API_URL}/api/server/${action}`, { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      showToast(`Serveur ${action === 'start' ? 'démarré' : action === 'stop' ? 'arrêté' : 'redémarré'} avec succès`, 'success');
    } catch (error) {
      showToast(`Erreur: ${error.message}`, 'error');
    } finally {
      setLoading({ ...loading, [action]: false });
    }
  };

  const handlePlayerAction = async (playerName, action) => {
    try {
      const res = await fetch(`${API_URL}/api/players/${playerName}/${action}`, { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      showToast(data.message, 'success');
    } catch (error) {
      showToast(`Erreur: ${error.message}`, 'error');
    }
  };

  const handleCommandSubmit = (e) => {
    e.preventDefault();
    if (!command.trim()) return;

    setCommandHistory([...commandHistory, command]);
    setHistoryIndex(-1);
    
    fetch(`${API_URL}/api/commands/execute`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ command })
    })
    .then(res => res.json())
    .then(data => {
      if (data.error) throw new Error(data.error);
      setCommand('');
      showToast('Commande exécutée', 'success');
    })
    .catch(error => showToast(`Erreur: ${error.message}`, 'error'));
  };

  const handleKeyDown = (e) => {
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (commandHistory.length > 0) {
        const newIndex = historyIndex + 1;
        if (newIndex < commandHistory.length) {
          setHistoryIndex(newIndex);
          setCommand(commandHistory[commandHistory.length - 1 - newIndex]);
        }
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (historyIndex > 0) {
        const newIndex = historyIndex - 1;
        setHistoryIndex(newIndex);
        setCommand(commandHistory[commandHistory.length - 1 - newIndex]);
      } else if (historyIndex === 0) {
        setHistoryIndex(-1);
        setCommand('');
      }
    }
  };

  const getStatusColor = (status) => {
    if (status === 'running') return 'text-green-400';
    if (status === 'stopped') return 'text-red-400';
    return 'text-yellow-400';
  };

  const getStatusBadge = (status) => {
    const colors = {
      running: 'bg-green-500',
      stopped: 'bg-red-500',
      loading: 'bg-yellow-500',
    };
    return (
      <div className="flex items-center gap-2">
        <div className={`w-3 h-3 rounded-full ${colors[status]} ${status === 'running' ? 'animate-pulse' : ''}`} />
        <span className={`font-semibold uppercase text-sm ${getStatusColor(status)}`}>
          {status}
        </span>
      </div>
    );
  };

  const filteredLogs = logs.filter(log => 
    searchQuery ? log.toLowerCase().includes(searchQuery.toLowerCase()) : true
  );

  return (
    <div className={`min-h-screen ${darkMode ? 'bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900' : 'bg-gradient-to-br from-slate-100 via-slate-50 to-slate-100'}`}>
      {/* Toast notifications */}
      {toast && (
        <Toast 
          message={toast.message} 
          type={toast.type} 
          onClose={() => setToast(null)} 
        />
      )}

      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <header className="mb-8 flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent mb-2">
              🎮 Hytale Server Manager
            </h1>
            <p className="text-slate-400">Interface de gestion professionnelle pour votre serveur Hytale</p>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setDarkMode(!darkMode)}
              className="p-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-white transition-all duration-200"
            >
              {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
            <button className="p-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-white transition-all duration-200">
              <Settings className="w-5 h-5" />
            </button>
          </div>
        </header>

        {/* Status Card */}
        <div className="mb-8 bg-gradient-to-r from-slate-800 to-slate-900 p-6 rounded-2xl border border-slate-700 shadow-2xl">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-6">
              <div className="p-4 rounded-xl bg-blue-500 bg-opacity-20">
                <Activity className="w-10 h-10 text-blue-400" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white mb-2">État du Serveur</h2>
                <div className="flex items-center gap-4">
                  <div>
                    <span className="text-slate-400 text-sm">Serveur: </span>
                    {getStatusBadge(serverStatus.server)}
                  </div>
                  {serverStatus.pid > 0 && (
                    <div className="text-slate-400 text-sm">
                      PID: <span className="text-white font-mono">{serverStatus.pid}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            <div className="flex gap-3 flex-wrap">
              <ActionButton
                icon={Play}
                label="Démarrer"
                onClick={() => handleServerAction('start')}
                disabled={serverStatus.server === 'running'}
                loading={loading.start}
                variant="success"
              />
              
              <ActionButton
                icon={Square}
                label="Arrêter"
                onClick={() => handleServerAction('stop')}
                disabled={serverStatus.server === 'stopped'}
                loading={loading.stop}
                variant="danger"
              />
              
              <ActionButton
                icon={RotateCw}
                label="Redémarrer"
                onClick={() => handleServerAction('restart')}
                disabled={serverStatus.server === 'stopped'}
                loading={loading.restart}
                variant="primary"
              />
            </div>
          </div>

          {/* Stats Grid */}
          {serverStatus.container === 'running' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
              <StatCard
                icon={Cpu}
                label="Utilisation CPU"
                value={`${stats.cpu}%`}
                color="blue"
              />
              
              <StatCard
                icon={HardDrive}
                label="Mémoire RAM"
                value={`${stats.memory.percent}%`}
                subtitle={`${stats.memory.used} / ${stats.memory.limit} MB`}
                color="purple"
              />
              
              <StatCard
                icon={Clock}
                label="Uptime"
                value={formatUptime(serverStatus.uptime)}
                color="green"
              />
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Joueurs */}
          <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 shadow-xl">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-lg bg-blue-500 bg-opacity-20">
                  <Users className="w-6 h-6 text-blue-400" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">Joueurs Connectés</h2>
                  <p className="text-slate-400 text-sm">{players.length} joueur{players.length > 1 ? 's' : ''} en ligne</p>
                </div>
              </div>
              <div className="flex items-center gap-2 text-2xl font-bold text-white">
                <Zap className="w-6 h-6 text-yellow-400" />
                {players.length}
              </div>
            </div>
            
            <div className="space-y-3 max-h-96 overflow-y-auto custom-scrollbar">
              {players.length === 0 ? (
                <div className="text-center py-12">
                  <Users className="w-16 h-16 text-slate-600 mx-auto mb-3" />
                  <p className="text-slate-400">Aucun joueur connecté</p>
                </div>
              ) : (
                players.map((player) => (
                  <div key={player.name} className="bg-slate-700 p-4 rounded-lg hover:bg-slate-600 transition-all duration-200 flex justify-between items-center group">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-bold">
                        {player.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-semibold text-white text-lg">{player.name}</p>
                        <p className="text-xs text-slate-400">
                          Connecté à {new Date(player.joinedAt).toLocaleTimeString('fr-FR')}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                      <button
                        onClick={() => handlePlayerAction(player.name, player.isOp ? 'deop' : 'op')}
                        className={`px-3 py-1.5 text-white text-xs rounded-lg transition-all duration-200 ${
                          player.isOp 
                            ? 'bg-blue-600 hover:bg-blue-700 ring-2 ring-blue-400' 
                            : 'bg-green-600 hover:bg-green-700'
                        }`}
                        title={player.isOp ? "Retirer OP" : "Promouvoir OP"}
                      >
                        {player.isOp ? '✓ OP' : 'OP'}
                      </button>
                      <button
                        onClick={() => handlePlayerAction(player.name, 'kick')}
                        className="px-3 py-1.5 bg-yellow-600 text-white text-xs rounded-lg hover:bg-yellow-700 transition-colors duration-200"
                        title="Expulser"
                      >
                        Kick
                      </button>
                      <button
                        onClick={() => handlePlayerAction(player.name, 'ban')}
                        className="px-3 py-1.5 bg-red-600 text-white text-xs rounded-lg hover:bg-red-700 transition-colors duration-200"
                        title="Bannir"
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
          <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-lg bg-green-500 bg-opacity-20">
                  <Terminal className="w-6 h-6 text-green-400" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">Console Serveur</h2>
                  <p className="text-slate-400 text-sm">Logs en temps réel</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setAutoScroll(!autoScroll)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 ${
                    autoScroll 
                      ? 'bg-green-600 text-white' 
                      : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                  }`}
                >
                  Auto-scroll {autoScroll ? 'ON' : 'OFF'}
                </button>
                <button
                  onClick={() => setLogs([])}
                  className="px-3 py-1.5 bg-slate-700 text-slate-300 rounded-lg text-xs font-medium hover:bg-slate-600 transition-all duration-200"
                >
                  Effacer
                </button>
              </div>
            </div>

            {/* Search bar */}
            <div className="mb-3">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Rechercher dans les logs..."
                className="w-full px-4 py-2 bg-slate-900 text-white rounded-lg border border-slate-700 focus:outline-none focus:border-blue-500 transition-colors duration-200 text-sm"
              />
            </div>
            
            <div className="bg-black p-4 rounded-lg font-mono text-sm h-64 overflow-y-auto custom-scrollbar mb-4">
              {filteredLogs.length === 0 ? (
                <div className="text-slate-500 text-center py-8">
                  {searchQuery ? 'Aucun résultat trouvé' : 'En attente des logs...'}
                </div>
              ) : (
                filteredLogs.slice(-100).map((log, i) => (
                  <div 
                    key={i} 
                    className="text-green-400 whitespace-pre-wrap break-all hover:bg-slate-900 px-2 py-1 rounded transition-colors duration-150"
                  >
                    {log}
                  </div>
                ))
              )}
              <div ref={logsEndRef} />
            </div>
            
            <form onSubmit={handleCommandSubmit} className="flex gap-2">
              <input
                ref={commandInputRef}
                type="text"
                value={command}
                onChange={(e) => setCommand(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="/command (↑↓ pour l'historique)"
                className="flex-1 px-4 py-3 bg-slate-700 text-white rounded-lg border border-slate-600 focus:outline-none focus:border-blue-500 transition-all duration-200"
                disabled={serverStatus.server !== 'running'}
              />
              <button
                type="submit"
                disabled={serverStatus.server !== 'running' || !command.trim()}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-slate-700 disabled:cursor-not-allowed transition-all duration-200 font-medium"
              >
                Envoyer
              </button>
            </form>
            <p className="text-slate-500 text-xs mt-2">
              Utilisez les flèches ↑↓ pour naviguer dans l'historique des commandes
            </p>
          </div>
        </div>

        {/* 🆕 Section Gestionnaire de Mods */}
        <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 shadow-xl mb-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-lg bg-purple-500 bg-opacity-20">
                <Package className="w-6 h-6 text-purple-400" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">Gestionnaire de Mods</h2>
                <p className="text-slate-400 text-sm">{mods.length} mod{mods.length > 1 ? 's' : ''} installé{mods.length > 1 ? 's' : ''}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleRefreshMods}
                disabled={modsLoading}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-all duration-200 flex items-center gap-2 disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${modsLoading ? 'animate-spin' : ''}`} />
                Rafraîchir
              </button>
              <a
                href="https://www.curseforge.com/hytale/mods"
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg text-sm font-medium transition-all duration-200 flex items-center gap-2"
              >
                <ExternalLink className="w-4 h-4" />
                CurseForge
              </a>
            </div>
          </div>

          {/* Upload Form */}
          <form onSubmit={handleModUpload} className="mb-6 p-4 bg-slate-700 rounded-lg border-2 border-dashed border-slate-600 hover:border-blue-500 transition-colors duration-200">
            <div className="flex flex-col md:flex-row items-center gap-4">
              <div className="flex-1 w-full">
                <label htmlFor="mod-file-input" className="block text-slate-300 text-sm font-medium mb-2">
                  <Upload className="w-4 h-4 inline mr-2" />
                  Sélectionner un fichier .jar
                </label>
                <input
                  id="mod-file-input"
                  type="file"
                  accept=".jar"
                  onChange={(e) => setSelectedFile(e.target.files[0])}
                  className="w-full px-4 py-2 bg-slate-600 text-white rounded-lg border border-slate-500 focus:outline-none focus:border-blue-500 text-sm"
                  disabled={uploadingMod}
                />
                {selectedFile && (
                  <p className="text-slate-400 text-xs mt-2">
                    📦 {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
                  </p>
                )}
              </div>
              <button
                type="submit"
                disabled={!selectedFile || uploadingMod}
                className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {uploadingMod ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Upload...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4" />
                    Upload
                  </>
                )}
              </button>
            </div>
            <div className="mt-3 flex items-start gap-2 text-xs text-slate-400">
              <AlertTriangle className="w-4 h-4 text-yellow-500 flex-shrink-0 mt-0.5" />
              <p>
                Téléchargez uniquement des mods depuis <strong className="text-orange-400">CurseForge</strong> ou des sources fiables. 
                Un redémarrage du serveur est nécessaire après l'installation.
              </p>
            </div>
          </form>

          {/* Mods List */}
          <div className="space-y-3 max-h-96 overflow-y-auto custom-scrollbar">
            {mods.length === 0 ? (
              <div className="text-center py-12">
                <Package className="w-16 h-16 text-slate-600 mx-auto mb-3" />
                <p className="text-slate-400 mb-2">Aucun mod installé</p>
                <p className="text-slate-500 text-sm">Uploadez un fichier .jar pour commencer</p>
              </div>
            ) : (
              mods.map((mod) => <ModCard key={mod.filename} mod={mod} />)
            )}
          </div>
        </div>
      </div>

      {/* Custom styles */}
      <style jsx>{`
        @keyframes slide-in {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }

        .animate-slide-in {
          animation: slide-in 0.3s ease-out;
        }

        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
        }

        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(15, 23, 42, 0.5);
          border-radius: 4px;
        }

        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(71, 85, 105, 0.8);
          border-radius: 4px;
        }

        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(100, 116, 139, 0.9);
        }
      `}</style>
    </div>
  );
}

export default App;
