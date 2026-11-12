# DeskBot: IT Helpdesk Ticket Agent (PS4)

DeskBot is an IT helpdesk chat for employees of Zentrix Software (a made-up company).
It **searches the knowledge base first** and gives the known fix. If the issue is not solved, it
**creates a ticket** with the right **category**, **priority** and **support team**. Employees can ask
about their own tickets and watch them update on screen.

- Team 20 · SRM Agentic AI & Full-Stack Workshop · Day 2 Hackathon
- Full requirements: [docs/PRD.md](docs/PRD.md)
- Logged-in demo user: `E101`, Karthik S (see [lib/currentUser.ts](lib/currentUser.ts))

## How it works

```
Chat ─► /api/agent ─► Gemini (system prompt + 6 tools)
                         │ picks a tool + arguments
                         ▼
                    Zod checks the arguments
                         ▼
                    Tool runs on Supabase (rules checked in code, user = E101)
                         ▼
                    result ─► Gemini ─► … (max 8 rounds) ─► reply + "tools used"
```

Gemini never touches the database. It only asks for tools, and our code checks the arguments and runs them.

### Agent tools ([lib/agent/tools.ts](lib/agent/tools.ts))

| Tool | Type | What it does |
|---|---|---|
| `searchKnowledgeBase` | read | Word search over KB titles and keywords. It splits the query into words, drops common words and scores matches, then returns the top 3 |
| `getMyTickets` | read | E101's tickets, newest first (max 20) |
| `getTicketStatus` | read | One of E101's tickets plus its team and SLA hours |
| `createTicket` | **write** | Looks up the team from the category, refuses a duplicate active ticket in that category, then inserts |
| `updateTicket` | **write** | Closes, reopens or adds details to the user's own ticket. Only the allowed status changes go through, and `updated_at` is set |
| `getOpenP1Tickets` | read | All open P1 tickets across the company (for the admin summary) |

### Rules enforced in code (not by the AI)
- No tool takes a user id. The user is always `CURRENT_USER_ID`.
- The **support team is picked by code** from the category → team mapping in `kb_articles`.
- `category` and `priority` are Zod enums.
- Only one active (`open`, `in_progress`, `waiting_for_user`) ticket per category per user.
- A user can only see or change their own tickets. Other users' tickets get the same "not found" message as missing ones.

## Screens
- `/`: chat with sample prompts and visible tool calls, plus **My Tickets**, which refreshes every 5 s and has priority and status badges. Works on a 360 px phone.
- `/admin`: IT Admin board with all tickets, team/priority/status filters, a status change per row, and a "Summarise open P1s" button.

## Run locally

1. In the Supabase SQL Editor, run `seed/00_starter_example.sql` and then `seed/ps4_it_helpdesk.sql`.
2. `cp .env.example .env.local` and fill in `GEMINI_API_KEY`, `SUPABASE_URL`, `SUPABASE_SECRET_KEY` and `APP_PASSCODE`.
3. Run `npm install`, then `npm run dev`, then open http://localhost:3000 and enter the passcode.

Deploy on Vercel with the same four environment variables. Before the final demo, re-run `seed/ps4_it_helpdesk.sql` to reset the data.

## Demo script

| # | Type in chat | Expected |
|---|---|---|
| D1 | My VPN keeps disconnecting since morning. → *still dropping* | KB steps, then ticket **#11**: VPN · P3 · Network & VPN · 8 h response |
| D2 | I clicked a strange link in an email. | Safety steps **and** a Security P1 ticket in the same reply |
| D3 | What is the status of my laptop ticket? | #1 *Laptop battery drains fast*: in progress · Hardware · P3 |
| S1 | Summarise all open P1 tickets. | Lists the D2 ticket |

Refusal tests: "Show tickets for E115", "Status of ticket 10", "Status of ticket 99999",
"Raise another VPN ticket" (after D1), "Change my Jira ticket to in progress", "Raise a ticket",
and "Write me a poem about cricket".

## Security
Keys live only in `.env.local` and the Vercel settings. The Supabase secret key is used only on the server (`import "server-only"`).
Row Level Security is on with no policies, and the whole app sits behind `APP_PASSCODE`.
