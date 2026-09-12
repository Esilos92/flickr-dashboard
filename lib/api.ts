const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "https://upload.galaxygirl.live";

/* ------------------------------------------------------------------ */
/* Shapes returned by the uploader's API server                        */
/* ------------------------------------------------------------------ */

export type Mode = "ACTIVE" | "SLEEP" | "HIBERNATE";

export interface WatcherStatus {
  currentMode: Mode;
  modeStartTime: number;
  lastActivity: number | null;
  timeInMode: { hours: number; minutes: number; total: number };
  stats: {
    totalPhotosUploaded: number;
    totalAlbumsCreated: number;
    totalFoldersProcessed: number;
    lastUploadTime: number | string | null;
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

interface ApiEnvelope<T> {
  success: boolean;
  data?: T;
  message?: string;
}

/*
  Every call returns ok/false rather than null, so the UI can tell the
  difference between "the server says zero" and "we could not ask".
  The old version returned 0 for both, which made an outage look like an
  idle system.
*/
export type Result<T> =
  | { ok: true; data: T }
  | { ok: false; error: string };

const TIMEOUT_MS = 12_000;

async function call<T>(path: string, init?: RequestInit): Promise<Result<T>> {
  try {
    const res = await fetch(`${API_BASE_URL}${path}`, {
      ...init,
      signal: AbortSignal.timeout(TIMEOUT_MS),
      cache: "no-store",
    });
    if (!res.ok) {
      return { ok: false, error: `Server returned ${res.status}` };
    }
    const body: ApiEnvelope<T> = await res.json();
    if (!body.success) {
      return { ok: false, error: body.message || "Request was rejected" };
    }
    return { ok: true, data: body.data as T };
  } catch (err) {
    const msg =
      err instanceof DOMException && err.name === "TimeoutError"
        ? "Server did not respond in time"
        : "Could not reach the server";
    return { ok: false, error: msg };
  }
}

export const getWatcherStatus = () => call<WatcherStatus>("/api/status");

export const getUnprocessedCount = () =>
  call<{ unprocessedCount: number; cached?: boolean }>("/api/unprocessed-count");

export const getProcessedFolders = () =>
  call<{ folders: ProcessedFolder[]; total: number }>("/api/processed-folders");

export const checkApiHealth = () =>
  call<unknown>("/api/health").then((r) => r.ok);

export const wakeUpWatcher = () =>
  call<unknown>("/api/wake-up", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
  });

export const setWatcherMode = (mode: Mode, reason?: string) =>
  call<unknown>("/api/set-mode", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ mode, reason }),
  });
