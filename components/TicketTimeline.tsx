import React from "react";
import { Bot, Shield } from "./Icons";
import type { TicketUpdate } from "@/lib/helpdesk";

/**
 * Conversation-style view of a ticket: the original description, then every note
 * appended to the description by IT ("[IT update …]") or the employee ("[Update …]").
 */
export function TicketTimeline({
  description,
  updates,
  createdAt,
  employeeName,
  viewer,
}: {
  description: string;
  updates: TicketUpdate[];
  createdAt: string;
  employeeName: string;
  viewer: "employee" | "admin";
}) {
  const created = new Date(createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });

  return (
    <ol className="space-y-4">
      <Bubble
        mine={viewer === "employee"}
        who={employeeName}
        when={created}
        tag="Reported"
        tone="employee"
        text={description}
      />
      {updates.map((u, i) => (
        <Bubble
          key={i}
          mine={(u.by === "IT") === (viewer === "admin")}
          who={u.by === "IT" ? "IT Helpdesk" : employeeName}
          when={new Date(`${u.date}T00:00:00+05:30`).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
          tone={u.by === "IT" ? "it" : "employee"}
          text={u.text}
        />
      ))}
      {updates.length === 0 && (
        <li className="text-center text-xs text-slate-400">No updates yet. Notes from IT and the employee appear here.</li>
      )}
    </ol>
  );
}

function Bubble({
  mine,
  who,
  when,
  tag,
  tone,
  text,
}: {
  mine: boolean;
  who: string;
  when: string;
  tag?: string;
  tone: "it" | "employee";
  text: string;
}) {
  const color =
    tone === "it" ? "border-amber-200 bg-amber-50 text-slate-900" : "border-[#bbf7d0] bg-[#dcfce7] text-slate-900";
  return (
    <li className={`flex ${mine ? "justify-end" : "justify-start"}`}>
      <div className={`flex max-w-[92%] gap-2 sm:max-w-[80%] ${mine ? "flex-row-reverse" : ""}`}>
        <div
          className={`mt-0.5 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg ${
            tone === "it" ? "bg-amber-100 text-amber-700" : "bg-[#276e6a] text-emerald-300"
          }`}
        >
          {tone === "it" ? <Shield className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
        </div>
        <div className={`min-w-0 ${mine ? "items-end text-right" : ""} flex flex-col`}>
          <div className="mb-1 flex items-center gap-2 text-[11px] text-slate-500">
            <span className="font-bold text-slate-800">{who}</span>
            {tag && <span className="rounded bg-slate-100 px-1.5 font-semibold">{tag}</span>}
            <span>{when}</span>
          </div>
          <div className={`whitespace-pre-wrap break-words rounded-2xl border px-3.5 py-2.5 text-left text-sm ${color}`}>
            {text}
          </div>
        </div>
      </div>
    </li>
  );
}
