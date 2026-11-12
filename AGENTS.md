# DeskBot — PS4 IT Helpdesk Ticket Agent
- Business users: employees at Zentrix Software (E101–E115) and the IT Helpdesk admin.
- Login: one shared APP_PASSCODE. "Switch user" picks the acting user (cookie deskbot_user = E1xx | ADMIN), default E101.
- Stack: Next.js App Router, TypeScript, Tailwind, Supabase (server only, secret key), Gemini function calling, Zod.

## Tables (seed/ps4_it_helpdesk.sql)
- support_teams(id text PK 'T1'..'T5', name, handles)
- employees(id text PK 'E101'.., name, email, department, location, laptop_model)
- sla_rules(priority PK 'P1'..'P4', meaning, response_hours, resolve_hours)
- kb_articles(id bigint PK, title, category, keywords, solution_steps, team_id -> support_teams.id)
- tickets(id bigint PK, employee_id -> employees.id, title, description, category,
  priority -> sla_rules.priority, team_id -> support_teams.id,
  status in open|in_progress|waiting_for_user|resolved|closed, created_at, updated_at)
- Categories: VPN, Network (T1) · Account, Access (T2) · Hardware (T3) · Email, Apps (T4) · Security (T5)

## Agent rules
- Tools live in lib/agent/tools.ts, use defineTool() with a Zod schema; descriptions start with "Use this when...".
- The acting user comes from getActor() in lib/actor.ts (server-side, validated against employees). Tools get it as ctx.actor.
  Never take a user id as a tool or API argument.
- Employee tools: lib/agent/tools.ts. Admin tools: lib/agent/adminTools.ts. runAgent picks the set by role.
- Ticket rules live in lib/tickets.ts (shared by API routes and tools). Do not duplicate them.
- Ticket ids are numbers. Max 20 rows per read. Throw new Error(error.message) on Supabase errors.

## Business rules
- Search the KB before creating a ticket. Priority: P1 many users blocked or security issue,
  P2 one user fully blocked, P3 work slowed, P4 a request.
- Team is looked up from the category in kb_articles, never chosen by the AI.
- No second active (open/in_progress/waiting_for_user) ticket in the same category for the same user.
- Employees only see and change their own tickets (PRD §7.4 transitions). The admin may set any status. Set updated_at on every update.
- No schema changes. Notes go in tickets.description as "[Update YYYY-MM-DD] …" (employee) or "[IT update YYYY-MM-DD] …" (IT);
  use appendUpdate/parseUpdates in lib/helpdesk.ts.
- /admin and /api/admin/* are admin-only (proxy.ts + requireActor("admin")).

## Safety
- Never use the Supabase secret key in components. Never commit .env.local.

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
