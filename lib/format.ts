/* The API mixes epoch milliseconds (lastActivity) with ISO strings
   (stats.lastUploadTime). Accept either, and never render "Invalid Date". */
export function toDate(value: number | string | null | undefined): Date | null {
  if (value === null || value === undefined || value === "") return null;
  const d = typeof value === "number" ? new Date(value) : new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

export function relative(
  value: number | string | null | undefined,
  now: number,
): string {
  const d = toDate(value);
  if (!d) return "never";
  const diff = Math.max(0, now - d.getTime());
  const s = Math.round(diff / 1000);
  if (s < 10) return "just now";
  if (s < 60) return `${s}s ago`;
  const m = Math.round(s / 60);
  if (m < 60) return `${m} min ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ${m % 60}m ago`;
  const days = Math.round(h / 24);
  return days === 1 ? "yesterday" : `${days} days ago`;
}

export function absolute(value: number | string | null | undefined): string {
  const d = toDate(value);
  if (!d) return "—";
  return d.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function count(n: number | null | undefined): string {
  if (n === null || n === undefined) return "—";
  return n.toLocaleString();
}

export function duration(hours: number, minutes: number): string {
  if (hours >= 24) {
    const d = Math.floor(hours / 24);
    return `${d}d ${hours % 24}h`;
  }
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}
