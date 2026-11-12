"use client";

import React from "react";
import { AppShell, useActingUser } from "@/components/LayoutComponents";
import { MyTicketsCard } from "@/components/MyTicketsCard";

/** Employee: all of my tickets. */
export default function TicketsPage() {
  return (
    <AppShell title="My Tickets">
      <AllTickets />
    </AppShell>
  );
}

function AllTickets() {
  const { actor } = useActingUser();
  if (!actor || actor.role !== "employee") return <p className="p-6 text-sm text-slate-500">Loading…</p>;
  return (
    <div className="mx-auto max-w-4xl">
      <MyTicketsCard userId={actor.userId} limit={50} title={`${actor.name}'s tickets`} showViewAll={false} />
    </div>
  );
}
