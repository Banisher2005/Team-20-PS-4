# DeskBot: IT Helpdesk Ticket Agent (PS4)

DeskBot is an IT helpdesk app for employees of Zentrix Software (a made-up company).

- **Employees** chat with DeskBot. It **searches the knowledge base first** and gives the known fix. If the
  issue is not solved, it **creates a ticket** with the right **category**, **priority** and **support team**.
- **The IT Helpdesk admin** works a queue of every ticket, changes the status by hand and writes notes to the
  employee. The employee sees those notes on their ticket, and can reply, close it or reopen it.
- **Gemini** does the tool calling for both roles. Our code checks every rule before data changes.

Team 20 · SRM Agentic AI & Full-Stack Workshop · Day 2 Hackathon · Full requirements: [docs/PRD.md](docs/PRD.md)

## Demo login and the user switcher

1. Log in with the team passcode (`APP_PASSCODE`). You start as **Karthik S (E101)**.
2. Use **Switch user** (top right) to act as any of the 15 employees (E101–E115) or as **IT Helpdesk (Admin)**.

The switcher sets an httpOnly cookie (`deskbot_user`). The server checks the id against the `employees` table
on every request. **No tool and no API takes a user id from the browser or from Gemini.** This is a demo
switcher: anyone with the passcode can act as anyone, which is intended for the hackathon.

## How it works

```
Chat ─► /api/agent ─► Gemini (system prompt + tools for the current role)
                         │ picks a tool + arguments
                         ▼
                    Zod checks the arguments
                         ▼
                    lib/tickets.ts runs it on Supabase (rules checked in code; user = acting user)
                         ▼
                    result ─► Gemini ─► … (max 8 rounds) ─► reply + "tools used"
```

### Tools

| Role | Tool | Type | What it does |
|---|---|---|---|
| both | `searchKnowledgeBase` | read | Word search over KB titles/keywords. It drops common words, stems the rest, scores matches and returns the top 3 |
| employee | `getMyTickets` | read | The acting employee's tickets (max 20), with the IT update count |
| employee | `getTicketStatus` | read | One own ticket with team and SLA hours |
| employee | `getTicketUpdates` | read | Notes from IT and the employee on one own ticket ("Did IT reply?") |
| employee | `createTicket` | **write** | Team from category, duplicate-active guard, insert |
| employee | `updateTicket` | **write** | Close, reopen or add details, following the PRD status rules |
| admin | `getQueue` | read | All tickets by team, status or priority, or only those past their SLA |
| admin | `getTicketDetails` | read | One ticket with employee, SLA and every note |
| admin | `updateTicketAsAdmin` | **write** | Any status and/or a note to the employee. Used only when the admin asks |
| admin | `getOpenP1Tickets` | read | Every open P1 ticket (admin only, because it shows other employees' names) |

### Rules enforced in code ([lib/tickets.ts](lib/tickets.ts))
- The **support team is picked by code** from the category → team mapping in `kb_articles`.
- `category`, `priority` and `status` are Zod enums.
- Each employee can have only one active (`open` / `in_progress` / `waiting_for_user`) ticket per category.
- Employees only see or change their own tickets. Other people's tickets get the same "not found" message as missing ones.
- Employee status changes follow PRD §7.4. The admin may set any status.
- **No database changes.** Notes are appended to `tickets.description`:
  - `[Update 2026-11-12] …` is a note from the employee.
  - `[IT update 2026-11-12] …` is a note from IT.
- When an employee replies to a `waiting_for_user` ticket, it goes back to `open`. `updated_at` is set on every change.
- SLA comes from `created_at` plus the `sla_rules` hours. The response target counts as met once the ticket leaves `open`.
- `/admin` and `/api/admin/*` are only for the admin user ([proxy.ts](proxy.ts)). `/api/agent` is rate-limited to 10 messages a minute per user.

## Screens
| Page | Who | What |
|---|---|---|
| `/` | employee | DeskBot chat (sample prompts, tools used) and My Tickets (refreshes every 5 s, dot for new IT updates) |
| `/tickets`, `/tickets/[id]` | employee | All tickets. On a ticket: the updates timeline, add details or reply to IT, close or reopen |
| `/admin` | admin | Metrics, queue tabs (Active / Past SLA / Waiting / Done / All), team, priority and status filters, SLA badges |
| `/admin/tickets/[id]` | admin | Set the status and write a note to the employee. Quick actions: Start work, Ask for info, Resolve |
| `/admin/assistant` | admin | Admin DeskBot: queue questions, summaries, P1 summary |

Every page works at 360 px. On phones the sidebar becomes a menu.

## Run locally

1. In the Supabase SQL Editor, run `seed/00_starter_example.sql` and then `seed/ps4_it_helpdesk.sql`.
2. Run `cp .env.example .env.local`, then fill in `GEMINI_API_KEY`, `GEMINI_MODEL`, `SUPABASE_URL`, `SUPABASE_SECRET_KEY` and `APP_PASSCODE`.
3. Run `npm install` and `npm run dev`, then open http://localhost:3000.

Deploy on Vercel with the same environment variables. **Before the final demo, re-run `seed/ps4_it_helpdesk.sql`** to reset the data.

## Tests
- `npm test` runs the unit tests (Vitest) for KB search, status rules, SLA, the description-note format and the rate limiter.
- `npm run test:e2e` runs against a running server: D1–D3, the PRD refusals, role checks, user switching, a full admin ↔ employee round trip, and the admin DeskBot.
  - It **writes data**, so reset the seed afterwards.
  - To test the deployed app, run `BASE_URL=https://<app>.vercel.app npm run test:e2e`.

## Demo script

| # | As | Do | Expected |
|---|---|---|---|
| D1 | E101 | "My VPN keeps disconnecting since morning." → "still dropping, I can work slowly" | KB steps, then ticket #11: VPN · P3 · Network & VPN · 8 h response |
| D2 | E101 | "I clicked a strange link in an email." | Safety steps **and** a Security P1 ticket in the same reply |
| D3 | E101 | "What is the status of my laptop ticket?" | #1 Laptop battery drains fast: in progress · Hardware · P3 |
| A1 | Admin | Open #11 → "Ask employee for info" with a note | Ticket becomes *Waiting for user* |
| A2 | E101 | Bell or dot → open #11 → reply | Ticket goes back to *Open*. Admin sees the reply |
| A3 | Admin | Resolve with a note → E101 clicks "Yes, it's fixed — close" | Ticket is *Closed*, and the timeline shows every step |
| S1 | Admin | Admin DeskBot: "Summarise all open P1 tickets." | Lists the D2 ticket |

Refusals: "Show tickets for E115", "Status of ticket 10", "Status of ticket 99999", "Raise another VPN ticket"
(after D1), "Change my Jira ticket to in progress", "Raise a ticket", "Write me a poem about cricket".

## Security
- Keys live only in `.env.local` and the Vercel settings. The Supabase secret key is server-only (`import "server-only"`).
- RLS is on with no policies, and the whole app sits behind `APP_PASSCODE`.
