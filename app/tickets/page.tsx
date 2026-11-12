"use client";

import React, { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { AppShell, useActingUser } from "@/components/LayoutComponents";
import { MyTicketsCard } from "@/components/MyTicketsCard";
import { TicketDrawer, useTicketDrawer } from "@/components/TicketDrawer";

/** Employee: all of my tickets (clicking one opens the ticket drawer). */
export default function TicketsPage() {
  return (
    <AppShell title="My Tickets">
      <AllTickets />
    </AppShell>
  );
}

function AllTickets() {
  const { actor } = useActingUser();
  const router = useRouter();
  const drawer = useTicketDrawer();
  const [refreshKey, setRefreshKey] = useState(0);
  const refresh = useCallback(() => setRefreshKey((k) => k + 1), []);

  if (!actor || actor.role !== "employee") return <p className="p-6 text-sm text-slate-500">Loading…</p>;
  return (
    <div className="mx-auto max-w-4xl">
      <MyTicketsCard
        userId={actor.userId}
        refreshKey={refreshKey}
        limit={50}
        title={`${actor.name}'s tickets`}
        showViewAll={false}
        onOpenTicket={drawer.open}
        activeTicketId={drawer.ticketId}
      />
      <TicketDrawer
        ticketId={drawer.ticketId}
        userId={actor.userId}
        employeeName={actor.name}
        onClose={drawer.close}
        onChanged={refresh}
        onAskDeskBot={(id) => router.push(`/?ask=${id}`)}
      />
    </div>
  );
}
