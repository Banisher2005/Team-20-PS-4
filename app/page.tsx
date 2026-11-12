"use client";

import { useState } from "react";
import Link from "next/link";
import AgentChat from "@/components/AgentChat";
import TicketList from "@/components/TicketList";

/** Home: DeskBot chat on the left, My Tickets on the right (stacks on phones). */
export default function HomePage() {
  // Changes every time the agent writes data, so My Tickets reloads immediately.
  const [refreshKey, setRefreshKey] = useState(0);

  async function logout() {
    await fetch("/api/logout", { method: "POST" });
    window.location.href = "/login";
  }

  return (
    <main className="mx-auto max-w-6xl px-4 py-4 md:p-6">
      <header className="mb-4 flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <h1 className="text-xl font-semibold">DeskBot</h1>
          <p className="text-sm text-slate-500">IT help in chat — fixes first, tickets if needed</p>
          <p className="text-xs text-slate-400">Zentrix Software · signed in as Karthik S (E101)</p>
        </div>
        <nav className="flex items-center gap-4 text-sm text-slate-500">
          <Link href="/admin" className="hover:text-slate-900">
            IT Admin
          </Link>
          <button onClick={logout} className="hover:text-slate-900">
            Log out
          </button>
        </nav>
      </header>
      <div className="grid gap-4 md:grid-cols-5">
        <section className="min-w-0 md:col-span-3">
          <AgentChat onDataChanged={() => setRefreshKey((k) => k + 1)} />
        </section>
        <section className="min-w-0 md:col-span-2">
          <TicketList refreshKey={refreshKey} />
        </section>
      </div>
    </main>
  );
}
