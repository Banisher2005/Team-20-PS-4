import { statusLabel } from "@/lib/helpdesk";

const PRIORITY_STYLES: Record<string, string> = {
  P1: "bg-red-100 text-red-800 ring-red-200",
  P2: "bg-orange-100 text-orange-800 ring-orange-200",
  P3: "bg-yellow-100 text-yellow-800 ring-yellow-200",
  P4: "bg-slate-100 text-slate-700 ring-slate-200",
};

const STATUS_STYLES: Record<string, string> = {
  open: "bg-blue-100 text-blue-800 ring-blue-200",
  in_progress: "bg-amber-100 text-amber-800 ring-amber-200",
  waiting_for_user: "bg-purple-100 text-purple-800 ring-purple-200",
  resolved: "bg-green-100 text-green-800 ring-green-200",
  closed: "bg-slate-100 text-slate-600 ring-slate-200",
};

const base = "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset whitespace-nowrap";

export function PriorityBadge({ priority }: { priority: string }) {
  return <span className={`${base} ${PRIORITY_STYLES[priority] ?? PRIORITY_STYLES.P4}`}>{priority}</span>;
}

export function StatusBadge({ status }: { status: string }) {
  return <span className={`${base} ${STATUS_STYLES[status] ?? STATUS_STYLES.closed}`}>{statusLabel(status)}</span>;
}
