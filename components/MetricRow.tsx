"use client";

import type { WatcherStatus } from "@/lib/api";
import { absolute, count, relative } from "@/lib/format";

interface TileProps {
  label: string;
  value: string;
  sub?: string;
  accent?: "none" | "attention" | "source" | "dest";
  small?: boolean;
  title?: string;
}

function Tile({ label, value, sub, accent = "none", small, title }: TileProps) {
  const tone = {
    none: { text: "text-ink", rule: "bg-line-strong" },
    attention: { text: "text-attention", rule: "bg-attention" },
    source: { text: "text-source", rule: "bg-source" },
    dest: { text: "text-dest", rule: "bg-dest" },
  }[accent];

  return (
    <div className="relative bg-surface px-5 py-4" title={title}>
      {/* hairline that carries the tile's meaning, instead of a glow on everything */}
      <span
        className={`absolute left-0 top-0 h-px w-10 ${tone.rule} opacity-70`}
        aria-hidden
      />
      <span className="micro block text-ink-faint">{label}</span>
      <span
        className={`tnum mt-2 block font-mono font-semibold leading-none ${tone.text} ${small ? "text-lg" : "text-[26px]"}`}
      >
        {value}
      </span>
      {sub ? (
        <span className="mt-1.5 block text-xs leading-snug text-ink-soft">
          {sub}
        </span>
      ) : null}
    </div>
  );
}

interface Props {
  status: WatcherStatus | null;
  unprocessed: number | null;
  now: number;
}

export default function MetricRow({ status, unprocessed, now }: Props) {
  const waiting = unprocessed ?? null;

  return (
    <div className="grid grid-cols-2 gap-px border border-line bg-line lg:grid-cols-4">
      <Tile
        label="Waiting"
        value={count(waiting)}
        sub={waiting === 0 ? "queue is clear" : "folders not yet uploaded"}
        accent={waiting && waiting > 0 ? "attention" : "source"}
      />
      <Tile
        label="Uploaded today"
        value={count(status?.stats.uploadsToday)}
        sub="photos since midnight"
        accent="dest"
      />
      <Tile
        label="Photos all time"
        value={count(status?.stats.totalPhotosUploaded)}
        sub={`${count(status?.processedFoldersCount)} folders finished`}
      />
      <Tile
        label="Last upload"
        value={relative(status?.stats.lastUploadTime, now)}
        sub={absolute(status?.stats.lastUploadTime)}
        small
        title="Time of the most recent photo accepted by Flickr"
      />
    </div>
  );
}
