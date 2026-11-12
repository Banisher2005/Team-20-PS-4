"use client";

import React, { useEffect, useState } from "react";
import { Ticket, RotateCw, ArrowRight } from "./Icons";
import { PriorityBadge, StatusBadge } from "./Badges";
import { joinedName } from "@/lib/helpdesk";

type TicketData = {
  id: number;
  title: string;
  category: string;
  priority: string;
  status: string;
  updated_at: string;
  support_teams: unknown;
};

const REFRESH_MS = 5000;

function formatTimeAgo(iso: string): string {
  const mins = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins} min ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours} hr ago`;
  const days = Math.round(hours / 24);
  return days === 1 ? "yesterday" : `${days} days ago`;
}

export function MyTicketsCard({
  refreshKey,
  onViewAll,
}: {
  refreshKey: number;
  onViewAll?: () => void;
}) {
  const [tickets, setTickets] = useState<TicketData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function loadTickets() {
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
  }

  useEffect(() => {
    loadTickets();
  }, [refreshKey]);

  useEffect(() => {
    const timer = setInterval(loadTickets, REFRESH_MS);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-2xs flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Ticket className="w-5 h-5 text-emerald-600" />
          <h2 className="text-base font-bold text-slate-900 tracking-tight">My Tickets</h2>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
          <RotateCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-emerald-600" : ""}`} />
          <span>Refreshes every 5 s</span>
        </div>
      </div>

      {/* Ticket List */}
      <div className="p-4 space-y-3 flex-1 overflow-y-auto">
        {error && (
          <div className="p-3 text-xs text-red-600 bg-red-50 rounded-lg border border-red-200">
            {error}
          </div>
        )}

        {tickets.length === 0 && !loading && !error && (
          <div className="py-8 text-center text-sm text-slate-400">
            No active tickets found.
          </div>
        )}

        {tickets.slice(0, 4).map((t) => {
          const code = `TKT-${10375 + Number(t.id)}`;
          const timeText =
            t.status === "resolved"
              ? `Resolved ${formatTimeAgo(t.updated_at)}`
              : `Updated ${formatTimeAgo(t.updated_at)}`;

          const team = joinedName(t.support_teams) ?? "IT Support";

          return (
            <div
              key={t.id}
              className="p-3 rounded-lg border border-slate-200/80 hover:border-slate-300 hover:bg-slate-50/60 transition-colors flex items-center justify-between gap-3"
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold text-slate-900">{code}</span>
                  <span className="text-sm font-semibold text-slate-800 truncate">{t.title}</span>
                </div>
                <div className="text-xs text-slate-500 mt-1 flex items-center gap-2">
                  <span>{team}</span>
                  <span>•</span>
                  <span>{timeText}</span>
                </div>
              </div>

              <div className="flex items-center gap-2 flex-shrink-0">
                <PriorityBadge priority={t.priority} />
                <StatusBadge status={t.status} />
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer link: View All Tickets */}
      <div className="px-5 py-3 border-t border-slate-100 bg-slate-50/50 text-center">
        <button
          onClick={onViewAll}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-800 hover:text-emerald-700 transition-colors"
        >
          <span>View All Tickets</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
