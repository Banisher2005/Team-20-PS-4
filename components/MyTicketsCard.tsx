"use client";

import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Ticket, RotateCw, ArrowRight } from "./Icons";
import { PriorityBadge, StatusBadge } from "./Badges";
import { hasUnseenUpdates } from "@/lib/seenUpdates";

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

  const shown = tickets?.slice(0, limit) ?? [];

  return (
    <div className="flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xs">
      <div className="flex items-center justify-between gap-2 border-b border-slate-100 px-4 py-3.5 sm:px-5">
        <div className="flex items-center gap-2">
          <Ticket className="h-5 w-5 text-emerald-600" />
          <h2 className="text-base font-bold tracking-tight text-slate-900">{title}</h2>
          {tickets && <span className="text-xs font-semibold text-slate-400">({tickets.length})</span>}
        </div>
        <div className="flex items-center gap-1.5 text-xs font-medium text-slate-500">
          <RotateCw className={`h-3.5 w-3.5 ${loading ? "animate-spin text-emerald-600" : ""}`} />
          <span className="hidden sm:inline">Refreshes every 5 s</span>
        </div>
      </div>

      <div className="flex-1 space-y-3 p-3 sm:p-4">
        {error && <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-600">{error}</div>}
        {tickets === null && !error && <div className="py-8 text-center text-sm text-slate-400">Loading…</div>}
        {tickets?.length === 0 && !error && (
          <div className="py-8 text-center text-sm text-slate-400">No tickets yet. Describe a problem in the chat.</div>
        )}

        {shown.map((t) => {
          const unseen = hasUnseenUpdates(userId, t.id, t.it_update_count);
          const time = `${t.status === "resolved" ? "Resolved" : "Updated"} ${formatTimeAgo(t.updated_at)}`;
          return (
            <Link
              key={t.id}
              href={`/tickets/${t.id}`}
              className="block rounded-lg border border-slate-200/80 p-3 transition-colors hover:border-slate-300 hover:bg-slate-50/60"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-slate-900">#{t.id}</span>
                    <span className="truncate text-sm font-semibold text-slate-800">{t.title}</span>
                    {unseen && (
                      <span className="h-2 w-2 flex-shrink-0 rounded-full bg-emerald-500" title="New update from IT" />
                    )}
                  </div>
                  <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-slate-500">
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
                <p className="mt-2 truncate rounded bg-emerald-50 px-2 py-1 text-xs text-emerald-900">
                  <span className="font-semibold">IT:</span> {t.latest_it_update}
                </p>
              )}
            </Link>
          );
        })}
      </div>

      {showViewAll && tickets && tickets.length > 0 && (
        <div className="border-t border-slate-100 bg-slate-50/50 px-5 py-3 text-center">
          <Link
            href="/tickets"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-800 transition-colors hover:text-emerald-700"
          >
            <span>View all tickets</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      )}
    </div>
  );
}
