import { z } from "zod";

/** Shared helpdesk constants and helpers (safe for both server and browser). */

export const CATEGORIES = ["VPN", "Network", "Account", "Access", "Hardware", "Email", "Apps", "Security"] as const;
export const PRIORITIES = ["P1", "P2", "P3", "P4"] as const;
export const STATUSES = ["open", "in_progress", "waiting_for_user", "resolved", "closed"] as const;
export const ACTIVE_STATUSES = ["open", "in_progress", "waiting_for_user"] as const;

export type Category = (typeof CATEGORIES)[number];
export type Priority = (typeof PRIORITIES)[number];
export type TicketStatus = (typeof STATUSES)[number];

export const categorySchema = z.enum(CATEGORIES);
export const prioritySchema = z.enum(PRIORITIES);
export const statusSchema = z.enum(STATUSES);

/**
 * Status changes an employee may make on their own ticket (PRD §7.4).
 * Key = from, value = allowed targets.
 */
export const USER_TRANSITIONS: Record<TicketStatus, TicketStatus[]> = {
  open: ["closed"],
  in_progress: ["closed"],
  waiting_for_user: ["closed", "open"],
  resolved: ["closed", "open"],
  closed: ["open"],
};

/** Employees follow USER_TRANSITIONS; the IT admin may set any status. Same status = no change (allowed). */
export function canChangeStatus(role: "employee" | "admin", from: TicketStatus, to: TicketStatus): boolean {
  if (from === to) return true;
  if (role === "admin") return true;
  return USER_TRANSITIONS[from].includes(to);
}

// ---------------------------------------------------------------- notes in the description
// There is no comments table, so updates are appended to tickets.description:
//   "\n\n[Update 2026-11-12] text"     <- employee
//   "\n\n[IT update 2026-11-12] text"  <- IT admin

export type TicketUpdate = { by: "IT" | "employee"; date: string; text: string };

const UPDATE_RE = /\n\n\[(IT update|Update) (\d{4}-\d{2}-\d{2})\] /g;

/** Today's date in India (YYYY-MM-DD). */
export function todayIST(now: Date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata" }).format(now);
}

/** Returns the description with a new note appended. */
export function appendUpdate(description: string, by: "IT" | "employee", text: string, now: Date = new Date()): string {
  const clean = text.trim().replace(/\n{2,}/g, "\n"); // a blank line would look like a new note marker
  return `${description}\n\n[${by === "IT" ? "IT update" : "Update"} ${todayIST(now)}] ${clean}`;
}

/** Splits a description into the original text and the appended notes (oldest first). */
export function parseUpdates(description: string): { original: string; updates: TicketUpdate[] } {
  const matches = [...description.matchAll(UPDATE_RE)];
  if (matches.length === 0) return { original: description.trim(), updates: [] };
  const original = description.slice(0, matches[0].index).trim();
  const updates = matches.map((m, i) => {
    const start = (m.index ?? 0) + m[0].length;
    const end = i + 1 < matches.length ? matches[i + 1].index : description.length;
    return {
      by: m[1] === "IT update" ? ("IT" as const) : ("employee" as const),
      date: m[2],
      text: description.slice(start, end).trim(),
    };
  });
  return { original, updates };
}

const DONE_STATUSES: readonly string[] = ["resolved", "closed"];

/** "45 min", "5 h", "3 d" */
export function formatDuration(ms: number): string {
  const mins = Math.max(1, Math.round(Math.abs(ms) / 60_000));
  if (mins < 60) return `${mins} min`;
  const hours = Math.round(mins / 60);
  if (hours < 48) return `${hours} h`;
  return `${Math.round(hours / 24)} d`;
}

export type SlaInfo = {
  responseDue: string;
  resolveDue: string;
  responseMet: boolean;
  done: boolean;
  responseBreached: boolean;
  resolveBreached: boolean;
  overdue: boolean;
  label: string;
  tone: "ok" | "warn" | "bad" | "done";
};

/**
 * SLA status of a ticket from sla_rules hours (no extra DB columns needed).
 * Response counts as met once IT has moved the ticket out of "open". Resolve is met at resolved/closed.
 */
export function slaInfo(
  ticket: { created_at: string; status: string },
  hours: { response_hours: number; resolve_hours: number },
  now: number = Date.now()
): SlaInfo {
  const created = new Date(ticket.created_at).getTime();
  const responseDue = created + hours.response_hours * 3_600_000;
  const resolveDue = created + hours.resolve_hours * 3_600_000;
  const responseMet = ticket.status !== "open";
  const done = DONE_STATUSES.includes(ticket.status);
  const responseBreached = !responseMet && now > responseDue;
  const resolveBreached = !done && now > resolveDue;

  let label: string;
  let tone: SlaInfo["tone"];
  if (done) {
    label = "Done";
    tone = "done";
  } else if (!responseMet) {
    const left = responseDue - now;
    label = left < 0 ? `Response overdue ${formatDuration(left)}` : `Response due in ${formatDuration(left)}`;
    tone = left < 0 ? "bad" : left < 3_600_000 ? "warn" : "ok";
  } else {
    const left = resolveDue - now;
    label = left < 0 ? `Overdue ${formatDuration(left)}` : `Resolve due in ${formatDuration(left)}`;
    tone = left < 0 ? "bad" : left < 3_600_000 ? "warn" : "ok";
  }

  return {
    responseDue: new Date(responseDue).toISOString(),
    resolveDue: new Date(resolveDue).toISOString(),
    responseMet,
    done,
    responseBreached,
    resolveBreached,
    overdue: !done && (resolveBreached || (!responseMet && now > responseDue)),
    label,
    tone,
  };
}

export function statusLabel(status: string): string {
  const s = status.replace(/_/g, " ");
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/** Supabase may return a joined row as an object or a one-item array. */
export function joinedName(value: unknown): string | null {
  const row = Array.isArray(value) ? value[0] : value;
  if (row && typeof row === "object" && "name" in row) {
    const name = (row as { name: unknown }).name;
    return typeof name === "string" ? name : null;
  }
  return null;
}

/** "today", "yesterday", "3 days ago" — calendar days in India time. */
export function relativeDay(iso: string, now: Date = new Date()): string {
  const fmt = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata" });
  const day = (d: Date) => Date.parse(fmt.format(d));
  const diff = Math.round((day(now) - day(new Date(iso))) / 86_400_000);
  if (diff <= 0) return "today";
  if (diff === 1) return "yesterday";
  return `${diff} days ago`;
}
