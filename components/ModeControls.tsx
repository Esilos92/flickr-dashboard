"use client";

import { useState } from "react";
import { Loader2, Zap } from "lucide-react";
import type { Mode, WatcherStatus } from "@/lib/api";
import { duration } from "@/lib/format";

const MODES: {
  id: Mode;
  name: string;
  cadence: string;
  meaning: string;
  confirm?: string;
}[] = [
  {
    id: "ACTIVE",
    name: "Active",
    cadence: "Checks every 2 minutes",
    meaning: "Normal setting during and just after a show.",
  },
  {
    id: "SLEEP",
    name: "Sleep",
    cadence: "Checks once a day",
    meaning: "Between shows. New folders can wait up to 24 hours.",
    confirm:
      "Sleep mode checks for new folders only once a day. Anything your team drops in could sit for up to 24 hours. Switch anyway?",
  },
  {
    id: "HIBERNATE",
    name: "Hibernate",
    cadence: "Checks once a week",
    meaning: "Long gaps. Nothing uploads until it wakes.",
    confirm:
      "Hibernate checks only once a week. Photos dropped in after this could sit for up to 7 days before uploading. Switch anyway?",
  },
];

interface Props {
  status: WatcherStatus | null;
  busy: string | null;
  onWake: () => void;
  onSetMode: (mode: Mode) => void;
  disabled: boolean;
}

export default function ModeControls({
  status,
  busy,
  onWake,
  onSetMode,
  disabled,
}: Props) {
  const [pending, setPending] = useState<Mode | null>(null);
  const current = status?.currentMode ?? null;

  const request = (m: (typeof MODES)[number]) => {
    if (m.confirm) setPending(m.id);
    else onSetMode(m.id);
  };

  const confirmCopy = MODES.find((m) => m.id === pending)?.confirm;

  return (
    <section className="border border-line bg-surface">
      <header className="flex flex-wrap items-center justify-between gap-2 border-b border-line px-5 py-3">
        <h2 className="micro text-source">Scanning</h2>
        {status ? (
          <p className="font-mono text-[11px] text-ink-faint">
            in {status.currentMode.toLowerCase()} for{" "}
            <span className="tnum text-ink-soft">
              {duration(status.timeInMode.hours, status.timeInMode.minutes)}
            </span>
          </p>
        ) : null}
      </header>

      <div className="p-5">
        <div className="grid gap-2 sm:grid-cols-3">
          {MODES.map((m) => {
            const isCurrent = current === m.id;
            const isBusy = busy === m.id;
            return (
              <button
                key={m.id}
                type="button"
                onClick={() => request(m)}
                disabled={isCurrent || disabled || isBusy}
                aria-current={isCurrent ? "true" : undefined}
                className={[
                  "border px-4 py-3 text-left transition-colors",
                  isCurrent
                    ? "hud border-ok/50 bg-ok-dim/60 text-ok"
                    : "border-line bg-raised hover:border-line-strong",
                  disabled && !isCurrent
                    ? "cursor-not-allowed opacity-50"
                    : isCurrent
                      ? "cursor-default"
                      : "cursor-pointer",
                ].join(" ")}
              >
                <span className="flex items-center gap-2">
                  <span
                    className={`font-display text-base font-semibold tracking-tight ${isCurrent ? "text-ok" : "text-ink"}`}
                  >
                    {m.name}
                  </span>
                  {isCurrent ? (
                    <span className="micro rounded-sm bg-ok/15 px-1.5 py-0.5 text-ok">
                      Now
                    </span>
                  ) : null}
                  {isBusy ? (
                    <Loader2
                      className="h-3.5 w-3.5 animate-spin text-source"
                      aria-hidden
                    />
                  ) : null}
                </span>
                <span className="mt-1 block font-mono text-[11px] text-ink-soft">
                  {m.cadence}
                </span>
                <span className="mt-1.5 block text-xs leading-snug text-ink-faint">
                  {m.meaning}
                </span>
              </button>
            );
          })}
        </div>

        <div className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-line pt-5">
          <button
            type="button"
            onClick={onWake}
            disabled={disabled || busy === "wake" || current === "ACTIVE"}
            className="glow-source inline-flex items-center gap-2 bg-source px-4 py-2.5 font-display text-sm font-semibold tracking-wide text-ground transition-opacity hover:opacity-90 disabled:bg-raised disabled:text-ink-faint disabled:shadow-none"
          >
            {busy === "wake" ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
            ) : (
              <Zap className="h-4 w-4" aria-hidden />
            )}
            Wake up and scan now
          </button>
          <p className="text-xs text-ink-faint">
            {current === "ACTIVE"
              ? "Already active — it is scanning every 2 minutes."
              : "Switches to active and keeps it there for 48 hours."}
          </p>
        </div>
      </div>

      {pending && confirmCopy ? (
        <div
          role="alertdialog"
          aria-modal="true"
          aria-label="Confirm mode change"
          className="fixed inset-0 z-50 flex items-center justify-center bg-ground/85 p-4 backdrop-blur-sm"
        >
          <div className="hud w-full max-w-md border border-attention/50 bg-surface p-6 text-attention">
            <span className="micro">Confirm</span>
            <h3 className="mt-2 font-display text-lg font-semibold text-ink">
              Slow the uploader down?
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-ink-soft">
              {confirmCopy}
            </p>
            <div className="mt-5 flex flex-wrap justify-end gap-2">
              <button
                type="button"
                onClick={() => setPending(null)}
                className="border border-line px-4 py-2 text-sm font-medium text-ink-soft hover:border-line-strong"
              >
                Keep current setting
              </button>
              <button
                type="button"
                onClick={() => {
                  const m = pending;
                  setPending(null);
                  onSetMode(m);
                }}
                className="bg-attention px-4 py-2 font-display text-sm font-semibold text-ground hover:opacity-90"
              >
                Switch anyway
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
