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
    <div className="gw-panel rounded-xl border p-4 shadow-2xs sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-mono text-sm font-bold text-[#7ce577]">#{ticket.id}</span>
            <h2 className="break-words text-lg font-bold text-[#f4ffc7]">{ticket.title}</h2>
          </div>
          <p className="mt-1 text-sm text-emerald-300/70">
            {ticket.category} · {ticket.team ?? "IT Support"}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <PriorityBadge priority={ticket.priority} />
          <StatusBadge status={ticket.status} />
          <SlaBadge sla={ticket.sla} />
        </div>
      </div>

      <dl className="mt-4 grid grid-cols-2 gap-3 border-t border-[rgba(124,229,119,0.15)] pt-4 text-xs sm:grid-cols-4">
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
      <dt className="font-medium text-emerald-300/60">{label}</dt>
      <dd className="mt-0.5 truncate font-semibold text-[#f4ffc7]">{children}</dd>
    </div>
  );
}
