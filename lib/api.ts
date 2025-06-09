const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://10.108.0.2:3001';

export interface WatcherStatus {
  currentMode: 'ACTIVE' | 'SLEEP' | 'HIBERNATE';
  modeStartTime: number;
  lastActivity: number | null;
  timeInMode: {
    hours: number;
    minutes: number;
    total: number;
  };
  stats: {
    totalPhotosUploaded: number;
    totalAlbumsCreated: number;
    totalFoldersProcessed: number;
    lastUploadTime: number | null;
    uploadsToday: number;
  };
  processedFoldersCount: number;
  isOnline: boolean;
  lastChecked: number;
}

export interface ProcessedFolder {
  path: string;
  folderName: string;
  eventName: string;
  processed: boolean;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
}

// Get current watcher status
export async function getWatcherStatus(): Promise<WatcherStatus | null> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/status`);
    const result: ApiResponse<WatcherStatus> = await response.json();
    return result.success ? result.data || null : null;
  } catch (error) {
    console.error('Failed to fetch watcher status:', error);
    return null;
  }
}

// Wake up the watcher (force ACTIVE mode)
export async function wakeUpWatcher(): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/wake-up`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    const result: ApiResponse<any> = await response.json();
    return result.success;
  } catch (error) {
    console.error('Failed to wake up watcher:', error);
    return false;
  }
}

// Set specific mode
export async function setWatcherMode(mode: 'ACTIVE' | 'SLEEP' | 'HIBERNATE', reason?: string): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/set-mode`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ mode, reason }),
    });
    const result: ApiResponse<any> = await response.json();
    return result.success;
  } catch (error) {
    console.error('Failed to set watcher mode:', error);
    return false;
  }
}

// Get processed folders
export async function getProcessedFolders(): Promise<ProcessedFolder[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/processed-folders`);
    const result: ApiResponse<{ folders: ProcessedFolder[]; total: number }> = await response.json();
    return result.success ? result.data?.folders || [] : [];
  } catch (error) {
    console.error('Failed to fetch processed folders:', error);
    return [];
  }
}

// Health check
export async function checkApiHealth(): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/health`);
    const result: ApiResponse<any> = await response.json();
    return result.success;
  } catch (error) {
    console.error('API health check failed:', error);
    return false;
  }
}
