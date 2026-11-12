import "server-only";
import { z } from "zod";
import { defineTool, type AgentTool } from "./defineTool";
import { searchKnowledgeBase, ticketIdSchema } from "./tools";
import { STATUSES, prioritySchema, statusSchema } from "../helpdesk";
import * as tickets from "../tickets";

/*
 * IT admin DeskBot tools. Only given to Gemini when the acting user is "IT Helpdesk (Admin)".
 * The admin resolves tickets manually in the console; these tools help them find and summarise work,
 * and can change a ticket only when the admin explicitly asks.
 */

const getQueue = defineTool({
  name: "getQueue",
  description:
    "Use this when the admin asks about the ticket queue: open or overdue tickets, a team's tickets, or tickets by priority. " +
    "Returns max 20 tickets with SLA status. Teams: T1 Network & VPN, T2 Accounts & Access, T3 Hardware, T4 Software & Apps, T5 Security.",
  schema: z.object({
    team: z.enum(["T1", "T2", "T3", "T4", "T5"]).optional().describe("Team id"),
    status: z
      .enum([...STATUSES, "active"])
      .optional()
      .describe("Filter by status; 'active' = open, in_progress or waiting_for_user. Default active."),
    priority: prioritySchema.optional(),
    overdueOnly: z.boolean().optional().describe("Only tickets past their SLA"),
  }),
  run: async ({ team, status, priority, overdueOnly }, { actor }) => {
    const rows = await tickets.getQueue(actor, { team, status: status ?? "active", priority, overdueOnly, limit: 20 });
    return {
      count: rows.length,
      tickets: rows.map((t) => ({
        id: t.id,
        title: t.title,
        priority: t.priority,
        status: t.status,
        team: t.team,
        employee: t.employee,
        sla: t.sla?.label ?? null,
        overdue: t.sla?.overdue ?? false,
      })),
    };
  },
});

const getTicketDetails = defineTool({
  name: "getTicketDetails",
  description:
    "Use this when the admin asks about one ticket or wants it summarised. " +
    "Returns the ticket, the employee, SLA status, the original description and all notes added by IT and the employee.",
  schema: z.object({ ticketId: ticketIdSchema }),
  run: async ({ ticketId }, { actor }) => {
    const t = await tickets.getTicketDetail(actor, ticketId);
    return { ...t, sla: t.sla?.label ?? null };
  },
});

const updateTicketAsAdmin = defineTool({
  name: "updateTicketAsAdmin",
  description:
    "Use this ONLY when the admin explicitly asks you to change a ticket's status or send a note to the employee. " +
    "The note is added to the ticket as an IT update and the employee will see it. Use waiting_for_user when asking the employee a question.",
  writes: true,
  schema: z.object({
    ticketId: ticketIdSchema,
    status: statusSchema.optional().describe("New status, if the admin asked for one"),
    note: z.string().trim().min(2).max(1000).optional().describe("Note to the employee, in the admin's words"),
  }),
  run: ({ ticketId, status, note }, { actor }) => tickets.updateTicket(actor, ticketId, { status, note }),
});

const getOpenP1Tickets = defineTool({
  name: "getOpenP1Tickets",
  description:
    "Use this when someone asks for a summary of all open P1 (critical) tickets across the company. " +
    "Returns every P1 ticket that is not resolved or closed, with team, employee and SLA.",
  schema: z.object({}),
  run: async (_args, { actor }) => {
    const rows = await tickets.getQueue(actor, { priority: "P1", status: "active", limit: 20 });
    return {
      count: rows.length,
      tickets: rows.map((t) => ({
        id: t.id,
        title: t.title,
        status: t.status,
        team: t.team,
        employee: t.employee,
        sla: t.sla?.label ?? null,
        created_at: t.created_at,
      })),
    };
  },
});

export const adminTools: AgentTool[] = [getQueue, getTicketDetails, updateTicketAsAdmin, getOpenP1Tickets, searchKnowledgeBase];
