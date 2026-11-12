import "server-only";
import { getSupabase } from "./supabase";
import { HttpError } from "./http";
import type { Actor } from "./actorShared";
import {
  ACTIVE_STATUSES,
  STATUSES,
  appendUpdate,
  canChangeStatus,
  joinedName,
  parseUpdates,
  relativeDay,
  slaInfo,
  type Category,
  type Priority,
  type TicketStatus,
} from "./helpdesk";

/*
 * Ticket service: the ONE place the helpdesk rules live.
 * Used by the API routes and by the agent tools. Uses only the 5 seed tables (no schema changes).
 * Every function takes the Actor from the server (acting-user cookie), never from user/AI input.
 */

const db = () => getSupabase();

function fail(message: string, status = 400): never {
  throw new HttpError(status, message);
}

/** Unwraps a Supabase result, throwing on error. */
function check<T>(result: { data: T; error: { message: string } | null }): T {
  if (result.error) throw new Error(result.error.message);
  return result.data;
}

/** Like check(), but also throws if no row came back. */
function checkOne<T>(result: { data: T; error: { message: string } | null }): NonNullable<T> {
  const data = check(result);
  if (data === null || data === undefined) throw new Error("Row not found");
  return data;
}

const notFound = (id: number): never => fail(`I couldn't find ticket #${id} in your tickets.`, 404);

// ---------------------------------------------------------------- lookups

type SlaRow = { priority: string; response_hours: number; resolve_hours: number };

export async function getSlaMap(): Promise<Map<string, SlaRow>> {
  const rows = check(await db().from("sla_rules").select("priority, response_hours, resolve_hours")) ?? [];
  return new Map(rows.map((r) => [r.priority, r]));
}

async function teamForCategory(category: Category): Promise<string> {
  const row = check(await db().from("kb_articles").select("team_id").eq("category", category).limit(1).maybeSingle());
  if (!row) fail(`I couldn't find a support team for ${category}.`);
  return row.team_id;
}

type TicketRow = {
  id: number;
  employee_id: string;
  title: string;
  description: string;
  category: string;
  priority: string;
  team_id: string;
  status: TicketStatus;
  created_at: string;
  updated_at: string;
};

const TICKET_COLUMNS = "id, employee_id, title, description, category, priority, team_id, status, created_at, updated_at";

/** Loads a ticket the actor may see. Employees: only their own (same message for "not yours" and "missing"). */
export async function getTicketForActor(actor: Actor, id: number): Promise<TicketRow> {
  let query = db().from("tickets").select(TICKET_COLUMNS).eq("id", id);
  if (actor.role === "employee") query = query.eq("employee_id", actor.userId);
  const row = check(await query.maybeSingle()) as TicketRow | null;
  return row ?? notFound(id);
}

// ---------------------------------------------------------------- employee: list + create

export async function listMyTickets(actor: Actor, limit = 20) {
  if (actor.role !== "employee") fail("Switch to an employee to see their tickets.", 403);
  const rows =
    check(
      await db()
        .from("tickets")
        .select("id, title, description, category, priority, status, created_at, updated_at, support_teams(name)")
        .eq("employee_id", actor.userId)
        .order("created_at", { ascending: false })
        .limit(limit)
    ) ?? [];

  return rows.map((t) => {
    const { updates } = parseUpdates(t.description);
    const itUpdates = updates.filter((u) => u.by === "IT");
    return {
      id: t.id,
      title: t.title,
      category: t.category,
      priority: t.priority,
      status: t.status,
      team: joinedName(t.support_teams),
      created_at: t.created_at,
      updated_at: t.updated_at,
      last_updated: relativeDay(t.updated_at),
      it_update_count: itUpdates.length,
      latest_it_update: itUpdates.at(-1)?.text ?? null,
    };
  });
}

export async function createTicket(
  actor: Actor,
  input: { title: string; description: string; category: Category; priority: Priority }
) {
  if (actor.role !== "employee") fail("Switch to an employee to raise a ticket.", 403);

  // 1. Team comes from the category -> team mapping in kb_articles. The AI never picks it.
  const teamId = await teamForCategory(input.category);

  // 2. No second active ticket in the same category.
  const existing = check(
    await db()
      .from("tickets")
      .select("id, status")
      .eq("employee_id", actor.userId)
      .eq("category", input.category)
      .in("status", [...ACTIVE_STATUSES])
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle()
  );
  if (existing) {
    fail(
      `You already have an active ${input.category} ticket: #${existing.id} (${existing.status}). I can add details to it instead.`,
      409
    );
  }

  // 3. Insert for the acting employee only.
  const row = checkOne(
    await db()
      .from("tickets")
      .insert({ ...input, employee_id: actor.userId, team_id: teamId, status: "open" })
      .select("id, title, category, priority, status, support_teams(name)")
      .single()
  );

  const sla = (await getSlaMap()).get(row.priority);
  return {
    id: row.id,
    title: row.title,
    category: row.category,
    priority: row.priority,
    status: row.status,
    team: joinedName(row.support_teams),
    response_hours: sla?.response_hours ?? null,
    resolve_hours: sla?.resolve_hours ?? null,
  };
}

