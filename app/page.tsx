'use client';

import { useState, useEffect } from 'react';
import { 
  Power, 
  Activity, 
  Moon, 
  Pause, 
  Upload, 
  FolderCheck, 
  Clock, 
  Wifi,
  WifiOff,
  RefreshCw
} from 'lucide-react';
import { 
  getWatcherStatus, 
  wakeUpWatcher, 
  setWatcherMode, 
  getProcessedFolders,
  checkApiHealth,
  type WatcherStatus, 
  type ProcessedFolder 
} from '@/lib/api';

const MODE_CONFIG = {
  ACTIVE: { 
    emoji: '🚀', 
    color: 'bg-emerald-500', 
    textColor: 'text-emerald-400',
    glowColor: 'shadow-emerald-500/20',
    icon: Activity,
    interval: '2 minutes'
  },
  SLEEP: { 
    emoji: '😴', 
    color: 'bg-amber-500', 
    textColor: 'text-amber-400',
    glowColor: 'shadow-amber-500/20',
    icon: Moon,
    interval: '24 hours'
  },
  HIBERNATE: { 
    emoji: '🐻', 
    color: 'bg-cyan-500', 
    textColor: 'text-cyan-400',
    glowColor: 'shadow-cyan-500/20',
    icon: Pause,
    interval: '7 days'
  }
};

