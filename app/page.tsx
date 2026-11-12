"use client";

import React, { useState } from "react";
import { AppShell, useActingUser } from "@/components/LayoutComponents";
import { HelpdeskChat } from "@/components/HelpdeskChat";
import { MyTicketsCard } from "@/components/MyTicketsCard";

// The three PRD demo prompts (D1–D3).
const SAMPLE_PROMPTS = [
  "My VPN keeps disconnecting since morning.",
  "I clicked a strange link in an email.",
  "What is the status of my laptop ticket?",
];

/** Employee home: DeskBot chat + My Tickets. */
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

  if (!actor || actor.role !== "employee") {
    return <p className="p-6 text-sm text-slate-500">Loading…</p>;
  }

  const firstName = actor.name.split(" ")[0];

  return (
    <div className="mx-auto grid max-w-[1600px] grid-cols-1 gap-4 lg:grid-cols-12 lg:gap-5">
      <section className="flex min-w-0 flex-col lg:col-span-7">
        <HelpdeskChat
          userBadge={actor.userId}
          greeting={`Hi ${firstName}! 👋 Tell me what's wrong and I'll check the knowledge base for a fix first.`}
          samplePrompts={SAMPLE_PROMPTS}
          storageKey={`deskbot_chat_${actor.userId}`}
          onDataChanged={() => setRefreshKey((k) => k + 1)}
        />
      </section>
      <section className="flex min-w-0 flex-col gap-4 lg:col-span-5 lg:gap-5">
        <MyTicketsCard userId={actor.userId} refreshKey={refreshKey} />
      </section>
    </div>
  );
}
