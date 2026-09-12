"use client";

import { AlertTriangle, CircleCheck, CircleSlash, Loader2 } from "lucide-react";
import type { Mode, WatcherStatus } from "@/lib/api";
import { relative } from "@/lib/format";

export type Health = "ok" | "attention" | "fault" | "unknown";

const SCAN_INTERVAL: Record<Mode, string> = {
  ACTIVE: "every 2 minutes",
  SLEEP: "once a day",
  HIBERNATE: "once a week",
};

export function deriveHealth(
  status: WatcherStatus | null,
  unprocessed: number | null,
  error: string | null,
  stale: boolean,
): Health {
  if (error || !status) return "fault";
  if (stale) return "attention";
  if (unprocessed !== null && unprocessed > 0) return "attention";
  return "ok";
}

interface Props {
  status: WatcherStatus | null;
  unprocessed: number | null;
  error: string | null;
  stale: boolean;
  loading: boolean;
  now: number;
}

export default function StatusBanner({
  status,
  unprocessed,
  error,
  stale,
  loading,
  now,
}: Props) {
  const health = deriveHealth(status, unprocessed, error, stale);
  const booting = loading && !status;

  let label: string;
  let headline: string;
  let detail: string;

  if (booting) {
    label = "Connecting";
    headline = "Checking the uploader…";
    detail = "Asking the server how things are going.";
  } else if (error || !status) {
    label = "No signal";
    headline = "Can't reach the uploader";
    const reason = error ?? "No response from the server.";
    detail =
      (/[.!?]$/.test(reason) ? reason : `${reason}.`) +
      " The figures below are the last ones we saw, not current.";
  } else if (stale) {
    label = "Stale";
    headline = "Numbers may be out of date";
    detail =
      "Last successful check was more than 30 seconds ago. The uploader itself may be fine.";
  } else if (unprocessed !== null && unprocessed > 0) {
    label = "Queue";
    headline =
      unprocessed === 1
        ? "1 folder waiting to upload"
        : `${unprocessed} folders waiting to upload`;
    detail =
      status.currentMode === "ACTIVE"
        ? `Scanning ${SCAN_INTERVAL.ACTIVE} — these should start shortly.`
        : `The uploader is in ${status.currentMode.toLowerCase()} mode and only checks ${SCAN_INTERVAL[status.currentMode]}. Wake it up to start now.`;
  } else {
    label = "Clear";
    headline = "Everything is uploaded";
    detail = `Nothing waiting. Scanning ${SCAN_INTERVAL[status.currentMode]} · last upload ${relative(status.stats.lastUploadTime, now)}.`;
  }

  const tone = {
    ok: { edge: "border-ok/45", fill: "bg-ok-dim/60", ink: "text-ok", Icon: CircleCheck },
    attention: {
      edge: "border-attention/45",
      fill: "bg-attention-dim/60",
      ink: "text-attention",
      Icon: AlertTriangle,
    },
    fault: {
      edge: "border-fault/45",
      fill: "bg-fault-dim/60",
      ink: "text-fault",
      Icon: CircleSlash,
    },
    unknown: {
      edge: "border-line-strong",
      fill: "bg-surface",
      ink: "text-source",
      Icon: Loader2,
    },
  }[booting ? "unknown" : health];

  const Icon = tone.Icon;

  return (
    <section
      aria-live="polite"
      className={`hud ${tone.ink} border ${tone.edge} ${tone.fill} px-5 py-5 sm:px-7 sm:py-6`}
    >
      <div className="flex items-start gap-4">
        <span className={`livedot mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full ${tone.ink} bg-current`} aria-hidden />
        <div className="min-w-0">
          <span className="micro flex items-center gap-2 text-current opacity-80">
            <Icon className={`h-3 w-3 ${booting ? "animate-spin" : ""}`} aria-hidden />
            {label}
          </span>
          <h2 className="mt-2 font-display text-2xl font-semibold tracking-tight text-ink text-balance sm:text-3xl">
            {headline}
          </h2>
          <p className="mt-2 max-w-[62ch] text-sm leading-relaxed text-ink-soft">
            {detail}
          </p>
        </div>
      </div>
    </section>
  );
}
