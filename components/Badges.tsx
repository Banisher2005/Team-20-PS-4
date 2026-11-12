import { statusLabel, type SlaInfo } from "@/lib/helpdesk";

// PRD §9.1 colours: P1 red · P2 orange · P3 yellow · P4 grey
const PRIORITY_STYLES: Record<string, string> = {
  P1: "bg-red-100 text-red-700 ring-red-300 font-bold",
  P2: "bg-orange-100 text-orange-800 ring-orange-300 font-bold",
  P3: "bg-yellow-100 text-yellow-800 ring-yellow-300 font-semibold",
  P4: "bg-slate-100 text-slate-700 ring-slate-300 font-medium",
};

// PRD §9.1 colours: open blue · in_progress amber · waiting_for_user purple · resolved green · closed grey
const STATUS_STYLES: Record<string, string> = {
  open: "bg-blue-50 text-blue-800 ring-blue-300",
  in_progress: "bg-amber-50 text-amber-800 ring-amber-300",
  waiting_for_user: "bg-purple-50 text-purple-800 ring-purple-300",
  resolved: "bg-emerald-100 text-emerald-800 ring-emerald-400",
  closed: "bg-slate-100 text-slate-700 ring-slate-300",
};

const SLA_STYLES: Record<SlaInfo["tone"], string> = {
  ok: "bg-slate-50 text-slate-600 ring-slate-200",
  warn: "bg-amber-50 text-amber-800 ring-amber-300",
  bad: "bg-red-50 text-red-700 ring-red-300 font-semibold",
  done: "bg-emerald-50 text-emerald-700 ring-emerald-200",
};

const base = "inline-flex items-center rounded-md px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset whitespace-nowrap";

export function PriorityBadge({ priority }: { priority: string }) {
  const p = priority.toUpperCase();
  return (
    <span
      className={`inline-flex items-center justify-center whitespace-nowrap rounded px-2 py-0.5 text-xs ring-1 ring-inset ${PRIORITY_STYLES[p] ?? PRIORITY_STYLES.P4}`}
    >
      {p}
    </span>
  );
}

export function StatusBadge({ status }: { status: string }) {
  const s = status.toLowerCase();
  return <span className={`${base} ${STATUS_STYLES[s] ?? STATUS_STYLES.closed}`}>{statusLabel(status)}</span>;
}

export function SlaBadge({ sla }: { sla: Pick<SlaInfo, "label" | "tone"> | null | undefined }) {
  if (!sla) return null;
  return <span className={`${base} ${SLA_STYLES[sla.tone]}`}>{sla.label}</span>;
}

/** Ticket ids are plain numbers everywhere (PRD §5.5): "#11". */
export function TicketId({ id, className = "" }: { id: number; className?: string }) {
  return <span className={`font-mono text-xs font-bold text-slate-900 ${className}`}>#{id}</span>;
}
