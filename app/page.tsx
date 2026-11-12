"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { AppShell, useActingUser } from "@/components/LayoutComponents";
import { HelpdeskChat, type AgentChatHandle } from "@/components/HelpdeskChat";
import { MyTicketsCard } from "@/components/MyTicketsCard";
import { TicketDrawer, useTicketDrawer } from "@/components/TicketDrawer";

// The three PRD demo prompts (D1–D3).
const SAMPLE_PROMPTS = [
  "My VPN keeps disconnecting since morning.",
  "I clicked a strange link in an email.",
  "What is the status of my laptop ticket?",
];

/** What "Ask DeskBot" sends to the chat about a ticket. */
function askAboutTicket(id: number): string {
  return `What's the latest on ticket #${id}?`;
}

/** Employee home: DeskBot chat + My Tickets (clicking a ticket opens the ticket drawer). */
export default function HomePage() {
  return (
    <AppShell title="IT Helpdesk Ticket Agent">
      <EmployeeHome />
    </AppShell>
  );
}

function EmployeeHome() {
  const { actor } = useActingUser();
  const [refreshKey, setRefreshKey] = useState(0);
  const chatRef = useRef<AgentChatHandle>(null);
  const drawer = useTicketDrawer();
  const refresh = useCallback(() => setRefreshKey((k) => k + 1), []);
  const askedFromUrl = useRef(false);

  // /?ask=14 (from "Ask DeskBot" on the My Tickets page): ask once, then drop the param.
  useEffect(() => {
    if (!actor || askedFromUrl.current) return;
    const url = new URL(window.location.href);
    const ask = url.searchParams.get("ask");
    if (!ask || !/^\d+$/.test(ask)) return;
    askedFromUrl.current = true;
    url.searchParams.delete("ask");
    window.history.replaceState(window.history.state, "", url.pathname + url.search + url.hash);
    chatRef.current?.sendMessage(askAboutTicket(Number(ask)));
  }, [actor]);

  if (!actor || actor.role !== "employee") {
    return <p className="p-6 text-sm text-slate-500">Loading…</p>;
  }

  const firstName = actor.name.split(" ")[0];

  return (
    <div className="mx-auto grid max-w-[1600px] grid-cols-1 gap-4 lg:grid-cols-12 lg:gap-5">
      <section className="flex min-w-0 flex-col lg:col-span-7">
        <HelpdeskChat
          ref={chatRef}
          userBadge={actor.userId}
          greeting={`Hi ${firstName}! 👋 Tell me what's wrong and I'll check the knowledge base for a fix first.`}
          samplePrompts={SAMPLE_PROMPTS}
          storageKey={`deskbot_chat_${actor.userId}`}
          onDataChanged={refresh}
        />
      </section>
      <section className="flex min-w-0 flex-col gap-4 lg:col-span-5 lg:gap-5">
        <MyTicketsCard
          userId={actor.userId}
          refreshKey={refreshKey}
          onOpenTicket={drawer.open}
          activeTicketId={drawer.ticketId}
        />
      </section>

      <TicketDrawer
        ticketId={drawer.ticketId}
        userId={actor.userId}
        employeeName={actor.name}
        onClose={drawer.close}
        onChanged={refresh}
        onAskDeskBot={(id) => {
          drawer.close();
          chatRef.current?.sendMessage(askAboutTicket(id));
        }}
      />
    </div>
  );
}
