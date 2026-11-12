"use client";

import React, { useEffect, useRef } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { AppShell, useActingUser } from "@/components/LayoutComponents";
import { TicketHeaderCard } from "@/components/TicketHeaderCard";
import { TicketTimeline } from "@/components/TicketTimeline";
import { TicketReplyBox, TicketStatusActions } from "@/components/TicketReply";
import { useTicket } from "@/components/useTicket";
import { ArrowLeft } from "@/components/Icons";

/** Employee: one ticket — details, a conversation with IT, reply, close / reopen. */
export default function EmployeeTicketPage() {
  return (
    <AppShell title="Ticket details">
      <TicketView />
    </AppShell>
  );
}

function TicketView() {
  const { id } = useParams<{ id: string }>();
  const ticketId = /^\d+$/.test(id) ? Number(id) : null;
  const { actor } = useActingUser();
  const { ticket, error, busy, flash, update } = useTicket(ticketId, actor?.userId);
  const threadRef = useRef<HTMLDivElement>(null);
  const messageCount = ticket ? ticket.updates.length : 0;

  // Keep the newest message in view when the ticket loads and whenever a message arrives.
  useEffect(() => {
    const el = threadRef.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [messageCount, ticket?.id]);

  if (ticketId === null || error) {
    return (
      <div className="mx-auto max-w-3xl space-y-3">
        <BackLink />
        <p className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error || "That ticket number isn't valid."}
        </p>
      </div>
    );
  }
  if (!ticket || !actor) return <p className="p-6 text-sm text-slate-500">Loading…</p>;

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <BackLink />
      <TicketHeaderCard ticket={ticket} />

      {ticket.status === "waiting_for_user" && (
        <div className="rounded-xl border border-purple-200 bg-purple-50 p-3 text-sm text-purple-900">
          <span className="font-semibold">IT is waiting for you.</span> Reply below with the details they asked for.
        </div>
      )}

      <section className="gw-panel flex flex-col overflow-hidden rounded-xl border shadow-2xs">
        <div className="flex items-center justify-between border-b border-box-line px-4 py-3 sm:px-5">
          <h3 className="text-sm font-bold text-ink">Conversation with IT</h3>
          <span className="text-[11px] text-mute/60">Updates every 5 s</span>
        </div>
        <div ref={threadRef} className="max-h-[55dvh] min-h-[180px] overflow-y-auto px-4 py-4 sm:px-5">
          <TicketTimeline
            description={ticket.description}
            updates={ticket.updates}
            createdAt={ticket.created_at}
            employeeName={actor.name}
            viewer="employee"
          />
        </div>
        <div className="border-t border-box-line px-4 py-3 sm:px-5">
          <TicketReplyBox key={ticket.id} status={ticket.status} busy={busy} onUpdate={update} />
          {flash && <p className="mt-2 text-sm text-mute2">{flash}</p>}
        </div>
      </section>

      <section className="gw-panel flex flex-wrap gap-2 rounded-xl border p-4 shadow-2xs sm:p-5">
        <TicketStatusActions status={ticket.status} busy={busy} onUpdate={update} />
      </section>
    </div>
  );
}

function BackLink() {
  return (
    <Link href="/tickets" className="inline-flex items-center gap-1.5 text-sm font-semibold text-mute2/70 hover:text-accent">
      <ArrowLeft className="h-4 w-4" /> My tickets
    </Link>
  );
}
