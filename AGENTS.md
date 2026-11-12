# DeskBot — PS4 IT Helpdesk Ticket Agent
- Business user: employee at Zentrix Software. Logged-in user: E101 (Karthik S).
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
- User id comes from lib/currentUser.ts (CURRENT_USER_ID). Never take a user id as a tool argument.
- Ticket ids are numbers. Max 20 rows per read. Throw new Error(error.message) on Supabase errors.

## Business rules
- Search the KB before creating a ticket. Priority: P1 many users blocked or security issue,
  P2 one user fully blocked, P3 work slowed, P4 a request.
- Team is looked up from the category in kb_articles, never chosen by the AI.
- No second active (open/in_progress/waiting_for_user) ticket in the same category for the same user.
- Users only see and change their own tickets. Set updated_at on every update.

## Safety
- Never use the Supabase secret key in components. Never commit .env.local.
