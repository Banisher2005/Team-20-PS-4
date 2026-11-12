"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { PriorityBadge, StatusBadge } from "./Badges";
import { ArrowRight, CheckCircle2, MessageSquare, X } from "./Icons";
import { CompactTimeline, updateDay } from "./TicketTimeline";
import { TicketReplyBox, TicketStatusActions } from "./TicketReply";
import { useTicket } from "./useTicket";

// ---------------------------------------------------------------- ?ticket=<id> in the URL

function readTicketParam(): number | null {
  if (typeof window === "undefined") return null;
  const raw = new URLSearchParams(window.location.search).get("ticket");
  return raw && /^\d+$/.test(raw) ? Number(raw) : null;
}

function urlWithTicket(id: number | null): string {
  const url = new URL(window.location.href);
  if (id === null) url.searchParams.delete("ticket");
  else url.searchParams.set("ticket", String(id));
  return url.pathname + url.search + url.hash;
}

/**
 * Which ticket the drawer shows, kept in the URL (?ticket=14):
 * the back button closes the drawer and a copied link opens straight to it.
 */
export function useTicketDrawer() {
  const [ticketId, setTicketId] = useState<number | null>(null);
  const pushed = useRef(false); // did we add a history entry we can go "back" from?

  useEffect(() => {
    setTicketId(readTicketParam());
    const onPop = () => {
      pushed.current = false;
      setTicketId(readTicketParam());
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  const open = useCallback((id: number) => {
    if (readTicketParam() === null) {
      window.history.pushState(window.history.state, "", urlWithTicket(id));
      pushed.current = true;
    } else {
      window.history.replaceState(window.history.state, "", urlWithTicket(id)); // switching tickets: one entry
    }
    setTicketId(id);
  }, []);

  const close = useCallback(() => {
    if (pushed.current) {
      window.history.back(); // popstate clears the id
    } else {
      window.history.replaceState(window.history.state, "", urlWithTicket(null));
      setTicketId(null);
    }
  }, []);

  return { ticketId, open, close };
}

// ---------------------------------------------------------------- the drawer

const SLIDE_MS = 200;

/** Right-side slide-over with a ticket's details, timeline and a reply box (full-screen on phones). */
export function TicketDrawer({
  ticketId,
  userId,
  employeeName,
  onClose,
  onAskDeskBot,
  onChanged,
}: {
  ticketId: number | null;
  userId: string;
  employeeName: string;
  onClose: () => void;
  onAskDeskBot?: (id: number) => void;
  onChanged?: () => void;
}) {
  const open = ticketId !== null;
  const [mounted, setMounted] = useState(false); // portal target exists (client only)
  const [rendered, setRendered] = useState(open); // stay in the DOM while sliding out
  const [shown, setShown] = useState(false); // drives the slide/fade transition
  const closeBtn = useRef<HTMLButtonElement>(null);
  const { ticket, error, busy, flash, update } = useTicket(ticketId, userId, onChanged);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (open) {
      setRendered(true);
      const raf = requestAnimationFrame(() => requestAnimationFrame(() => setShown(true)));
      return () => cancelAnimationFrame(raf);
    }
    setShown(false);
    const t = setTimeout(() => setRendered(false), SLIDE_MS);
    return () => clearTimeout(t);
  }, [open]);

  // Esc closes; focus the close button on open; no page scrolling behind the drawer.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [open, onClose]);

  // Move keyboard focus into the drawer once it is actually on screen.
  useEffect(() => {
    if (shown) closeBtn.current?.focus();
  }, [shown]);

  if (!mounted || !rendered) return null;

  const latestIt = ticket ? [...ticket.updates].reverse().find((u) => u.by === "IT") : undefined;

  return createPortal(
    <div className="fixed inset-0 z-[60]" role="presentation">
      <div
        onClick={onClose}
        className={`absolute inset-0 bg-black/40 transition-opacity duration-200 ${shown ? "opacity-100" : "opacity-0"}`}
        aria-hidden="true"
      />
      <aside
        role="dialog"
        aria-modal="true"
        aria-label={ticket ? `Ticket #${ticket.id}: ${ticket.title}` : "Ticket details"}
        className={`absolute inset-y-0 right-0 flex w-full flex-col border-l border-box-line bg-solid text-ink shadow-2xl transition-transform duration-200 ease-out sm:max-w-md ${
          shown ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-3 border-b border-box-line px-5 py-4">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-sm font-bold text-accent">Ticket #{ticketId}</span>
              {ticket && <PriorityBadge priority={ticket.priority} />}
              {ticket && <StatusBadge status={ticket.status} />}
            </div>
            {ticket && (
              <>
                <h2 className="mt-1.5 break-words text-lg font-bold leading-snug text-ink">{ticket.title}</h2>
                <p className="mt-0.5 text-xs text-mute2/70">
                  {ticket.category} · Assigned to {ticket.team ?? "IT Support"}
                </p>
              </>
            )}
          </div>
          <button
            ref={closeBtn}
            onClick={onClose}
            aria-label="Close ticket details"
            className="flex-shrink-0 rounded-lg border border-box-line bg-box p-2 text-mute transition-colors hover:bg-box-hover hover:text-ink focus-visible:outline-2 focus-visible:outline-accent"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 space-y-5 overflow-y-auto px-5 py-4">
          {error && <p className="border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</p>}
          {!ticket && !error && <p className="py-10 text-center text-sm text-mute/60">Loading…</p>}

          {ticket && (
            <>
              {ticket.status === "waiting_for_user" && (
                <p className="rounded-lg border border-purple-300 bg-purple-50 p-3 text-sm text-purple-900">
                  <span className="font-semibold">IT is waiting for you.</span> Reply below with the details they asked for.
                </p>
              )}

              <section>
                <h3 className="mb-2 text-[11px] font-bold uppercase tracking-wider text-mute2/70">Issue description</h3>
                <p className="whitespace-pre-wrap break-words rounded-lg border border-box-line bg-box p-3 text-sm text-ink">
                  {ticket.description}
                </p>
              </section>

              {latestIt && (
                <section className="rounded-lg border border-accent/30 bg-tint/10 p-3">
                  <div className="mb-1.5 flex items-center justify-between gap-2 text-xs">
                    <span className="flex items-center gap-1.5 font-bold text-accent">
                      <CheckCircle2 className="h-4 w-4" /> Latest IT note
                    </span>
                    <span className="text-mute/70">{updateDay(latestIt.date)}</span>
                  </div>
                  <p className="whitespace-pre-wrap break-words text-sm text-ink">{latestIt.text}</p>
                </section>
              )}

              <section>
                <h3 className="mb-2 text-[11px] font-bold uppercase tracking-wider text-mute2/70">Timeline</h3>
                <CompactTimeline updates={ticket.updates} createdAt={ticket.created_at} employeeName={employeeName} />
              </section>

              <section>
                <h3 className="mb-2 text-[11px] font-bold uppercase tracking-wider text-mute2/70">Reply to IT</h3>
                <TicketReplyBox key={ticket.id} status={ticket.status} busy={busy} onUpdate={update} compact />
                {flash && <p className="mt-2 text-xs font-medium text-mute2">{flash}</p>}
              </section>
            </>
          )}
        </div>

        {/* Footer */}
        {ticket && (
          <div className="space-y-2 border-t border-box-line px-5 py-3">
            <div className="flex flex-wrap gap-2">
              <TicketStatusActions status={ticket.status} busy={busy} onUpdate={update} size="sm" />
              {onAskDeskBot && (
                <button
                  onClick={() => onAskDeskBot(ticket.id)}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-accent/40 bg-tint/10 px-3 py-1.5 text-xs font-semibold text-accent transition-colors hover:bg-tint/20"
                >
                  <MessageSquare className="h-3.5 w-3.5" /> Ask DeskBot
                </button>
              )}
            </div>
            <Link
              href={`/tickets/${ticket.id}`}
              className="flex items-center justify-center gap-1.5 rounded-lg bg-accent px-3 py-2 text-sm font-bold text-solid transition-opacity hover:opacity-90"
            >
              Open full details <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        )}
      </aside>
    </div>,
    document.body
  );
}
