"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Ticket, RotateCw, ArrowRight, Search, X } from "./Icons";
import { PriorityBadge, StatusBadge } from "./Badges";
import { hasUnseenUpdates } from "@/lib/seenUpdates";
import { ACTIVE_STATUSES } from "@/lib/helpdesk";

type TicketFilter = "all" | "active" | "resolved" | "closed";

const FILTERS: { key: TicketFilter; label: string }[] = [
  { key: "all", label: "All" },
  { key: "active", label: "Active" },
  { key: "resolved", label: "Resolved" },
  { key: "closed", label: "Closed" },
];

function matchesFilter(status: string, filter: TicketFilter): boolean {
  if (filter === "all") return true;
  if (filter === "active") return (ACTIVE_STATUSES as readonly string[]).includes(status);
  return status === filter;
}

/** Matches "#12" / "12" against the id, and any other text against title, category and team. */
function matchesSearch(t: MyTicket, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  const idQuery = q.replace(/^#/, "");
  if (/^\d+$/.test(idQuery) && String(t.id).includes(idQuery)) return true;
  return [t.title, t.category, t.team ?? "IT Support"].some((field) => field.toLowerCase().includes(q));
}

export type MyTicket = {
  id: number;
  title: string;
  category: string;
  priority: string;
  status: string;
  team: string | null;
  updated_at: string;
  it_update_count: number;
  latest_it_update: string | null;
};

const REFRESH_MS = 5000;

export function formatTimeAgo(iso: string): string {
  const mins = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins} min ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours} h ago`;
  const days = Math.round(hours / 24);
  return days === 1 ? "yesterday" : `${days} days ago`;
}

/** The acting employee's tickets from /api/tickets; refreshes on refreshKey change and every 5 s (PRD §9.1). */
export function MyTicketsCard({
  userId,
  refreshKey = 0,
  limit = 4,
  title = "My Tickets",
  showViewAll = true,
}: {
  userId: string;
  refreshKey?: number;
  limit?: number;
  title?: string;
  showViewAll?: boolean;
}) {
  const [tickets, setTickets] = useState<MyTicket[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/tickets", { cache: "no-store" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to load tickets");
      setTickets(data.tickets ?? []);
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error loading tickets");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load, refreshKey]);

  useEffect(() => {
    const timer = setInterval(load, REFRESH_MS);
    return () => clearInterval(timer);
  }, [load]);

  const [filter, setFilter] = useState<TicketFilter>("all");
  const [query, setQuery] = useState("");

  const counts = useMemo(() => {
    const all = tickets ?? [];
    return Object.fromEntries(
      FILTERS.map((f) => [f.key, all.filter((t) => matchesFilter(t.status, f.key)).length])
    ) as Record<TicketFilter, number>;
  }, [tickets]);

  const filtered = useMemo(
    () => (tickets ?? []).filter((t) => matchesFilter(t.status, filter) && matchesSearch(t, query)),
    [tickets, filter, query]
  );
  const shown = filtered.slice(0, limit);
  const isFiltering = filter !== "all" || query.trim() !== "";

  return (
    <div className="gw-panel flex flex-col overflow-hidden rounded-none border shadow-2xs">
      <div className="flex items-center justify-between gap-2 border-b border-box-line px-4 py-3.5 sm:px-5">
        <div className="flex items-center gap-2">
          <Ticket className="h-5 w-5 text-accent" />
          <h2 className="text-base font-bold tracking-tight text-ink">{title}</h2>
          {tickets && <span className="text-xs font-semibold text-mute/60">({tickets.length})</span>}
        </div>
        <div className="flex items-center gap-1.5 text-xs font-medium text-mute/60">
          <RotateCw className={`h-3.5 w-3.5 ${loading ? "animate-spin text-accent" : ""}`} />
          <span className="hidden sm:inline">Refreshes every 5 s</span>
        </div>
      </div>

      <div className="space-y-2.5 border-b border-box-line px-3 py-3 sm:px-4">
        <div role="tablist" aria-label="Filter tickets by status" className="grid grid-cols-4 gap-1 rounded-lg border border-box-line bg-box p-1">
          {FILTERS.map((f) => {
            const active = filter === f.key;
            return (
              <button
                key={f.key}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setFilter(f.key)}
                className={`flex items-center justify-center gap-1.5 rounded-md px-2 py-1.5 text-xs font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-accent ${
                  active ? "bg-accent text-white shadow-2xs" : "text-mute2 hover:bg-box-hover hover:text-ink"
                }`}
              >
                <span>{f.label}</span>
                {tickets && (
                  <span className={`font-mono text-[10px] ${active ? "text-white/80" : "text-mute/60"}`}>{counts[f.key]}</span>
                )}
              </button>
            );
          })}
        </div>

        <label className="flex items-center gap-2 rounded-lg border border-box-line bg-box px-3 py-1.5 transition-colors focus-within:border-accent">
          <Search className="h-4 w-4 flex-shrink-0 text-mute/60" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by #id, title, category or team"
            aria-label="Search tickets"
            className="min-w-0 flex-1 bg-transparent text-sm text-ink placeholder:text-mute/50 focus:outline-none [&::-webkit-search-cancel-button]:hidden"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery("")}
              aria-label="Clear search"
              className="flex-shrink-0 text-mute/60 transition-colors hover:text-ink"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </label>
      </div>

      <div className="flex-1 space-y-3 p-3 sm:p-4">
        {error && <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-600">{error}</div>}
        {tickets === null && !error && <div className="py-8 text-center text-sm text-slate-400">Loading…</div>}
        {tickets?.length === 0 && !error && (
          <div className="py-8 text-center text-sm text-slate-400">No tickets yet. Describe a problem in the chat.</div>
        )}
        {tickets && tickets.length > 0 && filtered.length === 0 && !error && (
          <div className="py-8 text-center text-sm text-slate-400">
            {query.trim() ? `No ${filter === "all" ? "" : `${filter} `}tickets match "${query.trim()}".` : `No ${filter} tickets.`}
          </div>
        )}

        {shown.map((t) => {
          const unseen = hasUnseenUpdates(userId, t.id, t.it_update_count);
          const time = `${t.status === "resolved" ? "Resolved" : "Updated"} ${formatTimeAgo(t.updated_at)}`;
          return (
            <Link
              key={t.id}
              href={`/tickets/${t.id}`}
              className="block rounded-lg border border-box-line bg-box p-3 transition-colors hover:border-accent/40 hover:bg-box-hover"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-accent">#{t.id}</span>
                    <span className="truncate text-sm font-semibold text-ink">{t.title}</span>
                    {unseen && (
                      <span className="h-2 w-2 flex-shrink-0 rounded-full bg-emerald-500" title="New update from IT" />
                    )}
                  </div>
                  <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-mute2/60">
                    <span>{t.category}</span>
                    <span>•</span>
                    <span>{t.team ?? "IT Support"}</span>
                    <span>•</span>
                    <span>{time}</span>
                  </div>
                </div>
                <div className="flex flex-shrink-0 flex-col items-end gap-1.5 sm:flex-row sm:items-center sm:gap-2">
                  <PriorityBadge priority={t.priority} />
                  <StatusBadge status={t.status} />
                </div>
              </div>
              {unseen && t.latest_it_update && (
                <p className="mt-2 truncate rounded bg-box px-2 py-1 text-xs text-accent">
                  <span className="font-semibold">IT:</span> {t.latest_it_update}
                </p>
              )}
            </Link>
          );
        })}
      </div>

      {showViewAll && tickets && tickets.length > 0 && (
        <div className="border-t border-box-line bg-box px-5 py-3 text-center">
          <Link
            href="/tickets"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-accent transition-colors hover:text-ink"
          >
            <span>View all tickets</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      )}
    </div>
  );
}
