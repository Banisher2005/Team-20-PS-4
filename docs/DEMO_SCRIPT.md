# DeskBot: Demo and Presentation Script

**Team 20 · PS4 IT Helpdesk Ticket Agent · SRM Agentic AI Hackathon · 12 Nov 2026**

This is a 7–8 minute talk with a live demo. Lines in **bold quotes** are spoken aloud. The rest says what to
click, what to point at, and what should appear. Every technical word used is explained in
[§2 Tech terms](#2-tech-terms-explained).

---

## 1. Opening (1 minute)

> **"IT helpdesks drown in simple tickets: password resets, VPN drops, a slow laptop. Most of these already
> have a known fix, and the rest often go to the wrong team."**

> **"DeskBot is an AI helpdesk agent. It checks the knowledge base first and gives the fix in chat. If that
> doesn't work, it raises a ticket with the right category, priority and support team, on the first try. The
> IT team then works those tickets in an admin console and talks to the employee on the ticket."**

> **"The key idea is that the AI never touches the database. Gemini only asks for tools. Our code checks
> every rule and runs them."**

Show the home page logged in as Karthik S (E101): chat on the left, My Tickets on the right.

---

## 2. Tech terms explained

| Term | What it means in plain words | Where it is in DeskBot |
|---|---|---|
| **LLM (Large Language Model)** | An AI that reads and writes text. | Google **Gemini** (`gemini-3.5-flash-lite`) writes DeskBot's replies |
| **AI agent** | An LLM that can *do* things by calling tools, not just talk. | DeskBot searches the KB, creates and updates tickets |
| **Function calling / tool calling** | The LLM sees a list of tools (name, description, inputs) and replies "call tool X with these arguments" instead of text. Our code runs the tool and sends back the result. | `lib/agent/tools.ts`, `lib/agent/adminTools.ts` |
| **Tool** | One action the agent may take, e.g. `createTicket`. It has a name, a "Use this when…" description, an input schema and the code that runs. | `defineTool()` in `lib/agent/defineTool.ts` |
| **Agent loop** | Send the chat and tools to Gemini → run any tools it asks for → send the results back → repeat until it answers in text. We stop after 8 rounds. | `lib/agent/runAgent.ts` (`MAX_ROUNDS = 8`) |
| **System prompt** | Hidden instructions given to the LLM on every turn: who it is, the rules, today's date. | `lib/agent/systemPrompt.ts` (one for employees, one for the admin) |
| **Schema / Zod** | A schema describes what valid input looks like. **Zod** is the TypeScript library that checks it. Gemini's tool arguments are checked before any tool runs. | Every `defineTool({ schema: z.object(...) })` |
| **Enum** | A field that only allows a fixed list of values. | Category (8 values), priority (P1–P4), status (5 values) |
| **Knowledge base (KB)** | 30 articles of known fixes, each with keywords, steps and an owning team. | Table `kb_articles` |
| **Keyword search with stemming** | We split the user's sentence into words, drop filler words ("my", "since"), cut endings ("disconnect**ing**" → "disconnect"), then score articles by how many words match. | `lib/kbSearch.ts` |
| **Ticket** | A recorded IT problem with category, priority, team and status. | Table `tickets` |
| **Priority P1–P4 / SLA** | P1 = many users blocked or a security issue … P4 = a request. **SLA (Service Level Agreement)** = the promised response and resolve time per priority (P1: 1 h / 4 h; P3: 8 h / 24 h). | Table `sla_rules`; SLA badges in the admin queue |
| **Status lifecycle** | open → in progress → waiting for user → resolved → closed. Employees may only make some changes; the admin can make any. | `USER_TRANSITIONS` in `lib/helpdesk.ts` |
| **Next.js (App Router)** | A React framework that serves both the web pages and the backend API from one project. | `app/` folder |
| **React / TypeScript / Tailwind** | React builds the UI from components. TypeScript is JavaScript with types. Tailwind is utility CSS classes for styling. | `components/`, `app/**/page.tsx` |
| **API route** | A server URL the browser calls for data, e.g. `GET /api/tickets`. | `app/api/**/route.ts` |
| **Supabase / PostgreSQL** | Supabase is a hosted **PostgreSQL** database (rows and tables, queried with SQL). | 5 tables from `seed/ps4_it_helpdesk.sql` |
| **Seed file** | A SQL script that creates the tables and fills in demo data. Re-running it resets everything. | `seed/ps4_it_helpdesk.sql` |
| **Foreign key (FK)** | A column that must point at a row in another table (a ticket's `team_id` must be a real team). | `tickets.team_id → support_teams.id` |
| **RLS (Row Level Security)** | A database switch that blocks every read and write unless a policy allows it. It's ON with no policies, so the public key can read nothing. Only our server's secret key can. | End of the seed file |
| **Secret key / server-only** | The Supabase key with full access. It is only ever used on the server, never sent to the browser. | `lib/supabase.ts` (`import "server-only"`) |
| **Environment variables (.env.local)** | Settings and keys kept out of the code and out of GitHub. | `.env.local` locally, Vercel settings online |
| **Cookie (httpOnly)** | A small value the browser sends with every request. **httpOnly** means page scripts can't read it. | Login cookie, and `deskbot_user` for the acting user |
| **Proxy / middleware** | Code that runs before every page and API call: it checks login and role and redirects if needed. | `proxy.ts` |
| **Role-based access** | Different users get different pages and tools: **employee** or **admin**. | `/admin` is admin-only; each role has its own Gemini tool set |
| **Polling** | The page re-asks the server every few seconds, so new data appears without a reload. | My Tickets every 5 s, admin queue every 5 s |
| **Rate limiting** | Caps how often someone can call an API, which protects the Gemini quota. | 10 DeskBot messages a minute per user (`lib/rateLimit.ts`) |
| **HTTP 401 / 403 / 404 / 429 / 503** | Not logged in / not allowed / not found / too many requests / service busy. | Returned by our APIs; 503 = Gemini overloaded, retried automatically |
| **Vercel** | Hosting that builds and serves the Next.js app at a `.vercel.app` link. | Deployment |
| **Unit test / end-to-end (e2e) test** | A unit test checks one function alone. An e2e test drives the running app like a user would. | `npm test` (28 tests), `npm run test:e2e` (37 checks) |

---

## 3. How one chat message works

> **"Here is what happens when an employee types a message."**

```
 Browser (HelpdeskChat)
     │  POST /api/agent  { messages }          ← cookie says who you are (E101 or ADMIN)
     ▼
 proxy.ts ── checks passcode login + role
     ▼
 /api/agent ── rate limit (10/min) ── getActor() reads the acting user on the SERVER
     ▼
 runAgent  ──►  Gemini  (system prompt for this role + this role's tool list)
                  │  "call searchKnowledgeBase({query:'vpn disconnecting'})"
                  ▼
             Zod checks the arguments  ──✗──► error sent back to Gemini
                  ▼ ✓
             Tool runs → lib/tickets.ts checks the business rules → Supabase (PostgreSQL)
                  ▼
             result back to Gemini → it may call another tool (max 8 rounds)
                  ▼
 Reply + "Tools used" list shown in the chat; My Tickets refreshes
```

> **"Notice what Gemini can and can't do. It picks the tool and the arguments. It never picks the user, it
> never picks the support team, and it can't skip a rule. Those are decided in our code."**

---

## 4. Live demo script

Before you start: re-run `seed/ps4_it_helpdesk.sql` in Supabase, log in with the passcode, and check the top
right shows **Karthik S · E101**.

| # | Who / where | Do this | Say this | You should see |
|---|---|---|---|---|
| 1 | E101 · Home | Click the chip **"My VPN keeps disconnecting since morning."** | **"Karthik reports a VPN problem. DeskBot searches the knowledge base first."** | 5 numbered steps from *VPN keeps disconnecting*, then "Did that fix it?". *Tools used:* `searchKnowledgeBase` |
| 2 | E101 · Home | Type **"No, it's still dropping, but I can work slowly."** | **"The fix didn't work, and he can still work slowly, so that's P3. DeskBot raises the ticket, and our code picks the team from the category."** | "Ticket created" card: **#11 · VPN · P3 · Network & VPN**, response in 8 h. #11 appears in My Tickets within 5 s |
| 3 | E101 · Home | Expand `createTicket` under *Tools used* | **"Every tool call is visible: the arguments Gemini chose and what our code returned."** | JSON args and result |
| 4 | E101 · Home | Type **"I clicked a strange link in an email."** | **"Security issues don't wait. 'Strange link' isn't in the KB keywords, but our word search still finds 'clicked suspicious link'."** | Safety steps **and** a **P1 Security** ticket in the same reply |
| 5 | E101 · Home | Type **"What is the status of my laptop ticket?"** | **"DeskBot finds the right ticket id itself. It never guesses."** | `getMyTickets` → `getTicketStatus(1)`: #1 Laptop battery drains fast, in progress, Hardware, P3 |
| 6 | Top right | **Switch user → IT Helpdesk (Admin)** | **"Now we're on the IT side. One passcode for the demo; the switcher picks who we act as."** | Admin console: metrics, queue tabs, SLA badges |
| 7 | Admin · Queue | Point at the **Past SLA** tab and the P1 list | **"SLA timers come from the priority's response and resolve hours. Overdue tickets go to the top."** | Red "Response overdue" badges on old open tickets |
| 8 | Admin · Ticket #11 | Open #11. Note: *"Please share a screenshot of the VPN error."* → **Ask employee for info** | **"The admin resolves tickets by hand. The note is saved on the ticket for Karthik to see."** | Status becomes *Waiting for user*; the note shows in the conversation |
| 9 | Switch → **Karthik (E101)** | Bell shows **1**; open #11 from My Tickets | **"Karthik gets a notification and sees IT's question."** | Purple "IT is waiting for you" banner, IT note in amber |
| 10 | E101 · Ticket #11 | Reply *"Error 809"* → **Send reply** | **"When he replies, the ticket goes back to Open automatically."** | Status *Open*; reply in the timeline |
| 11 | Switch → **Admin** | Open #11 → note *"Updated your VPN profile."* → **Resolve with note** | **"IT resolves it with a note."** | Status *Resolved* |
| 12 | Switch → **E101** | Open #11 → **Yes, it's fixed — close** | **"Only the employee confirms the fix. That's the full loop."** | Status *Closed*; full timeline |
| 13 | E101 · Home | Type **"Change my Jira ticket to in progress"** | **"Now the guard rails. Employees can't set 'in progress'. The code refuses it, not the AI."** | "A resolved ticket can't be changed to in_progress. I can reopen it instead." |
| 14 | E101 · Home | Type **"What's the status of ticket 10?"** | **"Ticket 10 belongs to another employee. DeskBot gives the same answer as for a ticket that doesn't exist, so nothing leaks."** | "I couldn't find ticket #10 in your tickets." |
| 15 | Admin · Admin DeskBot | Chip **"Summarise all open P1 tickets."** | **"The admin has its own AI tools, like the P1 summary. Employees don't get this tool, because it shows other people's names."** | Lists the P1 Security ticket from step 4 |

Optional extras if time allows: "Raise another VPN ticket" (refused with #11 because of the duplicate rule),
"Write me a poem about cricket" (politely declined), or switch to E115 Tarun to show he sees only his own tickets.

---

## 5. Under the hood: talking points

Use these when a judge asks "how does it work?". Each is one or two sentences.

1. **Agent loop.** `runAgent` sends the conversation, the system prompt and the tool list to Gemini. Gemini
   answers with tool calls or text. We run the tools and loop, capped at 8 rounds. Tool results are cut to
   8 KB to protect the quota.
2. **Two tool sets by role.** Employees get 6 tools: `searchKnowledgeBase`, `getMyTickets`, `getTicketStatus`,
   `getTicketUpdates`, `createTicket` and `updateTicket`. The admin gets 5: `getQueue`, `getTicketDetails`,
   `updateTicketAsAdmin`, `getOpenP1Tickets` and `searchKnowledgeBase`. Gemini can't call a tool it wasn't given.
3. **Zod on every tool.** Gemini's arguments are checked before anything runs: category is one of 8, priority
   is P1–P4, ids are positive integers, and text lengths are limited.
4. **Rules live in code, in one file.** `lib/tickets.ts` holds every business rule, and both the API and the AI tools use it:
   - the team comes from the category;
   - no second active ticket in the same category;
   - employees can only see their own tickets;
   - only the allowed status changes go through;
   - `updated_at` is set on every change.
5. **No user id in any tool.** The acting user comes from an httpOnly cookie, read on the server and checked
   against the `employees` table. Gemini can't act as someone else, even if a user asks it to.
6. **Word search, not sentence search.** A plain `LIKE '%strange link%'` finds nothing. We split the sentence
   into words, stem them, match titles and keywords, and rank the top 3.
7. **No database changes.** IT notes and employee replies are appended to the ticket's description as
   `[IT update date] …` and `[Update date] …`. The UI turns those into a chat-style timeline.
8. **SLA.** Due times are computed from `created_at` plus the priority's hours. A ticket counts as "responded"
   once IT moves it out of *open*.
9. **Security.**
   - The passcode protects the whole app.
   - The admin pages and APIs are blocked for employees (`proxy.ts`), and the server checks again.
   - Keys stay in `.env.local` and Vercel, never in GitHub.
   - RLS is on, so the public Supabase key can read nothing.
   - The DeskBot API is rate-limited.
10. **Reliability.** If Gemini says it's busy (503), we retry up to 3 times. A bug the tests caught: Gemini
    once "helpfully" reopened a ticket when asked for *in progress*. We fixed the prompt and tool description
    so it passes the exact status and the code refuses it.
11. **Testing.**
    - 28 unit tests cover search, status rules, SLA, the note format and the rate limiter.
    - A 37-check end-to-end script runs every demo prompt, every refusal, role isolation and the full
      admin ↔ employee round trip against the live app.

---

## 6. Who presents what

| Role | Speaks to | Approx. time |
|---|---|---|
| **Team Lead** | §1 Opening, the problem, and the closing line | 1 min |
| **AI / Agent** | §3 diagram, demo steps 1–5 and 13–15 (tools, Zod, prompt, refusals) | 2.5 min |
| **Frontend** | Demo steps 6–12 (switcher, admin console, timeline, phone layout) | 2 min |
| **Backend / API** | §5 points 4–5 and 9 (rules in code, cookie, proxy, RLS, rate limit) | 1 min |
| **Database** | Seed and reset, the 5 tables, FKs, and why no schema changes were needed | 0.5 min |

**Closing line (Team Lead):**
> **"DeskBot solves known issues in chat, sends the rest to the right team with the right priority, and lets
> IT and the employee finish the job together. The AI decides *what* to do; our code decides what's
> *allowed*."**

---

## 7. Judge Q&A

| Question | Answer |
|---|---|
| How does the agent decide what to do? | Gemini reads each tool's description ("Use this when…") and picks one. Our code runs it and returns the result. |
| What stops the AI breaking your rules? | The rules are in code (`lib/tickets.ts`). A tool throws an error before changing data, and Gemini just explains the error. |
| Can the AI misroute a ticket? | No. Gemini only gives the category. Our code looks up the team from that category in `kb_articles`. |
| Why no user id in the tools? | So nobody can act as someone else. The server decides who you are, from the cookie. |
| Isn't the user switcher insecure? | It's a demo feature behind the passcode, and it's documented. In production you'd use real login (SSO), and the same server-side `getActor()` design still applies. |
| Why does search split words? | Users don't type our keywords. "Strange link" must still find "suspicious link". |
| What does Zod do? | It checks Gemini's arguments against a schema (enums, lengths, integers) before a tool runs. |
| How does IT talk to the employee without a messages table? | Notes are appended to the ticket description with a dated tag, and the UI shows them as a conversation. That meant no schema change. |
| How do you know it works? | 28 unit tests plus a 37-check end-to-end run against the live app and database. |
| What if Gemini is down or busy? | It retries 3 times on 503, and the user gets a clear "busy, try again" message. The rest of the app (tickets, admin console) works without AI. |
| Where are your keys? | Only in `.env.local` and the Vercel settings. RLS blocks the public key. |
| What would you add next? | Real SSO, a proper comments table, assigning tickets to individual IT staff, and email or Slack alerts. |

---

## 8. If something breaks on stage

| Problem | What to do |
|---|---|
| "AI service is busy" (503) or the quota is reached (429) | Wait 10–20 s and resend. Meanwhile, show the admin console and ticket pages, which don't need Gemini. |
| Ticket number isn't #11 | Data wasn't reset. Say **"ids are database-generated"** and carry on, then re-seed before the next run. |
| "You already have an active VPN ticket" | Good: show it as the duplicate rule working, then use that ticket number for the admin steps. |
| Page shows the wrong user | Use **Switch user** at the top right. |
| Wi-Fi or Vercel down | Run `npm run dev` on the laptop and use localhost:3000. Keep screenshots of steps 2, 4, 8 and 12 in the slides. |