// ---------------------------------------------------------------- detail

export async function getTicketDetail(actor: Actor, id: number) {
  await getTicketForActor(actor, id); // access check
  const row = checkOne(
    await db()
      .from("tickets")
      .select(`${TICKET_COLUMNS}, support_teams(name), employees(name, department, location, laptop_model)`)
      .eq("id", id)
      .single()
  );
  const sla = (await getSlaMap()).get(row.priority);
  const emp = (Array.isArray(row.employees) ? row.employees[0] : row.employees) as
    | { name: string; department: string; location: string; laptop_model: string | null }
    | null;
  const { original, updates } = parseUpdates(row.description);
  return {
    id: row.id as number,
    title: row.title as string,
    description: original,
    updates,
    category: row.category as string,
    priority: row.priority as string,
    status: row.status as TicketStatus,
    team_id: row.team_id as string,
    team: joinedName(row.support_teams),
    created_at: row.created_at as string,
    updated_at: row.updated_at as string,
    last_updated: relativeDay(row.updated_at),
    response_hours: sla?.response_hours ?? null,
    resolve_hours: sla?.resolve_hours ?? null,
    sla: sla ? slaInfo(row, sla) : null,
    employee: emp ? { id: row.employee_id as string, ...emp } : null,
  };
}

// ---------------------------------------------------------------- changes

/**
 * Changes status and/or appends a note, in one update.
 * - Employees follow USER_TRANSITIONS; the admin may set any status.
 * - Notes are appended to the description: "[Update date]" (employee) or "[IT update date]" (admin).
 * - An employee note on a waiting_for_user ticket moves it back to open (they replied).
 * - updated_at is always set.
 */
export async function updateTicket(actor: Actor, id: number, change: { status?: TicketStatus; note?: string }) {
  const note = change.note?.trim();
  if (!change.status && !note) fail("Tell me the new status or the extra details to add.");
  if (note && note.length > 1000) fail("Notes can be at most 1000 characters.");
  if (change.status && !STATUSES.includes(change.status)) fail(`Unknown status ${change.status}.`);

  const ticket = await getTicketForActor(actor, id);
  const from = ticket.status;
  let to: TicketStatus = change.status ?? from;

  if (!canChangeStatus(actor.role, from, to)) fail(`A ${from} ticket can't be changed to ${to}.`);
  if (actor.role === "employee" && note && !change.status) {
    if (from === "closed") fail(`Ticket #${id} is closed. Reopen it first if the problem came back.`);
    if (from === "waiting_for_user") to = "open";
  }

  const patch: Record<string, string> = { status: to, updated_at: new Date().toISOString() };
  if (note) patch.description = appendUpdate(ticket.description, actor.role === "admin" ? "IT" : "employee", note);

  const row = checkOne(
    await db()
      .from("tickets")
      .update(patch)
      .eq("id", id)
      .select("id, title, status, priority, updated_at, support_teams(name)")
      .single()
  );
  return {
    id: row.id as number,
    title: row.title as string,
    old_status: from,
    new_status: row.status as TicketStatus,
    priority: row.priority as string,
    team: joinedName(row.support_teams),
    note_added: Boolean(note),
    updated_at: row.updated_at as string,
  };
}

// ---------------------------------------------------------------- admin queue

export type QueueFilter = {
  team?: string;
  status?: TicketStatus | "active";
  priority?: Priority;
  overdueOnly?: boolean;
  limit?: number;
};

export async function getQueue(actor: Actor, filter: QueueFilter = {}) {
  if (actor.role !== "admin") fail("IT admin only.", 403);
  let query = db()
    .from("tickets")
    .select("id, title, description, category, priority, status, team_id, employee_id, created_at, updated_at, support_teams(name), employees(name)")
    .order("created_at", { ascending: false })
    .limit(200);
  if (filter.team) query = query.eq("team_id", filter.team);
  if (filter.priority) query = query.eq("priority", filter.priority);
  if (filter.status === "active") query = query.in("status", [...ACTIVE_STATUSES]);
  else if (filter.status) query = query.eq("status", filter.status);

  const slaMap = await getSlaMap();
  const rows = (check(await query) ?? []).map((t) => {
    const hours = slaMap.get(t.priority);
    return {
      id: t.id as number,
      title: t.title as string,
      category: t.category as string,
      priority: t.priority as string,
      status: t.status as TicketStatus,
      team_id: t.team_id as string,
      team: joinedName(t.support_teams),
      employee_id: t.employee_id as string,
      employee: joinedName(t.employees),
      update_count: parseUpdates(t.description).updates.length,
      created_at: t.created_at as string,
      updated_at: t.updated_at as string,
      sla: hours ? slaInfo(t, hours) : null,
    };
  });
  const filtered = filter.overdueOnly ? rows.filter((r) => r.sla?.overdue) : rows;
  return filtered.slice(0, filter.limit ?? 200);
}
