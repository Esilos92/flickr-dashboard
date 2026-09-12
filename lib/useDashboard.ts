"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  getProcessedFolders,
  getUnprocessedCount,
  getWatcherStatus,
  type ProcessedFolder,
  type WatcherStatus,
} from "./api";

/*
  Three endpoints on three clocks. The folder list is 1,700+ rows and the
  unprocessed count walks Dropbox, so neither belongs on the 10s loop that
  the status badge needs.
*/
const STATUS_MS = 10_000;
const COUNT_MS = 45_000;
const FOLDERS_MS = 120_000;

/* Past this without a successful status read, the numbers on screen are
   history, not status — the UI says so rather than quietly showing them. */
export const STALE_AFTER_MS = 35_000;

export interface DashboardState {
  status: WatcherStatus | null;
  unprocessed: number | null;
  folders: ProcessedFolder[] | null;
  error: string | null;
  lastSuccessAt: number | null;
  loading: boolean;
  refreshing: boolean;
  refresh: () => Promise<void>;
}

export function useDashboard(): DashboardState {
  const [status, setStatus] = useState<WatcherStatus | null>(null);
  const [unprocessed, setUnprocessed] = useState<number | null>(null);
  const [folders, setFolders] = useState<ProcessedFolder[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [lastSuccessAt, setLastSuccessAt] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  const loadStatus = useCallback(async () => {
    const res = await getWatcherStatus();
    if (!mounted.current) return;
    if (res.ok) {
      setStatus(res.data);
      setError(null);
      setLastSuccessAt(Date.now());
    } else {
      setError(res.error);
    }
    setLoading(false);
  }, []);

  const loadCount = useCallback(async () => {
    const res = await getUnprocessedCount();
    if (!mounted.current) return;
    if (res.ok) setUnprocessed(res.data.unprocessedCount);
  }, []);

  const loadFolders = useCallback(async () => {
    const res = await getProcessedFolders();
    if (!mounted.current) return;
    if (res.ok) setFolders(res.data.folders ?? []);
  }, []);

  const refresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([loadStatus(), loadCount(), loadFolders()]);
    if (mounted.current) setRefreshing(false);
  }, [loadStatus, loadCount, loadFolders]);

  useEffect(() => {
    loadStatus();
    loadCount();
    loadFolders();
    const a = setInterval(loadStatus, STATUS_MS);
    const b = setInterval(loadCount, COUNT_MS);
    const c = setInterval(loadFolders, FOLDERS_MS);
    return () => {
      clearInterval(a);
      clearInterval(b);
      clearInterval(c);
    };
  }, [loadStatus, loadCount, loadFolders]);

  return {
    status,
    unprocessed,
    folders,
    error,
    lastSuccessAt,
    loading,
    refreshing,
    refresh,
  };
}

/* Re-renders once a second so "updated 4s ago" stays honest. */
export function useNow(intervalMs = 1000) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);
  return now;
}
