"use client";

import { useCallback, useEffect, useState } from "react";
import type { TicketDetail } from "./TicketHeaderCard";
import { markUpdatesSeen } from "@/lib/seenUpdates";

export type TicketChange = { status?: "open" | "closed"; note?: string };

const REFRESH_MS = 5000;

/**
 * One employee ticket from GET /api/tickets/:id, refreshed every 5 s so IT replies appear on their own.
 * Shared by the ticket drawer and the full ticket page.
 * - id === null pauses loading but keeps the last ticket (so a closing drawer doesn't go blank).
 * - Loading a ticket marks its IT updates as seen (clears the dot in My Tickets / the bell).
 */
export function useTicket(id: number | null, userId: string | undefined, onChanged?: () => void) {
  const [ticket, setTicket] = useState<TicketDetail | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [flash, setFlash] = useState("");

  const load = useCallback(async () => {
    if (id === null) return;
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

  // Switching tickets: drop the old one's messages so they never show under the new title.
  useEffect(() => {
    if (id === null) return;
    setTicket((t) => (t && t.id !== id ? null : t));
    setFlash("");
    setError("");
  }, [id]);

  useEffect(() => {
    if (id === null) return;
    load();
    const timer = setInterval(load, REFRESH_MS);
    return () => clearInterval(timer);
  }, [id, load]);

  useEffect(() => {
    if (userId && ticket && ticket.id === id) {
      markUpdatesSeen(userId, ticket.id, ticket.updates.filter((u) => u.by === "IT").length);
    }
  }, [userId, ticket, id]);

  /** Sends a note and/or status change; returns true when it worked. */
  const update = useCallback(
    async (change: TicketChange, done: string): Promise<boolean> => {
      if (id === null) return false;
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
        setFlash(done);
        await load();
        onChanged?.();
        return true;
      } catch (err) {
        setFlash(err instanceof Error ? err.message : "Update failed");
        return false;
      } finally {
        setBusy(false);
      }
    },
    [id, load, onChanged]
  );

  // While paused (id null) keep showing the last ticket; otherwise never show a different ticket's data.
  const shown = id === null || ticket?.id === id ? ticket : null;
  return { ticket: shown, error, busy, flash, update };
}
