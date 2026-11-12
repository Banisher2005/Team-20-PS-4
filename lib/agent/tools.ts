import "server-only";
import { z } from "zod";
import { defineTool, type AgentTool } from "./defineTool";
import { getSupabase } from "../supabase";
import { orFilter, queryWords, rankArticles } from "../kbSearch";
import { categorySchema, joinedName, prioritySchema, statusSchema } from "../helpdesk";
import * as tickets from "../tickets";

/*
 * Employee DeskBot tools (PRD §7). The rules live in lib/tickets.ts; tools are thin wrappers.
 * No tool takes a user id: the user is ctx.actor, set on the server from the "Switch user" choice.
 */

// ---------------------------------------------------------------- shared with the admin

export const searchKnowledgeBase = defineTool({
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

export const ticketIdSchema = z.number().int().positive().describe("The numeric ticket id, e.g. 1");

// ---------------------------------------------------------------- employee tools

const getMyTickets = defineTool({
  name: "getMyTickets",
  description:
    "Use this when the user asks about their tickets, or when you need a ticket id before checking or changing a ticket. " +
    "Returns the logged-in user's tickets, newest first (max 20), with the number of IT updates on each.",
  schema: z.object({}),
  run: async (_args, { actor }) => {
    const list = await tickets.listMyTickets(actor, 20);
    return { count: list.length, tickets: list };
  },
});

const getTicketStatus = defineTool({
  name: "getTicketStatus",
  description:
    "Use this when the user asks for the status or details of one of their tickets. Needs the numeric ticket id; " +
    "call getMyTickets first if you do not know it. Returns status, priority, team, dates and SLA hours.",
  schema: z.object({ ticketId: ticketIdSchema }),
  run: async ({ ticketId }, { actor }) => {
    const t = await tickets.getTicketDetail(actor, ticketId);
    return {
      id: t.id,
      title: t.title,
      category: t.category,
      status: t.status,
      priority: t.priority,
      team: t.team,
      created_at: t.created_at,
      updated_at: t.updated_at,
      last_updated: t.last_updated,
      response_hours: t.response_hours,
      resolve_hours: t.resolve_hours,
      it_update_count: t.updates.filter((u) => u.by === "IT").length,
    };
  },
});

const getTicketUpdates = defineTool({
  name: "getTicketUpdates",
  description:
    "Use this when the user asks whether IT replied, what IT said or asked, or what has happened on one of their tickets. " +
    "Returns the notes added to the ticket by IT and by the user (oldest first).",
  schema: z.object({ ticketId: ticketIdSchema }),
  run: async ({ ticketId }, { actor }) => {
    const t = await tickets.getTicketDetail(actor, ticketId);
    return {
      ticketId: t.id,
      title: t.title,
      status: t.status,
      count: t.updates.length,
      updates: t.updates.slice(-15),
    };
  },
});

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
  run: (input, { actor }) => tickets.createTicket(actor, input),
});

const updateTicket = defineTool({
  name: "updateTicket",
  description:
    "Use this when the user wants to close, reopen, or add more details to one of their own tickets. " +
    "Needs the numeric ticket id (call getMyTickets first if unknown). Extra details are added to the ticket for IT. " +
    "Always pass EXACTLY the status the user asked for, even if you think it is not allowed: the system checks the rules " +
    "and returns an error you can explain. Never substitute a different status.",
  writes: true,
  schema: z.object({
    ticketId: ticketIdSchema,
    status: statusSchema.optional().describe("The exact new status the user asked for, only if they want to change it"),
    extraInfo: z.string().trim().max(500).optional().describe("Extra details for IT, added to the ticket"),
  }),
  run: ({ ticketId, status, extraInfo }, { actor }) => tickets.updateTicket(actor, ticketId, { status, note: extraInfo }),
});

/** Tools for employees. getOpenP1Tickets is admin-only (it shows other employees' names). */
export const employeeTools: AgentTool[] = [
  searchKnowledgeBase,
  getMyTickets,
  getTicketStatus,
  getTicketUpdates,
  createTicket,
  updateTicket,
];
