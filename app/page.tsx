"use client";

import { useCallback, useState } from "react";
import { RefreshCw } from "lucide-react";
import FolderBrowser from "@/components/FolderBrowser";
import MetricRow from "@/components/MetricRow";
import ModeControls from "@/components/ModeControls";
import StatusBanner from "@/components/StatusBanner";
import { setWatcherMode, wakeUpWatcher, type Mode } from "@/lib/api";
import { relative } from "@/lib/format";
import { STALE_AFTER_MS, useDashboard, useNow } from "@/lib/useDashboard";

export default function Dashboard() {
  const {
    status,
    unprocessed,
    folders,
    error,
    lastSuccessAt,
    loading,
    refreshing,
    refresh,
  } = useDashboard();
  const now = useNow();

  const [busy, setBusy] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const stale =
    lastSuccessAt !== null && now - lastSuccessAt > STALE_AFTER_MS;
  const connected = !error && lastSuccessAt !== null && !stale;

  const run = useCallback(
    async (key: string, fn: () => Promise<{ ok: boolean; error?: string }>) => {
      setBusy(key);
      setActionError(null);
      const res = await fn();
      if (!res.ok) setActionError(res.error ?? "That didn't work.");
      await refresh();
      setBusy(null);
    },
    [refresh],
  );

  const handleWake = useCallback(
    () => run("wake", () => wakeUpWatcher()),
    [run],
  );

  const handleMode = useCallback(
    (mode: Mode) =>
      run(mode, () => setWatcherMode(mode, "Manual switch from dashboard")),
    [run],
  );

  return (
    <main className="mx-auto w-full max-w-5xl px-4 pb-20 pt-8 sm:px-6 sm:pt-10">
      <header className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-xl font-bold tracking-tight text-ink">
            Flickr Uploader
          </h1>
          <p className="micro mt-1 text-ink-faint">
            Dropbox{" "}
            <span className="text-source" aria-hidden>
              →
            </span>{" "}
            <span className="sr-only">to</span> Flickr · GalaxyCon &amp; Animate!
          </p>
        </div>

        <div className="flex items-center gap-3">
          <span className="flex items-center gap-2 font-mono text-[11px] text-ink-soft">
            <span
              className={`livedot h-2 w-2 rounded-full ${
                connected
                  ? "bg-ok text-ok"
                  : stale
                    ? "bg-attention text-attention"
                    : "bg-fault text-fault"
              }`}
              aria-hidden
            />
            {connected
              ? `Updated ${relative(lastSuccessAt, now)}`
              : stale
                ? `Last update ${relative(lastSuccessAt, now)}`
                : "Offline"}
          </span>
          <button
            type="button"
            onClick={refresh}
            disabled={refreshing}
            className="inline-flex items-center gap-2 border border-line bg-surface px-3 py-2 font-mono text-[11px] uppercase tracking-widest text-ink-soft hover:border-source hover:text-source disabled:opacity-50"
          >
            <RefreshCw
              className={`h-3.5 w-3.5 ${refreshing ? "animate-spin" : ""}`}
              aria-hidden
            />
            Refresh
          </button>
        </div>
      </header>

      <div className="flex flex-col gap-5">
        <StatusBanner
          status={status}
          unprocessed={unprocessed}
          error={error}
          stale={stale}
          loading={loading}
          now={now}
        />

        {actionError ? (
          <p
            role="alert"
            className="hud border border-fault/45 bg-fault-dim/60 px-4 py-3 text-sm text-fault"
          >
            {actionError}
          </p>
        ) : null}

        <MetricRow status={status} unprocessed={unprocessed} now={now} />

        <ModeControls
          status={status}
          busy={busy}
          onWake={handleWake}
          onSetMode={handleMode}
          disabled={!status || !!error}
        />

        <FolderBrowser folders={folders} />
      </div>

      <footer className="mt-10 border-t border-line pt-5 text-xs leading-relaxed text-ink-faint">
        A folder counts as finished when every photo in it is on Flickr. If your
        team adds photos to a folder later, the uploader re-checks it and sends
        only the new ones.
      </footer>
    </main>
  );
}
