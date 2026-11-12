import "server-only";
import { z } from "zod";
import { defineTool, type AgentTool } from "./defineTool";
import { getSupabase } from "../supabase";
import { CURRENT_USER_ID } from "../currentUser";
import { orFilter, queryWords, rankArticles } from "../kbSearch";
import {
  ACTIVE_STATUSES,
  USER_TRANSITIONS,
  categorySchema,
  joinedName,
  prioritySchema,
  relativeDay,
  statusSchema,
  type TicketStatus,
} from "../helpdesk";

/*
 * DeskBot tools (PRD §7). Rules that matter live here in code, not in the prompt:
 *  - the user is always CURRENT_USER_ID (no tool takes a user id)
 *  - the support team is looked up from the category, never chosen by Gemini
 *  - no second active ticket in the same category
 *  - users only see / change their own tickets, with allowed status changes only
 */

const notFound = (id: number) => new Error(`I couldn't find ticket #${id} in your tickets.`);

async function slaHours(priority: string) {
  const { data, error } = await getSupabase()
    .from("sla_rules")
    .select("response_hours, resolve_hours")
    .eq("priority", priority)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return { response_hours: data?.response_hours ?? null, resolve_hours: data?.resolve_hours ?? null };
}

// ---------------------------------------------------------------- READ tools

const searchKnowledgeBase = defineTool({
  name: "searchKnowledgeBase",
  description:
    "Use this when the user describes a new IT problem, BEFORE creating any ticket. " +
    "Searches the knowledge base by the key words of the problem and returns up to 3 matching articles " +
    "with their category, solution steps and support team. Returns an empty list if nothing matches.",
  schema: z.object({
    query: z
      .string()
      .trim()
      .min(2)
      .max(100)
      .describe("The key words of the problem, e.g. 'vpn disconnecting' or 'clicked suspicious link email'"),
  }),
  run: async ({ query }) => {
    const words = queryWords(query);
    if (words.length === 0) return { count: 0, articles: [] };

    const { data, error } = await getSupabase()
      .from("kb_articles")
      .select("id, title, category, keywords, solution_steps, support_teams(name)")
      .or(orFilter(words))
      .limit(50);
    if (error) throw new Error(error.message);

    const articles = rankArticles(data ?? [], words).map((a) => ({
      id: a.id,
      title: a.title,
      category: a.category,
      solution_steps: a.solution_steps,
      team: joinedName(a.support_teams),
    }));
    return { count: articles.length, articles };
  },
});

const getMyTickets = defineTool({
  name: "getMyTickets",
  description:
    "Use this when the user asks about their tickets, or when you need a ticket id before checking or changing a ticket. " +
    "Returns the logged-in user's tickets, newest first (max 20).",
  schema: z.object({}),
  run: async () => {
    const { data, error } = await getSupabase()
      .from("tickets")
      .select("id, title, category, priority, status, created_at, updated_at, support_teams(name)")
      .eq("employee_id", CURRENT_USER_ID)
      .order("created_at", { ascending: false })
      .limit(20);
    if (error) throw new Error(error.message);
    const tickets = (data ?? []).map((t) => ({
      id: t.id,
      title: t.title,
      category: t.category,
      priority: t.priority,
      team: joinedName(t.support_teams),
      status: t.status,
      created_at: t.created_at,
      updated_at: t.updated_at,
      last_updated: relativeDay(t.updated_at),
    }));
    return { count: tickets.length, tickets };
  },
});

const getTicketStatus = defineTool({
  name: "getTicketStatus",
  description:
    "Use this when the user asks for the status or details of one of their tickets. Needs the numeric ticket id; " +
    "call getMyTickets first if you do not know it. Returns status, priority, team, dates and SLA hours.",
  schema: z.object({
    ticketId: z.number().int().positive().describe("The numeric ticket id, e.g. 1"),
  }),
  run: async ({ ticketId }) => {
    const { data, error } = await getSupabase()
      .from("tickets")
      .select("id, title, category, status, priority, created_at, updated_at, support_teams(name)")
      .eq("id", ticketId)
      .eq("employee_id", CURRENT_USER_ID)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!data) throw notFound(ticketId);
    return {
      id: data.id,
      title: data.title,
      category: data.category,
      status: data.status,
      priority: data.priority,
      team: joinedName(data.support_teams),
      created_at: data.created_at,
      updated_at: data.updated_at,
      last_updated: relativeDay(data.updated_at),
      ...(await slaHours(data.priority)),
    };
  },
});

const getOpenP1Tickets = defineTool({
  name: "getOpenP1Tickets",
  description:
    "Use this when someone asks for a summary of all open P1 (critical) tickets across the company. " +
    "Returns every P1 ticket that is not resolved or closed, with team and employee name.",
  schema: z.object({}),
  run: async () => {
    const { data, error } = await getSupabase()
      .from("tickets")
      .select("id, title, status, created_at, support_teams(name), employees(name)")
      .eq("priority", "P1")
      .not("status", "in", "(resolved,closed)")
      .order("created_at", { ascending: false })
      .limit(20);
    if (error) throw new Error(error.message);
    const tickets = (data ?? []).map((t) => ({
      id: t.id,
      title: t.title,
      status: t.status,
      team: joinedName(t.support_teams),
      employee: joinedName(t.employees),
      created_at: t.created_at,
    }));
    return { count: tickets.length, tickets };
  },
});

