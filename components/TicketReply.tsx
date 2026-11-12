"use client";

import React, { useState } from "react";
import { Send } from "./Icons";
import type { TicketChange } from "./useTicket";

type Update = (change: TicketChange, done: string) => Promise<boolean>;

/**
 * Message box for talking back to IT. Always available; the buttons follow the ticket's status:
 * - open / in progress: Send
 * - waiting for you:    Send reply (the server moves the ticket back to open)
 * - resolved:           Send (note only) or Send & reopen
 * - closed:             Reopen & send
 * Enter sends with the first button, Shift+Enter adds a new line.
 */
export function TicketReplyBox({
  status,
  busy,
  onUpdate,
  compact = false,
}: {
  status: string;
  busy: boolean;
  onUpdate: Update;
  compact?: boolean;
}) {
  const [text, setText] = useState("");
  const note = text.trim();

  const actions: { label: string; change: (n: string) => TicketChange; done: string; primary?: boolean }[] =
    status === "closed"
      ? [{ label: "Reopen & send", change: (n) => ({ status: "open", note: n }), done: "Ticket reopened and your message sent to IT.", primary: true }]
      : status === "resolved"
        ? [
            { label: "Send", change: (n) => ({ note: n }), done: "Message added to the ticket." },
            { label: "Send & reopen", change: (n) => ({ status: "open", note: n }), done: "Ticket reopened and your message sent to IT.", primary: true },
          ]
        : status === "waiting_for_user"
          ? [{ label: "Send reply", change: (n) => ({ note: n }), done: "Sent to IT. Your ticket is open again.", primary: true }]
          : [{ label: "Send", change: (n) => ({ note: n }), done: "Message sent to IT.", primary: true }];

  async function run(action: (typeof actions)[number]) {
    if (!note || busy) return;
    if (await onUpdate(action.change(note), action.done)) setText("");
  }

  const hint =
    status === "closed"
      ? "This ticket is closed. Sending reopens it."
      : status === "resolved"
        ? "Still a problem? Send & reopen puts it back in IT's queue."
        : status === "waiting_for_user"
          ? "IT is waiting for your reply."
          : null;

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        run(actions[0]);
      }}
      className="space-y-2"
    >
      <div className="rounded-lg border border-box-line bg-box transition-colors focus-within:border-accent">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
              e.preventDefault();
              run(actions[0]);
            }
          }}
          rows={compact ? 2 : 3}
          maxLength={1000}
          aria-label="Message to IT"
          placeholder={status === "waiting_for_user" ? "Reply with the details IT asked for…" : "Write a message to IT…"}
          className="block w-full resize-none bg-transparent px-3 py-2 text-sm text-ink placeholder:text-mute/50 focus:outline-none"
        />
        <div className="flex flex-wrap items-center justify-end gap-2 border-t border-box-line px-2 py-1.5">
          <span className="mr-auto hidden text-[11px] text-mute/60 sm:inline">Enter to send · Shift+Enter for a new line</span>
          {actions.map((a) => (
            <button
              key={a.label}
              type="button"
              onClick={() => run(a)}
              disabled={busy || !note}
              className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-bold transition-colors disabled:opacity-40 ${
                a.primary
                  ? "bg-[#86efac] text-slate-900 hover:bg-[#6ee7b7]"
                  : "border border-box-line bg-box text-ink hover:bg-box-hover"
              }`}
            >
              {a.primary && <Send className="h-3.5 w-3.5" />}
              {a.label}
            </button>
          ))}
        </div>
      </div>
      {hint && <p className="text-[11px] text-mute2/70">{hint}</p>}
    </form>
  );
}

/** Close / reopen buttons (PRD §7.4 employee transitions). */
export function TicketStatusActions({
  status,
  busy,
  onUpdate,
  size = "md",
}: {
  status: string;
  busy: boolean;
  onUpdate: Update;
  size?: "sm" | "md";
}) {
  const active = status === "open" || status === "in_progress" || status === "waiting_for_user";
  const pad = size === "sm" ? "px-3 py-1.5 text-xs" : "px-3 py-2 text-sm";
  const btn = (primary?: boolean) =>
    `rounded-lg font-semibold transition-colors disabled:opacity-40 ${pad} ${
      primary ? "bg-lime text-slate-900 hover:bg-[#91db79]" : "border border-edge/25 bg-tint/20 text-ink hover:bg-tint/35"
    }`;

  return (
    <>
      {status === "resolved" && (
        <button onClick={() => onUpdate({ status: "closed" }, "Thanks! Ticket closed.")} disabled={busy} className={btn(true)}>
          Yes, it&apos;s fixed — close
        </button>
      )}
      {(status === "resolved" || status === "closed") && (
        <button onClick={() => onUpdate({ status: "open" }, "Ticket reopened. IT will take another look.")} disabled={busy} className={btn()}>
          Reopen ticket
        </button>
      )}
      {active && (
        <button onClick={() => onUpdate({ status: "closed" }, "Ticket closed.")} disabled={busy} className={btn()}>
          My issue is fixed — close
        </button>
      )}
    </>
  );
}
