"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/LayoutComponents";
import { ITAdminBoardCard, type AdminRow } from "@/components/ITAdminBoardCard";
import { PriorityBadge, SlaBadge, StatusBadge } from "@/components/Badges";
import { PRIORITIES, STATUSES, statusLabel } from "@/lib/helpdesk";
import { formatTimeAgo } from "@/components/MyTicketsCard";

const TEAMS = [
  ["T1", "Network & VPN"],
  ["T2", "Accounts & Access"],
  ["T3", "Hardware"],
  ["T4", "Software & Apps"],
  ["T5", "Security"],
] as const;

const TABS = [
  { id: "active", label: "Active" },
  { id: "overdue", label: "Past SLA" },
  { id: "waiting", label: "Waiting for user" },
  { id: "done", label: "Resolved / closed" },
  { id: "all", label: "All" },
] as const;
type Tab = (typeof TABS)[number]["id"];

const ACTIVE = ["open", "in_progress", "waiting_for_user"];

/** IT admin console: metrics, queue tabs + filters, links to each ticket. */
export default function AdminPage() {
  return (
    <AppShell title="IT Helpdesk · Ticket Queue">
      <AdminQueue />
    </AppShell>
  );
}

function AdminQueue() {
  const router = useRouter();
  const [rows, setRows] = useState<AdminRow[] | null>(null);
  const [error, setError] = useState("");
  const [tab, setTab] = useState<Tab>("active");
  const [team, setTeam] = useState("");
  const [priority, setPriority] = useState("");
  const [status, setStatus] = useState("");

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/tickets", { cache: "no-store" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Could not load tickets");
      setRows(data.tickets);
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load tickets");
    }
  }, []);

  useEffect(() => {
    load();
    const timer = setInterval(load, 5000);
    return () => clearInterval(timer);
  }, [load]);

  const counts = useMemo(() => {
    const r = rows ?? [];
    return {
      active: r.filter((t) => ACTIVE.includes(t.status)).length,
      overdue: r.filter((t) => t.sla?.overdue).length,
      waiting: r.filter((t) => t.status === "waiting_for_user").length,
      done: r.filter((t) => !ACTIVE.includes(t.status)).length,
      all: r.length,
    } satisfies Record<Tab, number>;
  }, [rows]);

  const filtered = useMemo(() => {
    const inTab = (t: AdminRow) =>
      tab === "active"
        ? ACTIVE.includes(t.status)
        : tab === "overdue"
          ? Boolean(t.sla?.overdue)
          : tab === "waiting"
            ? t.status === "waiting_for_user"
            : tab === "done"
              ? !ACTIVE.includes(t.status)
              : true;
    const list = (rows ?? []).filter(
      (t) => inTab(t) && (!team || t.team_id === team) && (!priority || t.priority === priority) && (!status || t.status === status)
    );
    // Overdue first, then by priority, then newest.
    return list.sort(
      (a, b) =>
        Number(Boolean(b.sla?.overdue)) - Number(Boolean(a.sla?.overdue)) ||
        a.priority.localeCompare(b.priority) ||
        b.created_at.localeCompare(a.created_at)
    );
  }, [rows, tab, team, priority, status]);

  const select = "rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-sm";

  return (
    <div className="mx-auto max-w-[1600px] space-y-4 lg:space-y-5">
      <ITAdminBoardCard
        rows={rows ?? []}
        onChanged={load}
        onSummarizeP1={() => router.push(`/admin/assistant?ask=${encodeURIComponent("Summarise all open P1 tickets.")}`)}
      />

      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xs">
        <div className="flex flex-wrap gap-1 border-b border-slate-100 p-2">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                tab === t.id ? "bg-[#86efac] text-slate-900" : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              {t.label} <span className="opacity-60">({counts[t.id]})</span>
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-2 border-b border-slate-100 p-3">
          <select value={team} onChange={(e) => setTeam(e.target.value)} className={select} aria-label="Team">
            <option value="">All teams</option>
            {TEAMS.map(([id, name]) => (
              <option key={id} value={id}>
                {name}
              </option>
            ))}
          </select>
          <select value={priority} onChange={(e) => setPriority(e.target.value)} className={select} aria-label="Priority">
            <option value="">All priorities</option>
            {PRIORITIES.map((p) => (
              <option key={p}>{p}</option>
            ))}
          </select>
          <select value={status} onChange={(e) => setStatus(e.target.value)} className={select} aria-label="Status">
            <option value="">All statuses</option>
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {statusLabel(s)}
              </option>
            ))}
          </select>
          <span className="text-xs text-slate-500">{filtered.length} tickets</span>
        </div>

        {error && <p className="p-4 text-sm text-red-600">{error}</p>}
        {rows === null && !error && <p className="p-4 text-sm text-slate-500">Loading…</p>}
        {rows && filtered.length === 0 && <p className="p-6 text-center text-sm text-slate-400">No tickets here.</p>}

        {/* Phone: cards */}
        <ul className="divide-y divide-slate-100 md:hidden">
          {filtered.map((t) => (
            <li key={t.id}>
              <Link href={`/admin/tickets/${t.id}`} className="block p-3 hover:bg-slate-50">
                <div className="flex items-start justify-between gap-2">
                  <p className="min-w-0 text-sm font-semibold text-slate-900">
                    <span className="mr-1 font-mono text-xs text-slate-500">#{t.id}</span>
                    {t.title}
                  </p>
                  <PriorityBadge priority={t.priority} />
                </div>
                <p className="mt-1 text-xs text-slate-500">
                  {t.employee} · {t.team}
                </p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  <StatusBadge status={t.status} />
                  <SlaBadge sla={t.sla} />
                </div>
              </Link>
            </li>
          ))}
        </ul>

        {/* Desktop: table */}
        <div className="hidden overflow-x-auto md:block">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-3 py-2">#</th>
                <th className="px-3 py-2">Ticket</th>
                <th className="px-3 py-2">Employee</th>
                <th className="px-3 py-2">Team</th>
                <th className="px-3 py-2">Priority</th>
                <th className="px-3 py-2">Status</th>
                <th className="px-3 py-2">SLA</th>
                <th className="px-3 py-2">Updated</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((t) => (
                <tr
                  key={t.id}
                  onClick={() => router.push(`/admin/tickets/${t.id}`)}
                  className="cursor-pointer hover:bg-emerald-50/40"
                >
                  <td className="px-3 py-2.5 font-mono text-xs font-bold text-slate-500">{t.id}</td>
                  <td className="px-3 py-2.5">
                    <Link href={`/admin/tickets/${t.id}`} className="font-semibold text-slate-900 hover:underline">
                      {t.title}
                    </Link>
                    <p className="text-xs text-slate-500">
                      {t.category}
                      {t.update_count > 0 && ` · ${t.update_count} note${t.update_count > 1 ? "s" : ""}`}
                    </p>
                  </td>
                  <td className="px-3 py-2.5">
                    {t.employee}
                    <span className="block font-mono text-[11px] text-slate-400">{t.employee_id}</span>
                  </td>
                  <td className="px-3 py-2.5">{t.team}</td>
                  <td className="px-3 py-2.5">
                    <PriorityBadge priority={t.priority} />
                  </td>
                  <td className="px-3 py-2.5">
                    <StatusBadge status={t.status} />
                  </td>
                  <td className="px-3 py-2.5">
                    <SlaBadge sla={t.sla} />
                  </td>
                  <td className="whitespace-nowrap px-3 py-2.5 text-xs text-slate-500">{formatTimeAgo(t.updated_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
