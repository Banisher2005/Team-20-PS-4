import { statusLabel } from "@/lib/helpdesk";

const PRIORITY_STYLES: Record<string, string> = {
  P1: "bg-red-100 text-red-700 ring-red-300 font-bold",
  P2: "bg-amber-100 text-amber-800 ring-amber-300 font-bold",
  P3: "bg-yellow-100 text-yellow-800 ring-yellow-300 font-semibold",
  P4: "bg-slate-100 text-slate-700 ring-slate-300 font-medium",
};

const STATUS_STYLES: Record<string, string> = {
  open: "bg-emerald-50 text-emerald-800 ring-emerald-300",
  in_progress: "bg-emerald-50 text-emerald-800 ring-emerald-300",
  waiting_for_user: "bg-purple-50 text-purple-800 ring-purple-300",
  resolved: "bg-emerald-100 text-emerald-800 ring-emerald-400",
  closed: "bg-slate-100 text-slate-700 ring-slate-300",
};

const base = "inline-flex items-center rounded-md px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset whitespace-nowrap";

export function PriorityBadge({ priority }: { priority: string }) {
  const p = priority.toUpperCase();
  return (
    <span className={`inline-flex items-center justify-center rounded px-2 py-0.5 text-xs ring-1 ring-inset whitespace-nowrap ${PRIORITY_STYLES[p] ?? PRIORITY_STYLES.P4}`}>
      {p}
    </span>
  );
}

export function StatusBadge({ status }: { status: string }) {
  const s = status.toLowerCase();
  return (
    <span className={`${base} ${STATUS_STYLES[s] ?? STATUS_STYLES.closed}`}>
      {statusLabel(status)}
    </span>
  );
}
