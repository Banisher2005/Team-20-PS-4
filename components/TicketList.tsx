"use client";

import { useEffect, useState } from "react";
import { joinedName } from "@/lib/helpdesk";
import { PriorityBadge, StatusBadge } from "./Badges";

type Ticket = {
  id: number;
  title: string;
  category: string;
  priority: string;
  status: string;
  updated_at: string;
  support_teams: unknown; // object or one-item array, depending on Supabase
};

const REFRESH_MS = 5000;

function timeAgo(iso: string): string {
  const mins = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins} min ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours} h ago`;
  const days = Math.round(hours / 24);
  return days === 1 ? "yesterday" : `${days} days ago`;
}

/** My Tickets: reads GET /api/tickets on refreshKey change and every 5 seconds. */
export default function TicketList({ refreshKey }: { refreshKey: number }) {
  const [tickets, setTickets] = useState<Ticket[] | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await fetch("/api/tickets", { cache: "no-store" });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "Could not load tickets");
        if (!cancelled) {
          setTickets(data.tickets);
          setError("");
        }
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "Could not load tickets");
      }
    }
    load();
    const timer = setInterval(load, REFRESH_MS);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [refreshKey]);

  return (
    <div className="rounded-xl border border-slate-200 bg-white">
      <div className="border-b border-slate-200 px-4 py-3">
        <h2 className="font-semibold">My Tickets</h2>
        <p className="text-xs text-slate-500">Live from the helpdesk · refreshes every 5 s</p>
      </div>
      <ul className="divide-y divide-slate-100">
        {error && <li className="p-4 text-sm text-red-600">{error}</li>}
        {!error && tickets === null && <li className="p-4 text-sm text-slate-500">Loading…</li>}
        {!error && tickets?.length === 0 && <li className="p-4 text-sm text-slate-500">No tickets yet.</li>}
        {tickets?.map((t) => (
          <li key={t.id} className="px-4 py-3 text-sm">
            <div className="flex items-start justify-between gap-2">
              <p className="min-w-0 font-medium">
                <span className="mr-1 text-slate-400">#{t.id}</span>
                <span className="break-words">{t.title}</span>
              </p>
              <StatusBadge status={t.status} />
            </div>
            <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-slate-500">
              <PriorityBadge priority={t.priority} />
              <span>{t.category}</span>
              <span aria-hidden>·</span>
              <span>{joinedName(t.support_teams) ?? "—"}</span>
              <span aria-hidden>·</span>
              <span>updated {timeAgo(t.updated_at)}</span>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
