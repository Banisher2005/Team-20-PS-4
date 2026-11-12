"use client";

import React, { useEffect, useState } from "react";
import { BarChart3, AlertTriangle, Clock, CheckCircle2, Sparkles, ChevronDown } from "lucide-react";
import { PriorityBadge } from "./Badges";

type AdminRow = {
  id: number;
  title: string;
  category: string;
  priority: string;
  status: string;
  team_id: string;
  created_at: string;
  updated_at: string;
  support_teams: unknown;
  employees: unknown;
};

interface ITAdminBoardProps {
  refreshKey: number;
  onDataChanged?: () => void;
  onSummarizeP1?: () => void;
}

export function ITAdminBoardCard({
  refreshKey,
  onDataChanged,
  onSummarizeP1,
}: ITAdminBoardProps) {
  const [activeTab, setActiveTab] = useState<"overview" | "manage">("overview");
  const [rows, setRows] = useState<AdminRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [statusUpdatingId, setStatusUpdatingId] = useState<number | null>(null);

  async function fetchAdminData() {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/tickets", { cache: "no-store" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to fetch admin data");
      setRows(data.tickets ?? []);
    } catch (err) {
      console.error("Admin data error:", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchAdminData();
  }, [refreshKey]);

  // Compute live statistics from the backend tickets
  const openCount = rows.filter((r) =>
    ["open", "in_progress", "waiting_for_user"].includes(r.status)
  ).length;

  const p1HighCount = rows.filter(
    (r) => r.priority === "P1" && !["resolved", "closed"].includes(r.status)
  ).length;

  const inProgressCount = rows.filter((r) => r.status === "in_progress").length;

  const resolvedTodayCount = rows.filter(
    (r) => r.status === "resolved" || r.status === "closed"
  ).length;

  const openP1Tickets = rows.filter(
    (r) => r.priority === "P1" && !["resolved", "closed"].includes(r.status)
  );

  async function handleStatusChange(ticketId: number, nextStatus: string) {
    try {
      setStatusUpdatingId(ticketId);
      const res = await fetch("/api/admin/tickets", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: ticketId, status: nextStatus }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to update status");

      await fetchAdminData();
      onDataChanged?.();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Status update error");
    } finally {
      setStatusUpdatingId(null);
    }
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-2xs flex flex-col overflow-hidden">
      {/* Admin Card Header */}
      <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-emerald-600" />
          <h2 className="text-base font-bold text-slate-900 tracking-tight">IT Admin Board</h2>
        </div>

        {/* Overview / Manage Tabs */}
        <div className="flex items-center bg-slate-100 p-0.5 rounded-lg text-xs font-semibold">
          <button
            onClick={() => setActiveTab("overview")}
            className={`px-3 py-1 rounded-md transition-all ${
              activeTab === "overview"
                ? "bg-[#86efac] text-slate-900 shadow-2xs font-bold"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab("manage")}
            className={`px-3 py-1 rounded-md transition-all ${
              activeTab === "manage"
                ? "bg-[#86efac] text-slate-900 shadow-2xs font-bold"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Manage
          </button>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Metric Cards Row */}
        <div className="grid grid-cols-4 gap-2.5">
          {/* Open Tickets */}
          <div className="bg-[#f0fdf4] border border-[#dcfce7] rounded-lg p-3 text-center">
            <div className="flex justify-center mb-1 text-emerald-600">
              <TicketIcon className="w-4 h-4" />
            </div>
            <div className="text-xl font-black text-slate-900">{openCount}</div>
            <div className="text-[11px] font-medium text-slate-600 mt-0.5">Open Tickets</div>
          </div>

          {/* P1 High */}
          <div className="bg-[#fef2f2] border border-[#fee2e2] rounded-lg p-3 text-center">
            <div className="flex justify-center mb-1 text-red-500">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <div className="text-xl font-black text-red-600">{p1HighCount}</div>
            <div className="text-[11px] font-medium text-slate-600 mt-0.5">P1 (High)</div>
          </div>

          {/* In Progress */}
          <div className="bg-[#fffbeb] border border-[#fef3c7] rounded-lg p-3 text-center">
            <div className="flex justify-center mb-1 text-amber-500">
              <Clock className="w-4 h-4" />
            </div>
            <div className="text-xl font-black text-amber-700">{inProgressCount}</div>
            <div className="text-[11px] font-medium text-slate-600 mt-0.5">In Progress</div>
          </div>

          {/* Resolved Today */}
          <div className="bg-[#f0fdf4] border border-[#bbf7d0] rounded-lg p-3 text-center">
            <div className="flex justify-center mb-1 text-emerald-600">
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <div className="text-xl font-black text-emerald-700">{resolvedTodayCount}</div>
            <div className="text-[11px] font-medium text-slate-600 mt-0.5">Resolved (Today)</div>
          </div>
        </div>

        {/* Section: Open P1 Tickets */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-bold text-slate-900">
              Open P1 Tickets ({openP1Tickets.length})
            </h3>
            <span className="text-xs font-semibold text-slate-500 flex items-center gap-1">
              Change Status <ChevronDown className="w-3.5 h-3.5" />
            </span>
          </div>

          <div className="space-y-2">
            {openP1Tickets.length === 0 ? (
              <div className="p-4 text-center text-xs text-slate-400 bg-slate-50 rounded-lg border border-slate-100">
                No active P1 tickets at this time.
              </div>
            ) : (
              openP1Tickets.map((t) => (
                <div
                  key={t.id}
                  className="p-2.5 rounded-lg border border-slate-200 bg-white flex items-center justify-between gap-2 text-xs"
                >
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <span className="font-mono font-bold text-slate-900 flex-shrink-0">
                      TKT-{10400 + Number(t.id)}
                    </span>
                    <span className="text-slate-800 font-medium truncate">{t.title}</span>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    <PriorityBadge priority="P1" />
                    <select
                      value={t.status}
                      disabled={statusUpdatingId === t.id}
                      onChange={(e) => handleStatusChange(t.id, e.target.value)}
                      className="text-xs bg-slate-50 border border-slate-300 rounded px-2 py-1 font-medium text-slate-800 focus:outline-emerald-500 cursor-pointer"
                    >
                      <option value="open">Open</option>
                      <option value="in_progress">In Progress</option>
                      <option value="waiting_for_user">Waiting for User</option>
                      <option value="resolved">Resolved</option>
                      <option value="closed">Closed</option>
                    </select>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Summarize Open P1 Tickets Button */}
        {onSummarizeP1 && (
          <button
            onClick={onSummarizeP1}
            className="w-full py-2.5 px-4 rounded-lg bg-[#86efac] hover:bg-[#6ee7b7] text-slate-900 font-bold text-sm flex items-center justify-center gap-2 shadow-2xs transition-colors"
          >
            <Sparkles className="w-4 h-4 text-emerald-800" />
            <span>Summarize Open P1 Tickets</span>
          </button>
        )}
      </div>
    </div>
  );
}

function TicketIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z" />
      <path d="M13 5v2" />
      <path d="M13 17v2" />
      <path d="M13 11v2" />
    </svg>
  );
}
