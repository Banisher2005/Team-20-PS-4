"use client";

import React, { useState } from "react";
import Link from "next/link";
import { BarChart3, AlertTriangle, Clock, CheckCircle2, Sparkles, Ticket } from "./Icons";
import { PriorityBadge, SlaBadge } from "./Badges";
import { STATUSES, statusLabel, todayIST, type SlaInfo } from "@/lib/helpdesk";

export type AdminRow = {
  id: number;
  title: string;
  category: string;
  priority: string;
  status: string;
  team_id: string;
  team: string | null;
  employee_id: string;
  employee: string | null;
  update_count: number;
  created_at: string;
  updated_at: string;
  sla: SlaInfo | null;
};

const ACTIVE = ["open", "in_progress", "waiting_for_user"];

/** IT admin metrics + open P1 list. Rows come from the parent (GET /api/admin/tickets). */
export function ITAdminBoardCard({
  rows,
  onChanged,
  onSummarizeP1,
}: {
  rows: AdminRow[];
  onChanged?: () => void;
  onSummarizeP1?: () => void;
}) {
  const [updatingId, setUpdatingId] = useState<number | null>(null);

  const today = todayIST();
  const openCount = rows.filter((r) => ACTIVE.includes(r.status)).length;
  const openP1 = rows.filter((r) => r.priority === "P1" && ACTIVE.includes(r.status));
  const inProgress = rows.filter((r) => r.status === "in_progress").length;
  const overdue = rows.filter((r) => r.sla?.overdue).length;
  const resolvedToday = rows.filter(
    (r) => (r.status === "resolved" || r.status === "closed") && todayIST(new Date(r.updated_at)) === today
  ).length;

  async function changeStatus(id: number, status: string) {
    try {
      setUpdatingId(id);
      const res = await fetch("/api/admin/tickets", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to update status");
      onChanged?.();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Status update error");
    } finally {
      setUpdatingId(null);
    }
  }

  return (
    <div className="flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xs">
      <div className="flex items-center gap-2 border-b border-slate-100 px-4 py-3.5 sm:px-5">
        <BarChart3 className="h-5 w-5 text-emerald-600" />
        <h2 className="text-base font-bold tracking-tight text-slate-900">IT Admin Board</h2>
      </div>

      <div className="space-y-4 p-3 sm:p-4">
        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-5">
          <Metric icon={<Ticket className="h-4 w-4" />} value={openCount} label="Open tickets" tone="green" />
          <Metric icon={<AlertTriangle className="h-4 w-4" />} value={openP1.length} label="P1 (high)" tone="red" />
          <Metric icon={<Clock className="h-4 w-4" />} value={inProgress} label="In progress" tone="amber" />
          <Metric icon={<AlertTriangle className="h-4 w-4" />} value={overdue} label="Past SLA" tone="red" />
          <Metric icon={<CheckCircle2 className="h-4 w-4" />} value={resolvedToday} label="Resolved today" tone="green" />
        </div>

        <div>
          <h3 className="mb-2 text-sm font-bold text-slate-900">Open P1 tickets ({openP1.length})</h3>
          <div className="space-y-2">
            {openP1.length === 0 ? (
              <div className="rounded-lg border border-slate-100 bg-slate-50 p-4 text-center text-xs text-slate-400">
                No active P1 tickets right now.
              </div>
            ) : (
              openP1.map((t) => (
                <div
                  key={t.id}
                  className="flex flex-col gap-2 rounded-lg border border-slate-200 bg-white p-2.5 text-xs sm:flex-row sm:items-center sm:justify-between"
                >
                  <Link href={`/admin/tickets/${t.id}`} className="flex min-w-0 flex-1 items-center gap-2 hover:underline">
                    <span className="flex-shrink-0 font-mono font-bold text-slate-900">#{t.id}</span>
                    <span className="truncate font-medium text-slate-800">{t.title}</span>
                    <span className="hidden flex-shrink-0 text-slate-400 sm:inline">· {t.employee}</span>
                  </Link>
                  <div className="flex flex-shrink-0 items-center gap-2">
                    <PriorityBadge priority="P1" />
                    <SlaBadge sla={t.sla} />
                    <select
                      value={t.status}
                      disabled={updatingId === t.id}
                      onChange={(e) => changeStatus(t.id, e.target.value)}
                      aria-label={`Status of ticket ${t.id}`}
                      className="cursor-pointer rounded border border-slate-300 bg-slate-50 px-2 py-1 text-xs font-medium text-slate-800"
                    >
                      {STATUSES.map((s) => (
                        <option key={s} value={s}>
                          {statusLabel(s)}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {onSummarizeP1 && (
          <button
            onClick={onSummarizeP1}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#86efac] px-4 py-2.5 text-sm font-bold text-slate-900 shadow-2xs transition-colors hover:bg-[#6ee7b7]"
          >
            <Sparkles className="h-4 w-4 text-emerald-800" />
            <span>Summarise open P1 tickets</span>
          </button>
        )}
      </div>
    </div>
  );
}

const TONES = {
  green: "bg-[#f0fdf4] border-[#dcfce7] text-emerald-700",
  red: "bg-[#fef2f2] border-[#fee2e2] text-red-600",
  amber: "bg-[#fffbeb] border-[#fef3c7] text-amber-700",
};

function Metric({
  icon,
  value,
  label,
  tone,
}: {
  icon: React.ReactNode;
  value: number;
  label: string;
  tone: keyof typeof TONES;
}) {
  return (
    <div className={`rounded-lg border p-3 text-center ${TONES[tone]}`}>
      <div className="mb-1 flex justify-center">{icon}</div>
      <div className="text-xl font-black">{value}</div>
      <div className="mt-0.5 text-[11px] font-medium text-slate-600">{label}</div>
    </div>
  );
}
