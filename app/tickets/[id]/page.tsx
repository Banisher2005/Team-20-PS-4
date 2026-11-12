"use client";

import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { AppShell, useActingUser } from "@/components/LayoutComponents";
import { TicketHeaderCard, type TicketDetail } from "@/components/TicketHeaderCard";
import { TicketTimeline } from "@/components/TicketTimeline";
import { ArrowLeft } from "@/components/Icons";
import { markUpdatesSeen } from "@/lib/seenUpdates";

/** Employee: one ticket — details, IT updates, add details, close / reopen. */
export default function EmployeeTicketPage() {
  return (
    <AppShell title="Ticket details">
      <TicketView />
    </AppShell>
  );
}

function TicketView() {
  const { id } = useParams<{ id: string }>();
  const { actor } = useActingUser();
  const [ticket, setTicket] = useState<TicketDetail | null>(null);
  const [error, setError] = useState("");
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
    const timer = setInterval(load, 5000); // pick up IT updates without a reload
    return () => clearInterval(timer);
  }, [load]);

  // Opening the ticket marks its IT updates as seen (clears the dot in My Tickets / the bell).
  useEffect(() => {
    if (actor && ticket) markUpdatesSeen(actor.userId, ticket.id, ticket.updates.filter((u) => u.by === "IT").length);
  }, [actor, ticket]);

  async function update(change: { status?: string; note?: string }, done: string) {
    setBusy(true);
    setFlash("");
    try {
      const res = await fetch(`/api/tickets/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(change),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Update failed");
      setNote("");
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
      <div className="mx-auto max-w-3xl space-y-3">
        <BackLink />
        <p className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</p>
      </div>
    );
  }
  if (!ticket || !actor) return <p className="p-6 text-sm text-slate-500">Loading…</p>;

  const s = ticket.status;
  const active = s === "open" || s === "in_progress" || s === "waiting_for_user";
  const waiting = s === "waiting_for_user";

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <BackLink />
      <TicketHeaderCard ticket={ticket} />

      {waiting && (
        <div className="rounded-xl border border-purple-200 bg-purple-50 p-3 text-sm text-purple-900">
          <span className="font-semibold">IT is waiting for you.</span> Reply below with the details they asked for.
        </div>
      )}

      <section className="gw-panel rounded-xl border p-4 shadow-2xs sm:p-5">
        <h3 className="mb-4 text-sm font-bold text-white">Updates</h3>
        <TicketTimeline
          description={ticket.description}
          updates={ticket.updates}
          createdAt={ticket.created_at}
          employeeName={actor.name}
          viewer="employee"
        />
      </section>

      <section className="gw-panel space-y-3 rounded-xl border p-4 shadow-2xs sm:p-5">
        {s !== "closed" && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (note.trim()) update({ note }, waiting ? "Sent to IT. Your ticket is open again." : "Details added for IT.");
            }}
            className="space-y-2"
          >
            <label htmlFor="note" className="text-sm font-bold text-white">
              {waiting ? "Reply to IT" : "Add details for IT"}
            </label>
            <textarea
              id="note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={3}
              maxLength={1000}
              placeholder="e.g. The error says 'Authentication failed (809)'."
              className="w-full rounded-lg border border-[rgba(124,229,119,0.25)] bg-[rgba(3,18,14,0.4)] px-3 py-2 text-sm text-white placeholder-emerald-200/50 focus:border-emerald-500 focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
            />
            <button
              type="submit"
              disabled={busy || !note.trim()}
              className="rounded-lg bg-[#86efac] px-4 py-2 text-sm font-bold text-slate-900 hover:bg-[#6ee7b7] disabled:opacity-40"
            >
              {waiting ? "Send reply" : "Add details"}
            </button>
          </form>
        )}

        <div className="flex flex-wrap gap-2 border-t border-[rgba(124,229,119,0.15)] pt-3">
          {s === "resolved" && (
            <ActionButton onClick={() => update({ status: "closed" }, "Thanks! Ticket closed.")} disabled={busy} primary>
              Yes, it&apos;s fixed — close
            </ActionButton>
          )}
          {(s === "resolved" || s === "closed") && (
            <ActionButton onClick={() => update({ status: "open" }, "Ticket reopened. IT will take another look.")} disabled={busy}>
              Problem came back — reopen
            </ActionButton>
          )}
          {active && (
            <ActionButton onClick={() => update({ status: "closed" }, "Ticket closed.")} disabled={busy}>
              My issue is fixed — close ticket
            </ActionButton>
          )}
        </div>
        {flash && <p className="text-sm text-emerald-200">{flash}</p>}
      </section>
    </div>
  );
}

function BackLink() {
  return (
    <Link href="/tickets" className="inline-flex items-center gap-1.5 text-sm font-semibold text-emerald-200/70 hover:text-[#7ce577]">
      <ArrowLeft className="h-4 w-4" /> My tickets
    </Link>
  );
}

function ActionButton({
  children,
  onClick,
  disabled,
  primary,
}: {
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  primary?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`rounded-lg px-3 py-2 text-sm font-semibold transition-colors disabled:opacity-40 ${
        primary
          ? "bg-[#7ce577] text-slate-900 hover:bg-[#91db79]"
          : "border border-[rgba(124,229,119,0.25)] bg-[rgba(14,124,90,0.2)] text-white hover:bg-[rgba(14,124,90,0.35)]"
      }`}
    >
      {children}
    </button>
  );
}