// ---------------------------------------------------------------- WRITE tools

const createTicket = defineTool({
  name: "createTicket",
  description:
    "Use this when the knowledge-base fix did not work, no article matched, the article says to raise a ticket, " +
    "the user clearly asks for a ticket, or it is a security issue. The support team is chosen automatically " +
    "from the category. Fails if the user already has an active ticket in the same category.",
  writes: true,
  schema: z.object({
    title: z.string().trim().min(5).max(120).describe("Short summary of the problem, e.g. 'VPN keeps disconnecting'"),
    description: z
      .string()
      .trim()
      .min(10)
      .max(1000)
      .describe("What happened, since when, and what the user already tried"),
    category: categorySchema.describe("Category of the matching KB article, if any"),
    priority: prioritySchema.describe(
      "P1 many users blocked or security issue; P2 one user fully blocked; P3 work slowed; P4 a request or question"
    ),
  }),
  run: async ({ title, description, category, priority }) => {
    const db = getSupabase();

    // 1. Team comes from the category -> team mapping in kb_articles. Gemini never picks it.
    const { data: kb, error: kbError } = await db
      .from("kb_articles")
      .select("team_id")
      .eq("category", category)
      .limit(1)
      .maybeSingle();
    if (kbError) throw new Error(kbError.message);
    if (!kb) throw new Error(`I couldn't find a support team for ${category}.`);

    // 2. No second active ticket in the same category.
    const { data: existing, error: dupError } = await db
      .from("tickets")
      .select("id, status")
      .eq("employee_id", CURRENT_USER_ID)
      .eq("category", category)
      .in("status", [...ACTIVE_STATUSES])
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (dupError) throw new Error(dupError.message);
    if (existing) {
      throw new Error(
        `You already have an active ${category} ticket: #${existing.id} (${existing.status}). I can add details to it instead.`
      );
    }

    // 3. Insert for the logged-in user only.
    const { data, error } = await db
      .from("tickets")
      .insert({
        employee_id: CURRENT_USER_ID,
        title,
        description,
        category,
        priority,
        team_id: kb.team_id,
        status: "open",
      })
      .select("id, title, category, priority, status, support_teams(name)")
      .single();
    if (error) throw new Error(error.message);

    // 4. Team name + SLA hours for the reply.
    return {
      id: data.id,
      title: data.title,
      category: data.category,
      priority: data.priority,
      status: data.status,
      team: joinedName(data.support_teams),
      ...(await slaHours(data.priority)),
    };
  },
});

const updateTicket = defineTool({
  name: "updateTicket",
  description:
    "Use this when the user wants to close, reopen, or add more details to one of their own tickets. " +
    "Needs the numeric ticket id (call getMyTickets first if unknown). Allowed: open/in_progress/waiting_for_user -> closed; " +
    "waiting_for_user -> open; resolved -> closed; resolved/closed -> open (reopen).",
  writes: true,
  schema: z.object({
    ticketId: z.number().int().positive().describe("The numeric ticket id"),
    status: statusSchema.optional().describe("New status, only if the user wants to change it"),
    extraInfo: z.string().trim().max(500).optional().describe("Extra details to add to the ticket description"),
  }),
  run: async ({ ticketId, status, extraInfo }) => {
    const info = extraInfo?.trim();
    if (!status && !info) throw new Error("Tell me the new status or the extra details to add.");

    const db = getSupabase();
    const { data: ticket, error: readError } = await db
      .from("tickets")
      .select("id, status, description")
      .eq("id", ticketId)
      .eq("employee_id", CURRENT_USER_ID)
      .maybeSingle();
    if (readError) throw new Error(readError.message);
    if (!ticket) throw notFound(ticketId);

    const from = ticket.status as TicketStatus;
    const to = status ?? from;
    if (to !== from && !USER_TRANSITIONS[from].includes(to)) {
      throw new Error(`A ${from} ticket can't be changed to ${to}.`);
    }

    const patch: Record<string, string> = { status: to, updated_at: new Date().toISOString() };
    if (info) {
      const date = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata" }).format(new Date());
      patch.description = `${ticket.description}\n\n[Update ${date}] ${info}`;
    }

    const { data, error } = await db
      .from("tickets")
      .update(patch)
      .eq("id", ticketId)
      .eq("employee_id", CURRENT_USER_ID)
      .select("id, title, status, priority, updated_at, support_teams(name)")
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!data) throw notFound(ticketId);

    return {
      id: data.id,
      title: data.title,
      old_status: from,
      new_status: data.status,
      priority: data.priority,
      team: joinedName(data.support_teams),
      details_added: Boolean(info),
      updated_at: data.updated_at,
    };
  },
});

/** Every tool in this list is given to Gemini. */
export const tools: AgentTool[] = [
  searchKnowledgeBase,
  getMyTickets,
  getTicketStatus,
  createTicket,
  updateTicket,
  getOpenP1Tickets,
];