export default function Dashboard() {
  const [status, setStatus] = useState<WatcherStatus | null>(null);
  const [folders, setFolders] = useState<ProcessedFolder[]>([]);
  const [isOnline, setIsOnline] = useState(false);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchData = async () => {
    const [statusData, foldersData, healthCheck] = await Promise.all([
      getWatcherStatus(),
      getProcessedFolders(),
      checkApiHealth()
    ]);

    setStatus(statusData);
    setFolders(foldersData);
    setIsOnline(healthCheck);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
  }, []);

  const handleWakeUp = async () => {
    setActionLoading('wake-up');
    const success = await wakeUpWatcher();
    if (success) {
      await fetchData();
    }
    setActionLoading(null);
  };

  const handleModeChange = async (mode: 'ACTIVE' | 'SLEEP' | 'HIBERNATE') => {
    setActionLoading(mode);
    const success = await setWatcherMode(mode, `Manual switch from dashboard`);
    if (success) {
      await fetchData();
    }
    setActionLoading(null);
  };

  const formatTime = (timestamp: number | null | undefined) => {
    if (!timestamp) return 'Never';
    return new Date(timestamp).toLocaleString();
  };

  const formatDuration = (hours: number, minutes: number) => {
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-purple-900 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin text-cyan-400 mx-auto mb-4 drop-shadow-lg" />
          <p className="text-gray-300 font-mono">INITIALIZING NEURAL INTERFACE...</p>
        </div>
      </div>
    );
  }

  const currentMode = status?.currentMode || 'HIBERNATE';
  const modeConfig = MODE_CONFIG[currentMode];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-purple-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Cyberpunk Header */}
        <div className="text-center mb-8">
          <h1 className="text-5xl font-bold bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 bg-clip-text text-transparent mb-4 font-mono tracking-wider">
            📸 FLICKR NEURAL NET
          </h1>
          <div className="flex items-center justify-center gap-2">
            {isOnline ? (
              <Wifi className="w-5 h-5 text-emerald-400 drop-shadow-lg animate-pulse" />
            ) : (
              <WifiOff className="w-5 h-5 text-red-400 drop-shadow-lg" />
            )}
            <span className={`text-sm font-mono ${isOnline ? 'text-emerald-400' : 'text-red-400'}`}>
              {isOnline ? 'NEURAL LINK ACTIVE' : 'CONNECTION SEVERED'}
            </span>
          </div>
        </div>

        {/* Glowing Status Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className={`bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl shadow-2xl ${modeConfig.glowColor} p-6 hover:shadow-xl transition-all duration-300`}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-100 font-mono">SYSTEM MODE</h3>
              <div className={`w-3 h-3 rounded-full ${modeConfig.color} animate-pulse shadow-lg`}></div>
            </div>
            <div className="text-center">
              <div className="text-3xl mb-2">{modeConfig.emoji}</div>
              <div className={`text-xl font-bold ${modeConfig.textColor} font-mono`}>
                {currentMode}
              </div>
              <div className="text-sm text-gray-400 mt-1 font-mono">
                SCAN: {modeConfig.interval}
              </div>
              {status && (
                <div className="text-xs text-gray-500 mt-2 font-mono">
                  RUNTIME: {formatDuration(status.timeInMode.hours, status.timeInMode.minutes)}
                </div>
              )}
            </div>
          </div>

          <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl shadow-2xl shadow-blue-500/20 p-6 hover:shadow-xl transition-all duration-300">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-100 font-mono">DATA UNITS</h3>
              <Upload className="w-5 h-5 text-blue-400" />
            </div>
            <div className="text-3xl font-bold text-blue-400 font-mono">
              {status?.stats.totalPhotosUploaded || 0}
            </div>
            <div className="text-sm text-gray-400 font-mono">
              {status?.stats.uploadsToday || 0} TODAY
            </div>
          </div>

          <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl shadow-2xl shadow-emerald-500/20 p-6 hover:shadow-xl transition-all duration-300">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-100 font-mono">CONTAINERS</h3>
              <FolderCheck className="w-5 h-5 text-emerald-400" />
            </div>
            <div className="text-3xl font-bold text-emerald-400 font-mono">
              0
            </div>
            <div className="text-sm text-gray-400 font-mono">
              {status?.processedFoldersCount || 0} PROCESSED
            </div>
          </div>

          <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl shadow-2xl shadow-purple-500/20 p-6 hover:shadow-xl transition-all duration-300">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-100 font-mono">LAST PULSE</h3>
              <Clock className="w-5 h-5 text-purple-400" />
            </div>
            <div className="text-sm text-gray-300 font-mono">
              {formatTime(status?.lastActivity)}
            </div>
            <div className="text-xs text-gray-500 mt-1 font-mono">
              UPLOAD: {formatTime(status?.stats.lastUploadTime)}
            </div>
          </div>
        </div>

        {/* Cyberpunk Control Panel */}
        <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl shadow-2xl p-8 mb-8">
          <h2 className="text-2xl font-bold text-gray-100 mb-6 text-center font-mono tracking-wider">
            🎛️ NEURAL COMMAND CENTER
          </h2>
          
          {/* Epic Wake Up Button */}
          <div className="text-center mb-8">
            <button
              onClick={handleWakeUp}
              disabled={actionLoading === 'wake-up' || currentMode === 'ACTIVE'}
              className="bg-gradient-to-r from-red-600 via-pink-600 to-purple-600 hover:from-red-500 hover:via-pink-500 hover:to-purple-500 disabled:from-gray-600 disabled:to-gray-700 text-white font-bold py-4 px-8 rounded-full text-xl transition-all duration-200 transform hover:scale-105 disabled:scale-100 shadow-2xl shadow-red-500/25 border border-red-400/20 font-mono tracking-wide"
            >
              {actionLoading === 'wake-up' ? (
                <RefreshCw className="w-6 h-6 animate-spin inline mr-2" />
              ) : (
                <Power className="w-6 h-6 inline mr-2" />
              )}
              {currentMode === 'ACTIVE' ? 'SYSTEM ONLINE' : 'ACTIVATE NEURAL NET'}
            </button>
            <p className="text-sm text-gray-400 mt-2 font-mono">
              EMERGENCY PROTOCOL: FORCE ACTIVE MODE FOR 48H
            </p>
          </div>

          {/* Mode Selection Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {Object.entries(MODE_CONFIG).map(([mode, config]) => {
              const Icon = config.icon;
              const isActive = currentMode === mode;
              const isLoading = actionLoading === mode;
              
              return (
                <button
                  key={mode}
                  onClick={() => handleModeChange(mode as 'ACTIVE' | 'SLEEP' | 'HIBERNATE')}
                  disabled={isActive || isLoading}
                  className={`p-4 rounded-lg border-2 transition-all duration-200 font-mono ${
                    isActive
                      ? `border-${config.color.split('-')[1]}-400 bg-${config.color.split('-')[1]}-900/20 ${config.glowColor}`
                      : 'border-gray-600 hover:border-gray-500 bg-gray-800/30 hover:bg-gray-700/30'
                  } disabled:opacity-50`}
                >
                  <div className="flex items-center justify-center mb-2">
                    {isLoading ? (
                      <RefreshCw className="w-6 h-6 animate-spin text-cyan-400" />
                    ) : (
                      <Icon className={`w-6 h-6 ${isActive ? config.textColor : 'text-gray-400'}`} />
                    )}
                  </div>
                  <div className={`font-semibold ${isActive ? config.textColor : 'text-gray-300'}`}>
                    {config.emoji} {mode}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {config.interval.toUpperCase()}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Data Archive */}
        <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl shadow-2xl p-6">
          <h3 className="text-xl font-bold text-gray-100 mb-4 font-mono tracking-wide">
            📁 DATA ARCHIVE ({folders.length})
          </h3>
          <div className="max-h-64 overflow-y-auto">
            {folders.length === 0 ? (
              <p className="text-gray-400 text-center py-8 font-mono">NO DATA PACKETS PROCESSED</p>
            ) : (
              <div className="space-y-2">
                {folders.map((folder, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-700/30 rounded-lg border border-gray-600/30 hover:bg-gray-600/30 transition-colors duration-200">
                    <div>
                      <div className="font-medium text-gray-100 font-mono">{folder.folderName}</div>
                      <div className="text-sm text-gray-400 font-mono">{folder.eventName}</div>
                    </div>
                    <div className="text-emerald-400 font-mono">✅ UPLOADED</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
