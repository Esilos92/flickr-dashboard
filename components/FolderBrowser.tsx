"use client";

import { useMemo, useState } from "react";
import { ChevronRight, Search } from "lucide-react";
import type { ProcessedFolder } from "@/lib/api";
import { toDate } from "@/lib/format";

/*
  The API sends no upload time today, so "newest first" falls back to the
  order the folders arrive in: the uploader appends each one as it
  finishes, making array position a proxy for recency. If a real stamp
  ever appears on the payload it wins, for both the rows inside a show
  and the ordering of the shows themselves.
*/
function stampOf(f: ProcessedFolder): number | null {
  const d = toDate(f.processedAt ?? f.uploadedAt ?? f.timestamp);
  return d ? d.getTime() : null;
}

interface Props {
  folders: ProcessedFolder[] | null;
}

/*
  1,700+ rows in a flat scroller is a haystack. Group by show, collapse by
  default, and let search cut across everything — the operator is nearly
  always asking "did <this breakout> go up?", not browsing.
*/
export default function FolderBrowser({ folders }: Props) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState<Record<string, boolean>>({});

  const groups = useMemo(() => {
    if (!folders) return null;
    const q = query.trim().toLowerCase();
    const stamped = folders.some((f) => stampOf(f) !== null);
    // Rank every folder once: a real stamp when the payload carries one,
    // otherwise its position in the array. Higher means more recent.
    const rank = new Map<ProcessedFolder, number>(
      folders.map((f, i) => [f, stamped ? (stampOf(f) ?? -Infinity) : i]),
    );

    const map = new Map<string, ProcessedFolder[]>();
    for (const f of folders) {
      if (
        q &&
        !f.folderName?.toLowerCase().includes(q) &&
        !f.eventName?.toLowerCase().includes(q)
      ) {
        continue;
      }
      const key = f.eventName || "Unsorted";
      const list = map.get(key);
      if (list) list.push(f);
      else map.set(key, [f]);
    }

    const rankOf = (f: ProcessedFolder) => rank.get(f) ?? -Infinity;

    return [...map.entries()]
      .map(([event, items]) => ({
        event,
        items: [...items].sort((a, b) => rankOf(b) - rankOf(a)),
      }))
      .sort(
        (a, b) =>
          Math.max(...b.items.map(rankOf)) - Math.max(...a.items.map(rankOf)),
      );
  }, [folders, query]);

  const total = folders?.length ?? 0;
  const shown = groups?.reduce((n, g) => n + g.items.length, 0) ?? 0;
  const searching = query.trim().length > 0;

  return (
    <section className="border border-line bg-surface">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-5 py-3">
        <h2 className="micro text-source">
          Finished folders
          <span className="tnum ml-2 font-mono text-[11px] font-normal text-ink-faint">
            {searching ? `${shown} of ${total}` : total.toLocaleString()}
          </span>
        </h2>
        <div className="relative w-full sm:w-64">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-ink-faint"
            aria-hidden
          />
          <input
            id="folder-search"
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search a show or breakout"
            aria-label="Search finished folders"
            className="w-full border border-line bg-raised py-2 pl-9 pr-3 font-mono text-[13px] text-ink placeholder:text-ink-faint focus:border-source focus:outline-none"
          />
        </div>
      </header>

      <div className="scroll-slim max-h-[26rem] overflow-y-auto">
        {!folders ? (
          <p className="px-5 py-10 text-center text-sm text-ink-faint">
            Loading the archive…
          </p>
        ) : groups && groups.length === 0 ? (
          <p className="px-5 py-10 text-center text-sm text-ink-faint">
            {searching
              ? `Nothing matches “${query}”.`
              : "No folders have been processed yet."}
          </p>
        ) : (
          <ul className="divide-y divide-line">
            {groups?.map(({ event, items }) => {
              const isOpen = open[event] ?? searching;
              return (
                <li key={event}>
                  <button
                    type="button"
                    onClick={() =>
                      setOpen((o) => ({ ...o, [event]: !isOpen }))
                    }
                    aria-expanded={isOpen}
                    className="flex w-full items-center gap-3 px-5 py-3 text-left hover:bg-raised"
                  >
                    <ChevronRight
                      className={`h-4 w-4 shrink-0 text-ink-faint transition-transform ${isOpen ? "rotate-90" : ""}`}
                      aria-hidden
                    />
                    <span className="min-w-0 flex-1 truncate font-display text-[15px] font-medium text-ink">
                      {event}
                    </span>
                    <span className="tnum shrink-0 border border-line bg-raised px-2.5 py-0.5 font-mono text-[11px] text-ink-soft">
                      {items.length}
                    </span>
                  </button>

                  {isOpen ? (
                    <ul className="pb-2">
                      {items.slice(0, 200).map((f, i) => (
                        <li
                          key={`${f.path}-${i}`}
                          className="flex items-center gap-3 py-1.5 pl-12 pr-5"
                        >
                          <span className="h-1 w-1 shrink-0 rotate-45 bg-ok" aria-hidden />
                          <span className="min-w-0 flex-1 truncate font-mono text-[13px] text-ink-soft">
                            {f.folderName}
                          </span>
                        </li>
                      ))}
                      {items.length > 200 ? (
                        <li className="py-2 pl-12 pr-5 text-xs text-ink-faint">
                          + {items.length - 200} more — search to narrow.
                        </li>
                      ) : null}
                    </ul>
                  ) : null}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </section>
  );
}
