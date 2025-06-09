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
    color: 'bg-green-500', 
    textColor: 'text-green-600',
    icon: Activity,
    interval: '2 minutes'
  },
  SLEEP: { 
    emoji: '😴', 
    color: 'bg-yellow-500', 
    textColor: 'text-yellow-600',
    icon: Moon,
    interval: '24 hours'
  },
  HIBERNATE: { 
    emoji: '🐻', 
    color: 'bg-blue-500', 
    textColor: 'text-blue-600',
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
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  const currentMode = status?.currentMode || 'HIBERNATE';
  const modeConfig = MODE_CONFIG[currentMode];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            📸 Flickr Smart Uploader
          </h1>
          <div className="flex items-center justify-center gap-2">
            {isOnline ? (
              <Wifi className="w-5 h-5 text-green-500" />
            ) : (
              <WifiOff className="w-5 h-5 text-red-500" />
            )}
            <span className={`text-sm ${isOnline ? 'text-green-600' : 'text-red-600'}`}>
              {isOnline ? 'Connected' : 'Offline'}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Current Mode</h3>
              <div className={`w-3 h-3 rounded-full ${modeConfig.color}`}></div>
            </div>
            <div className="text-center">
              <div className="text-3xl mb-2">{modeConfig.emoji}</div>
              <div className={`text-xl font-bold ${modeConfig.textColor}`}>
                {currentMode}
              </div>
              <div className="text-sm text-gray-500 mt-1">
                Check every {modeConfig.interval}
              </div>
              {status && (
                <div className="text-xs text-gray-400 mt-2">
                  Running for {formatDuration(status.timeInMode.hours, status.timeInMode.minutes)}
                </div>
              )}
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Photos Uploaded</h3>
              <Upload className="w-5 h-5 text-blue-500" />
            </div>
            <div className="text-3xl font-bold text-blue-600">
              {status?.stats.totalPhotosUploaded || 0}
            </div>
            <div className="text-sm text-gray-500">
              {status?.stats.uploadsToday || 0} today
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Albums Created</h3>
              <FolderCheck className="w-5 h-5 text-green-500" />
            </div>
            <div className="text-3xl font-bold text-green-600">
              {status?.stats.totalAlbumsCreated || 0}
            </div>
            <div className="text-sm text-gray-500">
              {status?.processedFoldersCount || 0} folders processed
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Last Activity</h3>
              <Clock className="w-5 h-5 text-purple-500" />
            </div>
            <div className="text-sm text-gray-600">
              {formatTime(status?.lastActivity)}
            </div>
            <div className="text-xs text-gray-400 mt-1">
              Last upload: {formatTime(status?.stats.lastUploadTime)}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
            🎛️ Control Panel
          </h2>
          
          <div className="text-center mb-8">
            <button
              onClick={handleWakeUp}
              disabled={actionLoading === 'wake-up' || currentMode === 'ACTIVE'}
              className="bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 disabled:from-gray-400 disabled:to-gray-500 text-white font-bold py-4 px-8 rounded-full text-xl transition-all duration-200 transform hover:scale-105 disabled:scale-100 shadow-lg"
            >
              {actionLoading === 'wake-up' ? (
                <RefreshCw className="w-6 h-6 animate-spin inline mr-2" />
              ) : (
                <Power className="w-6 h-6 inline mr-2" />
              )}
              {currentMode === 'ACTIVE' ? 'Already Active' : 'Wake Up Watcher'}
            </button>
            <p className="text-sm text-gray-500 mt-2">
              Instantly switch to ACTIVE mode for 48 hours
            </p>
          </div>

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
                  className={`p-4 rounded-lg border-2 transition-all duration-200 ${
                    isActive
                      ? `border-${config.color.split('-')[1]}-500 bg-${config.color.split('-')[1]}-50`
                      : 'border-gray-200 hover:border-gray-300 bg-white hover:bg-gray-50'
                  } disabled:opacity-50`}
                >
                  <div className="flex items-center justify-center mb-2">
                    {isLoading ? (
                      <RefreshCw className="w-6 h-6 animate-spin" />
                    ) : (
                      <Icon className={`w-6 h-6 ${isActive ? config.textColor : 'text-gray-400'}`} />
                    )}
                  </div>
                  <div className={`font-semibold ${isActive ? config.textColor : 'text-gray-600'}`}>
                    {config.emoji} {mode}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {config.interval}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-xl font-bold text-gray-900 mb-4">
            📁 Processed Folders ({folders.length})
          </h3>
          <div className="max-h-64 overflow-y-auto">
            {folders.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No folders processed yet</p>
            ) : (
              <div className="space-y-2">
                {folders.map((folder, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <div className="font-medium text-gray-900">{folder.folderName}</div>
                      <div className="text-sm text-gray-500">{folder.eventName}</div>
                    </div>
                    <div className="text-green-600">✅</div>
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
