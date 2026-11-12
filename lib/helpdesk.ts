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
