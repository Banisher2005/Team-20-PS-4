import React from "react";
import { PriorityBadge, SlaBadge, StatusBadge } from "./Badges";
import type { SlaInfo, TicketUpdate } from "@/lib/helpdesk";

/** Shape of GET /api/tickets/:id -> ticket */
export type TicketDetail = {
  id: number;
  title: string;
  description: string;
  updates: TicketUpdate[];
  category: string;
  priority: string;
  status: string;
  team_id: string;
  team: string | null;
  created_at: string;
  updated_at: string;
  last_updated: string;
  response_hours: number | null;
  resolve_hours: number | null;
  sla: SlaInfo | null;
  employee: { id: string; name: string; department: string; location: string; laptop_model: string | null } | null;
};

export function TicketHeaderCard({ ticket, showEmployee }: { ticket: TicketDetail; showEmployee?: boolean }) {
  const fmt = (iso: string) =>
    new Date(iso).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" });

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-mono text-sm font-bold text-slate-500">#{ticket.id}</span>
            <h2 className="break-words text-lg font-bold text-slate-900">{ticket.title}</h2>
          </div>
          <p className="mt-1 text-sm text-slate-500">
            {ticket.category} · {ticket.team ?? "IT Support"}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <PriorityBadge priority={ticket.priority} />
          <StatusBadge status={ticket.status} />
          <SlaBadge sla={ticket.sla} />
        </div>
      </div>

      <dl className="mt-4 grid grid-cols-2 gap-3 border-t border-slate-100 pt-4 text-xs sm:grid-cols-4">
        <Item label="Created">{fmt(ticket.created_at)}</Item>
        <Item label="Last updated">{fmt(ticket.updated_at)}</Item>
        <Item label="Response target">{ticket.response_hours != null ? `${ticket.response_hours} h` : "—"}</Item>
        <Item label="Resolve target">{ticket.resolve_hours != null ? `${ticket.resolve_hours} h` : "—"}</Item>
        {showEmployee && ticket.employee && (
          <>
            <Item label="Employee">
              {ticket.employee.name} ({ticket.employee.id})
            </Item>
            <Item label="Department">{ticket.employee.department}</Item>
            <Item label="Location">{ticket.employee.location}</Item>
            <Item label="Laptop">{ticket.employee.laptop_model ?? "—"}</Item>
          </>
        )}
      </dl>
    </div>
  );
}

function Item({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="min-w-0">
      <dt className="font-medium text-slate-400">{label}</dt>
      <dd className="mt-0.5 truncate font-semibold text-slate-800">{children}</dd>
    </div>
  );
}
