"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { PRIORITIES, STATUSES, joinedName, statusLabel } from "@/lib/helpdesk";
import { PriorityBadge, StatusBadge } from "@/components/Badges";

type Row = {
  id: number;
  title: string;
  category: string;
  priority: string;
  status: string;
  team_id: string;
  updated_at: string;
  support_teams: unknown;
  employees: unknown;
};

const TEAMS = [
  ["T1", "Network & VPN"],
  ["T2", "Accounts & Access"],
  ["T3", "Hardware"],
  ["T4", "Software & Apps"],
  ["T5", "Security"],
] as const;

const P1_PROMPT = "Summarise all open P1 tickets.";

/** IT Admin board (stretch): all tickets, filters, status changes, P1 summary. */
export default function AdminPage() {
  const [rows, setRows] = useState<Row[]>([]);
  const [error, setError] = useState("");
  const [team, setTeam] = useState("");
  const [priority, setPriority] = useState("");
  const [status, setStatus] = useState("");
  const [saving, setSaving] = useState<number | null>(null);
  const [summary, setSummary] = useState("");
  const [summarising, setSummarising] = useState(false);

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

  const filtered = useMemo(
    () =>
      rows.filter(
        (r) => (!team || r.team_id === team) && (!priority || r.priority === priority) && (!status || r.status === status)
      ),
    [rows, team, priority, status]
  );

  async function changeStatus(id: number, next: string) {
    setSaving(id);
    try {
      const res = await fetch("/api/admin/tickets", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status: next }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Update failed");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Update failed");
    } finally {
      setSaving(null);
    }
  }

  async function summariseP1() {
    setSummarising(true);
    setSummary("");
    try {
      const res = await fetch("/api/agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: [{ role: "user", text: P1_PROMPT }] }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Agent failed");
      setSummary(data.reply);
    } catch (err) {
      setSummary(err instanceof Error ? err.message : "Agent failed");
    } finally {
      setSummarising(false);
    }
  }

  const select = "rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-sm";

  return (
    <main className="mx-auto max-w-6xl px-4 py-4 md:p-6">
      <header className="mb-4 flex flex-wrap items-start justify-between gap-2">
        <div>
          <h1 className="text-xl font-semibold">DeskBot · IT Admin board</h1>
          <p className="text-sm text-slate-500">All tickets across Zentrix · refreshes every 5 s</p>
        </div>
        <Link href="/" className="text-sm text-slate-500 hover:text-slate-900">
          ← Back to chat
        </Link>
      </header>

      <div className="mb-4 rounded-xl border border-slate-200 bg-white p-4">
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={summariseP1}
            disabled={summarising}
            className="rounded-lg bg-red-600 px-3 py-1.5 text-sm text-white disabled:opacity-50"
          >
            {summarising ? "Summarising…" : "Summarise open P1s"}
          </button>
          <span className="text-xs text-slate-500">Asks DeskBot (uses the getOpenP1Tickets tool)</span>
        </div>
        {summary && <p className="mt-3 whitespace-pre-wrap rounded-lg bg-slate-50 p-3 text-sm">{summary}</p>}
      </div>

      <div className="mb-3 flex flex-wrap gap-2">
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
        <span className="self-center text-xs text-slate-500">{filtered.length} tickets</span>
      </div>

      {error && <p className="mb-3 text-sm text-red-600">{error}</p>}

      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase text-slate-500">
            <tr>
              <th className="px-3 py-2">#</th>
              <th className="px-3 py-2">Title</th>
              <th className="px-3 py-2">Employee</th>
              <th className="px-3 py-2">Team</th>
              <th className="px-3 py-2">Priority</th>
              <th className="px-3 py-2">Status</th>
              <th className="px-3 py-2">Change</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filtered.map((r) => (
              <tr key={r.id}>
                <td className="px-3 py-2 text-slate-400">{r.id}</td>
                <td className="px-3 py-2">
                  <p className="font-medium">{r.title}</p>
                  <p className="text-xs text-slate-500">{r.category}</p>
                </td>
                <td className="px-3 py-2">{joinedName(r.employees) ?? "—"}</td>
                <td className="px-3 py-2">{joinedName(r.support_teams) ?? "—"}</td>
                <td className="px-3 py-2">
                  <PriorityBadge priority={r.priority} />
                </td>
                <td className="px-3 py-2">
                  <StatusBadge status={r.status} />
                </td>
                <td className="px-3 py-2">
                  <select
                    value={r.status}
                    disabled={saving === r.id}
                    onChange={(e) => changeStatus(r.id, e.target.value)}
                    className={select}
                    aria-label={`Status of ticket ${r.id}`}
                  >
                    {STATUSES.map((s) => (
                      <option key={s} value={s}>
                        {statusLabel(s)}
                      </option>
                    ))}
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}
