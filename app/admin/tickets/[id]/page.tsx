"use client";

import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { AppShell } from "@/components/LayoutComponents";
import { TicketHeaderCard, type TicketDetail } from "@/components/TicketHeaderCard";
import { TicketTimeline } from "@/components/TicketTimeline";
import { ArrowLeft } from "@/components/Icons";
import { STATUSES, statusLabel } from "@/lib/helpdesk";

/** IT admin: resolve one ticket by hand — change status and/or send a note to the employee. */
export default function AdminTicketPage() {
  return (
    <AppShell title="IT Helpdesk · Ticket">
      <AdminTicket />
    </AppShell>
  );
}

function AdminTicket() {
  const { id } = useParams<{ id: string }>();
  const [ticket, setTicket] = useState<TicketDetail | null>(null);
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [flash, setFlash] = useState("");

  const load = useCallback(async () => {
    try {
      const res = await fetch(`/api/tickets/${id}`, { cache: "no-store" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Could not load the ticket");
      setTicket(data.ticket);
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load the ticket");
    }
  }, [id]);

  useEffect(() => {
    load();
    const timer = setInterval(load, 5000); // pick up the employee's replies
    return () => clearInterval(timer);
  }, [load]);

  // Keep the status picker in sync with the ticket unless the admin is editing it.
  useEffect(() => {
    if (ticket && !busy) setStatus((s) => s || ticket.status);
  }, [ticket, busy]);

  async function save(change: { status?: string; note?: string }, done: string) {
    setBusy(true);
    setFlash("");
    try {
      const res = await fetch("/api/admin/tickets", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: Number(id), ...change }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Update failed");
      setNote("");
      setStatus(data.result?.new_status ?? "");
      setFlash(done);
      await load();
    } catch (err) {
      setFlash(err instanceof Error ? err.message : "Update failed");
    } finally {
      setBusy(false);
    }
  }

  if (error) {
    return (
      <div className="mx-auto max-w-5xl space-y-3">
        <BackLink />
        <p className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</p>
      </div>
    );
  }
  if (!ticket) return <p className="p-6 text-sm text-slate-500">Loading…</p>;

  const statusChanged = status && status !== ticket.status;
  const trimmed = note.trim();

  return (
    <div className="mx-auto grid max-w-6xl grid-cols-1 gap-4 lg:grid-cols-5">
      <div className="space-y-4 lg:col-span-3">
        <BackLink />
        <TicketHeaderCard ticket={ticket} showEmployee />
        <section className="gw-panel rounded-xl border p-4 shadow-2xs sm:p-5">
          <h3 className="mb-4 text-sm font-bold text-[#f4ffc7]">Conversation</h3>
          <TicketTimeline
            description={ticket.description}
            updates={ticket.updates}
            createdAt={ticket.created_at}
            employeeName={ticket.employee?.name ?? "Employee"}
            viewer="admin"
          />
        </section>
      </div>

      <aside className="space-y-4 lg:col-span-2 lg:pt-9">
        <section className="gw-panel space-y-3 rounded-xl border p-4 shadow-2xs sm:p-5">
          <h3 className="text-sm font-bold text-[#f4ffc7]">Resolve this ticket</h3>

          <label className="block text-xs font-semibold text-emerald-200/80" htmlFor="status">
            Status
          </label>
          <select
            id="status"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="w-full rounded-lg border border-[rgba(124,229,119,0.25)] bg-[rgba(3,18,14,0.4)] px-3 py-2 text-sm text-[#f4ffc7]"
          >
            {STATUSES.map((s) => (
              <option key={s} value={s} className="bg-[#031813] text-[#f4ffc7]">
                {statusLabel(s)}
              </option>
            ))}
          </select>

          <label className="block text-xs font-semibold text-emerald-200/80" htmlFor="note">
            Note to {ticket.employee?.name ?? "the employee"} <span className="font-normal text-emerald-300/50">(optional)</span>
          </label>
          <textarea
            id="note"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={4}
            maxLength={1000}
            placeholder="e.g. We replaced the VPN profile. Please restart the VPN app and try again."
            className="w-full rounded-lg border border-[rgba(124,229,119,0.25)] bg-[rgba(3,18,14,0.4)] px-3 py-2 text-sm text-[#f4ffc7] placeholder-emerald-200/50 focus:border-emerald-500 focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
          />

          <button
            onClick={() =>
              save(
                { ...(statusChanged ? { status } : {}), ...(trimmed ? { note: trimmed } : {}) },
                "Saved. The employee will see it on their ticket."
              )
            }
            disabled={busy || (!statusChanged && !trimmed)}
            className="w-full rounded-lg bg-[#7ce577] px-4 py-2 text-sm font-bold text-slate-900 hover:bg-[#91db79] disabled:opacity-40"
          >
            {busy ? "Saving…" : "Save"}
          </button>

          <div className="space-y-2 border-t border-[rgba(124,229,119,0.15)] pt-3">
            <p className="text-xs font-semibold text-emerald-300/70">Quick actions</p>
            <div className="flex flex-wrap gap-2">
              {ticket.status === "open" && (
                <Quick disabled={busy} onClick={() => save({ status: "in_progress" }, "Marked in progress.")}>
                  Start work
                </Quick>
              )}
              <Quick
                disabled={busy || !trimmed}
                title={!trimmed ? "Write the question in the note first" : undefined}
                onClick={() => save({ status: "waiting_for_user", note: trimmed }, "Question sent. Waiting for the employee.")}
              >
                Ask employee for info
              </Quick>
              <Quick
                disabled={busy || ticket.status === "resolved"}
                onClick={() =>
                  save({ status: "resolved", ...(trimmed ? { note: trimmed } : {}) }, "Resolved. The employee can confirm or reopen.")
                }
              >
                Resolve{trimmed ? " with note" : ""}
              </Quick>
            </div>
          </div>
          {flash && <p className="text-sm text-emerald-200">{flash}</p>}
        </section>
      </aside>
    </div>
  );
}

function BackLink() {
  return (
    <Link href="/admin" className="inline-flex items-center gap-1.5 text-sm font-semibold text-emerald-200/70 hover:text-[#7ce577]">
      <ArrowLeft className="h-4 w-4" /> Ticket queue
    </Link>
  );
}

function Quick({
  children,
  onClick,
  disabled,
  title,
}: {
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  title?: string;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={title}
      className="rounded-lg border border-[rgba(124,229,119,0.25)] bg-[rgba(14,124,90,0.2)] px-3 py-1.5 text-xs font-semibold text-[#f4ffc7] hover:bg-[rgba(14,124,90,0.35)] disabled:opacity-40"
    >
      {children}
    </button>
  );
}
