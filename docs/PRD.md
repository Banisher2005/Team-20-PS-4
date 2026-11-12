# PRD v3 — DeskBot: IT Helpdesk Ticket Agent (PS4)

| Field | Value |
|---|---|
| **Problem** | PS4 · IT Helpdesk Ticket Agent |
| **App name** | DeskBot |
| **Company (seed data)** | Zentrix Software (made-up) |
| **Event** | SRM Agentic AI & Full-Stack Workshop · Day 2 Hackathon (10:00 – 4:00) |
| **Business user** | An employee at a software company |
| **Logged-in user** | `E101` — Karthik S, Engineering, Chennai (`CURRENT_USER_ID`) |
| **Seed file** | `seed/ps4_it_helpdesk.sql` (all names below match it exactly) |
| **Version** | v3 · 12 Nov 2026 |

---

## 1. One-line summary

DeskBot is a helpdesk chat.

It **first searches the knowledge base** and gives the known fix.

If the issue is still not solved, it **creates a ticket** with the right **category**, **priority** and **support team**.

Employees can also ask about their tickets and see them update on screen.

---

## 2. Problem

| Today | Effect |
|---|---|
| IT is flooded with simple tickets (password resets, VPN issues) | Staff time wasted on repeat issues |
| Most of these have known fixes (30 KB articles in the seed) | Employees wait for answers that already exist |
| The rest often go to the wrong team | Re-routing, delays, missed SLAs |

**Goal:** solve known issues from the KB in chat, and send every remaining issue to the right team with the right priority — the first time.

---

## 3. Tech stack (fixed by the starter)

| Layer | Tech | Where |
|---|---|---|
| Frontend | Next.js App Router · React · TypeScript · Tailwind | `app/`, `components/` |
| Backend | Next.js API routes | `app/api/*/route.ts` |
| Agent | **Gemini function calling** · starter agent loop | `lib/agent/` |
| Tool input checks | **Zod** | inside each `defineTool()` |
| Database | **Supabase** (PostgreSQL) · RLS on, no policies · secret key server-only | Supabase project |
| Hosting | **Vercel** | `.vercel.app` link |
| Access | `APP_PASSCODE` | `.env.local` + Vercel |

### How one chat message works

```
User types in chat
      │
      ▼
app/api/agent/route.ts ──► Gemini  (message + system prompt + tool list)
                              │
                              ▼  Gemini picks a tool + arguments
                         Zod checks the arguments
                              │
                              ▼
                     Tool runs on Supabase  (rules checked in code, user = CURRENT_USER_ID)
                              │
                              ▼  result back to Gemini → may pick another tool (max 8 rounds)
                     Final answer + list of tools used, shown in chat
```

**Key idea:** Gemini never touches the database. It only asks for tools. Our code checks and runs them.

---

## 4. Scope

| Item | MVP | Stretch (only if time before 2:45) |
|---|---|---|
| `searchKnowledgeBase` (read) | ✅ by 12:30 | |
| `getMyTickets` (read) | ✅ by 12:30 | |
| `createTicket` (write) | ✅ by 12:30 | |
| `getTicketStatus` (read) | ✅ afternoon | |
| `updateTicket` (write) — user closes, reopens or adds info to own ticket | ✅ afternoon | |
| Home page: chat + My Tickets list | ✅ | |
| IT Admin board `/admin` — all tickets, change status | | ✅ |
| Agent summarises all open P1 tickets (`getOpenP1Tickets`) | | ✅ |

**Out of scope:** real login / SSO, email or Slack alerts, attachments, SLA timers, ticket comments table.

---

## 5. Tables (exact, from the seed)

### 5.1 `support_teams` — 5 rows

| Column | Type |
|---|---|
| `id` (PK) | text |
| `name` | text |
| `handles` | text (free-text list) |

| `id` | `name` | Handles |
|---|---|---|
| `T1` | Network & VPN | VPN, Wi-Fi, internet, network drives, remote access |
| `T2` | Accounts & Access | passwords, account lock, MFA, email access, software access requests |
| `T3` | Hardware | laptops, monitors, keyboards, printers, chargers, docking stations |
| `T4` | Software & Apps | Office apps, Teams, Outlook, IDEs, software install and errors |
| `T5` | Security | phishing, suspicious links, virus alerts, lost devices, data leaks |

### 5.2 `employees` — 15 rows (`E101` – `E115`)

`id` (PK, text) · `name` · `email` · `department` · `location` · `laptop_model` (nullable)

### 5.3 `sla_rules` — 4 rows

| `priority` (PK) | `meaning` | `response_hours` | `resolve_hours` |
|---|---|---|---|
| P1 | Many users blocked, or a security issue | 1 | 4 |
| P2 | One user fully blocked from work | 4 | 8 |
| P3 | Work is slowed but the user can continue | 8 | 24 |
| P4 | A request or question, not a fault | 24 | 72 |

### 5.4 `kb_articles` — 30 rows

`id` (PK, **bigint**, auto) · `title` · `category` · `keywords` (space-separated words) · `solution_steps` (numbered text) · `team_id` (FK → `support_teams.id`)

### 5.5 `tickets` — 10 rows

| Column | Type / rule |
|---|---|
| `id` (PK) | **bigint**, auto-generated (ids are numbers like `11`, not `TKT-…`) |
| `employee_id` | FK → `employees.id` |
| `title`, `description`, `category` | text, required |
| `priority` | FK → `sla_rules.priority` |
| `team_id` | FK → `support_teams.id` |
| `status` | `open` · `in_progress` · `waiting_for_user` · `resolved` · `closed` (default `open`) |
| `created_at`, `updated_at` | timestamptz, default `now()` |

### 5.6 Categories → team (one fixed mapping)

There is **no category column** on `support_teams`. The mapping lives in `kb_articles` and is consistent for all 30 rows:

| Category | Team | KB articles |
|---|---|---|
| `VPN` | T1 Network & VPN | 2 |
| `Network` | T1 Network & VPN | 4 |
| `Account` | T2 Accounts & Access | 3 |
| `Access` | T2 Accounts & Access | 1 |
| `Hardware` | T3 Hardware | 8 |
| `Email` | T4 Software & Apps | 3 |
| `Apps` | T4 Software & Apps | 4 |
| `Security` | T5 Security | 5 |

**These 8 categories are the only allowed values** for a new ticket (Zod enum).

### 5.7 E101's tickets in the seed

| `id` | Title | Category | Priority | Team | Status |
|---|---|---|---|---|---|
| 1 | Laptop battery drains fast | Hardware | P3 | T3 | `in_progress` |
| 2 | Need access to Jira project ZEN-PAY | Access | P4 | T2 | `resolved` |

So demo D3 ("status of my laptop ticket") has exactly **one** matching ticket.

---

## 6. Business rules

### 6.1 Priority

| Priority | Rule (from `sla_rules.meaning`) | Example | Response / resolve |
|---|---|---|---|
| **P1** | Many users blocked, or a security issue | Clicked a suspicious link; antivirus alert; lost laptop; whole office Wi-Fi down | 1 h / 4 h |
| **P2** | One user fully blocked | Can't log in; MFA lost; laptop won't charge; repeated blue screen | 4 h / 8 h |
| **P3** | Work slowed, user can continue | VPN drops; slow laptop; Teams camera issue | 8 h / 24 h |
| **P4** | A request or question | Jira access; new laptop; install software | 24 h / 72 h |

Several KB articles already say which priority to use (e.g. *"raise a P1 ticket for the Security team"*). The agent follows those.

**Note:** not every `Security` ticket is P1. *"USB storage blocked"* is a Security-category **P4 request**. So "Security → P1" is **not** forced in code; the system prompt handles it.

### 6.2 Where each rule lives

| Rule | Enforced in |
|---|---|
| Search the KB before creating a ticket | **System prompt** (Gemini decides; no `if` on user words) |
| Choose P1–P4 from the meanings above | **System prompt** |
| `priority` ∈ P1–P4 | **Zod** enum |
| `category` ∈ the 8 categories | **Zod** enum |
| Team = team of that category in `kb_articles` | **Tool code** — Gemini never picks the team |
| No second **active** ticket (`open`, `in_progress`, `waiting_for_user`) in the same category for the same user | **Tool code** — throw with the existing ticket id |
| A user only sees / changes **their own** tickets | **Tool code** — filter by `CURRENT_USER_ID`; throw on others' tickets |
| No tool takes a user id | **Tool design** |
| Only allowed status changes by the user (§7.3) | **Tool code** in `updateTicket` |
| `updated_at` is set to now on every update | **Tool code** |

---

## 7. Agent tools (`lib/agent/tools.ts`)

All tools use `defineTool()` with a Zod schema.

Descriptions start with **"Use this when…"**.

No tool takes a user id.

### 7.1 Tool list

| Tool | Type | Args (Zod) | Reads / writes | Returns |
|---|---|---|---|---|
| `searchKnowledgeBase` | Read | `query: string (2–100)` | `kb_articles` — see §7.2 | top 3: `id, title, category, solution_steps`, team `name` |
| `getMyTickets` | Read | none | `tickets` where `employee_id = CURRENT_USER_ID`, join `support_teams(name)`, newest first, max 20 | `id, title, category, priority, team name, status, created_at, updated_at` |
| `getTicketStatus` | Read | `ticketId: number (int, positive)` | one ticket + team name + `sla_rules` hours | `id, title, status, priority, team name, created_at, updated_at, response_hours, resolve_hours` |
| `createTicket` | **Write** | `title (5–120)`, `description (10–1000)`, `category (enum of 8)`, `priority (enum P1–P4)` | rules → insert into `tickets` (`status = 'open'`) | `id, title, category, priority, team name, response_hours, resolve_hours` |
| `updateTicket` | **Write** | `ticketId: number`, `status (enum, optional)`, `extraInfo (string ≤ 500, optional)` — at least one | rules → update `tickets` | `id, old status → new status, updated_at` |
| `getOpenP1Tickets` *(stretch)* | Read | none | `tickets` where `priority = 'P1'` and status not `resolved`/`closed`, all users, join team + employee name | `id, title, team name, employee name, created_at` |

### 7.2 `searchKnowledgeBase` — search must match **words**, not the whole sentence

A plain `ilike '%strange link%'` finds **nothing** for demo D2, because the keywords are `phishing suspicious link clicked email scam`.

So the tool must:

1. Lowercase the query and split it into words; drop words shorter than 3 letters and common words (`my`, `the`, `since`, `keeps` …).
2. Read `kb_articles` where `title` or `keywords` `ilike` **any** of the words (Supabase `.or(...)`).
3. Score each article by how many words matched; return the **top 3**.
4. Return an empty list (not an error) if nothing matches.

| Demo query | Words used | Expected top match |
|---|---|---|
| "My VPN keeps disconnecting since morning" | vpn, disconnecting | **VPN keeps disconnecting** (T1) |
| "I clicked a strange link in an email" | clicked, strange, link, email | **Clicked a suspicious link** (T5) |

### 7.3 `createTicket` — checks, in order

1. Look up the team: first `kb_articles.team_id` where `category` = the given category. None → throw.
2. Check for duplicates: any ticket of `CURRENT_USER_ID` in the same category with status `open` / `in_progress` / `waiting_for_user` → throw `"You already have an active <category> ticket: #<id> (<status>). I can add details to it instead."`
3. Insert `employee_id = CURRENT_USER_ID`, `status = 'open'`, `team_id` from step 1.
4. Join `support_teams.name` and `sla_rules` hours for the reply.

### 7.4 `updateTicket` — allowed changes for the user

| From | To | When |
|---|---|---|
| `open`, `in_progress`, `waiting_for_user` | `closed` | "My issue is fixed, close it" |
| `waiting_for_user` | `open` | User replies with the info IT asked for (with `extraInfo`) |
| `resolved` | `closed` | User confirms the fix |
| `resolved`, `closed` | `open` | User says the problem came back (reopen) |

- Any other change → throw `"A <from> ticket can't be changed to <to>."`
- `extraInfo` is **appended** to `description` as `\n\n[Update <date>] <text>` — there is no comments table.
- Ticket must belong to `CURRENT_USER_ID`, else throw `"You can only change your own tickets."`
- Always set `updated_at = now()`.

### 7.5 Error messages

| Case | Message |
|---|---|
| Ticket not found / not yours | `"I couldn't find ticket #<id> in your tickets."` (same message for both — does not reveal other users' tickets) |
| Duplicate active ticket | `"You already have an active <category> ticket: #<id> (<status>). I can add details to it instead."` |
| No team for category | `"I couldn't find a support team for <category>."` |
| Bad status change | `"A <from> ticket can't be changed to <to>."` |
| Nothing to update | `"Tell me the new status or the extra details to add."` |

---

## 8. System prompt (`lib/agent/systemPrompt.ts`)

- You are **DeskBot**, the friendly IT helpdesk assistant at Zentrix Software. The logged-in user is `CURRENT_USER_ID` (Karthik S).
- Keep the line with today's date.
- Always use tools for KB articles and tickets. Never invent fixes, tickets or ids.
- For a new problem: **call `searchKnowledgeBase` first** with the key words of the problem. Give the fix as short numbered steps and name the article. Then ask *"Did that fix it?"*
- Create a ticket only if the fix did not work, no article matched, the article itself says to raise a ticket, or the user clearly asks for one.
- **Security issues** (clicked a suspicious link, antivirus alert, lost or stolen device): give the safety steps **and** create a **P1** `Security` ticket right away — do not wait for "did that fix it?".
- Priority: P1 = many users blocked or a security issue · P2 = one user fully blocked · P3 = work slowed but can continue · P4 = a request or question. If the KB article names a priority, use it. If impact is unclear, ask **one** question: *"Are you fully blocked, or can you still work slowly?"*
- Category must be one of: VPN, Network, Account, Access, Hardware, Email, Apps, Security. Use the category of the matching KB article when there is one.
- Ticket ids are numbers. Never guess one — call `getMyTickets` first to find it.
- If a tool returns an error, explain it in one sentence and suggest what to do instead.
- After creating or updating a ticket, say: ticket #id, priority, team, status, and the response time.
- Never ask for passwords or OTPs.
- Keep replies short. Only help with IT support questions.

`lib/agent/runAgent.ts`: set `MAX_ROUNDS` to **8**.

---

## 9. Screens

### 9.1 Home page (`app/page.tsx`) — MVP

```
┌──────────────────────────────────────────────────────────────┐
│ DeskBot · IT help in chat — fixes first, tickets if needed   │
├───────────────────────────────┬──────────────────────────────┤
│  CHAT (components/AgentChat)  │  MY TICKETS (TicketList)     │
│                               │                              │
│  [sample prompt chips]        │  #11 VPN keeps dropping      │
│  user / DeskBot messages      │      P3 · Network & VPN · open│
│  ▸ tools used: searchKB …     │  #1  Laptop battery drains   │
│                               │      P3 · Hardware · in prog. │
│  [ type a message … ]  [Send] │  (refreshes every 5 s)       │
└───────────────────────────────┴──────────────────────────────┘
          stacks into one column on a 360px phone
```

| Item | Requirement |
|---|---|
| `components/TicketList.tsx` | Cards from `/api/tickets`: `#id`, title, category, team name, status, updated time |
| Badges | Priority: P1 red · P2 orange · P3 yellow · P4 grey. Status: `open` blue · `in_progress` amber · `waiting_for_user` purple · `resolved` green · `closed` grey. Show `in_progress` as "In progress" etc. |
| Refresh | On `refreshKey` change **and every 5 seconds** |
| Join shape | Supabase may return `support_teams` as an object or a one-item array — handle both |
| `components/AgentChat.tsx` | `SAMPLE_PROMPTS` = the 3 demo prompts · shows the **tools used** for each reply |
| Layout | Works on a **360px** phone |

### 9.2 API route (`app/api/tickets/route.ts`) — MVP

- `GET` → tickets where `employee_id = CURRENT_USER_ID`, select `*, support_teams(name)`, order by `created_at` desc, max 50.
- `export const dynamic = "force-dynamic"`.
- Errors: `console.error` + status `500` with a short message.

### 9.3 IT Admin board (`app/admin/page.tsx`) — Stretch

- Table of **all 10+ tickets** with employee name and team name; filters for team / priority / status.
- Status dropdown per row → `PATCH /api/admin/tickets` with Zod (`id: number`, `status: enum of 5`), sets `updated_at`.
- "Summarise open P1s" button → sends that prompt to the agent (`getOpenP1Tickets`).

---

## 10. Demo prompts & expected behaviour

| # | Prompt | Tools | Expected result |
|---|---|---|---|
| D1 | "My VPN keeps disconnecting since morning." | `searchKnowledgeBase` → user: "still dropping" → `createTicket` | 5 steps from **VPN keeps disconnecting** → "Did that fix it?" → ticket **#11** · VPN · **P3** · Network & VPN · open · response in 8 h. Appears in My Tickets within 5 s |
| D2 | "I clicked a strange link in an email." | `searchKnowledgeBase` → `createTicket` | Steps from **Clicked a suspicious link** (disconnect, don't enter passwords…) **and** ticket · Security · **P1** · Security team · response in 1 h — in the same reply |
| D3 | "What is the status of my laptop ticket?" | `getMyTickets` → `getTicketStatus(1)` | "Ticket #1 *Laptop battery drains fast* is **in progress** with Hardware · P3 · last updated yesterday." |
| S1 *(stretch)* | "Summarise all open P1 tickets." | `getOpenP1Tickets` | List of open P1s (after D2 there is at least one) |

**Tip:** run D2 after D1 so the P1 summary has data. The seed has no P1 tickets.

---

## 11. Refusal tests (H8)

| Test | Type in chat | Expected |
|---|---|---|
| Someone else's data | "Show tickets for E115" | Shows only E101's tickets / explains it can only show your own |
| Someone else's ticket | "What's the status of ticket 10?" (E115's printer) | "I couldn't find ticket #10 in your tickets." |
| Made-up id | "What's the status of ticket 99999?" | Same message |
| Duplicate | After D1, "Raise another VPN ticket" | Refused with `#11`; offers to add details |
| Bad status change | "Change my Jira ticket to in progress" (#2 is `resolved`) | "A resolved ticket can't be changed to in_progress." Offers reopen |
| Missing details | "Raise a ticket" | Asks one question: what is the problem? |
| Off topic | "Write me a poem about cricket" | Politely declines; IT help only |

---

## 12. Build plan (mapped to the handbook)

| Time | Step | Owner | Done when |
|---|---|---|---|
| 10:15 – 10:30 | Read PS4, choose roles, **H1** `AGENTS.md` (Appendix A) | Team Lead + AI | Names match §5 |
| 10:30 – 10:45 | Repo `team-<no>-ps4`, run `00_starter_example.sql` then `ps4_it_helpdesk.sql`, `.env.local`, first Vercel deploy | Team Lead · Database | `localhost:3000` runs; 5 tables visible in Supabase |
| 10:45 – 11:00 | **H2** plan → show mentor | Team Lead | Plan matches §7 |
| 11:00 – 11:10 | `lib/currentUser.ts` → `export const CURRENT_USER_ID = "E101";` | AI | — |
| 11:10 – 11:45 | **H3** `searchKnowledgeBase` (word search §7.2), `getMyTickets` | AI | Both D1/D2 queries find the right article |
| 11:45 – 12:15 | **H4** `createTicket` (§7.3) | AI + Backend | Ticket #11 created; duplicate refused |
| 12:15 – 12:30 | **H5** system prompt + `MAX_ROUNDS = 8` | AI | D1 end to end |
| **12:30** | ✅ **Checkpoint** | | Pushed; `git status` clean |
| 1:30 – 1:50 | **H6** `app/api/tickets/route.ts` | Backend | `/api/tickets` shows E101's tickets as JSON |
| 1:50 – 2:20 | **H7** `TicketList`, title, sample prompts | Frontend | New ticket shows within 5 s |
| 2:20 – 2:45 | `getTicketStatus` + `updateTicket` (**H4**), then stretch | AI + Backend | D3 works; bad status change refused |
| 2:45 – 3:30 | **H8** tests §11 · **H9** build · **H10** phone · **H11** README | Developers | Demo works on Vercel |
| 2:45 – 3:30 | **H12** 5 slides | Team Lead + 1 | Real screenshots |
| **3:30** | 🔒 **Code freeze** | | ≥ 2 tools, ≥ 1 write, Vercel works, every member committed |
| 3:30 – 4:00 | Google Form | Team Lead | Submitted before 4:00 |

**Before the final demo:** re-run the seed in Supabase to reset the data (it drops and recreates the tables; dates stay fresh).

### File ownership

| Role | Owns |
|---|---|
| AI / Agent | `lib/agent/tools.ts`, `lib/agent/systemPrompt.ts`, `lib/currentUser.ts` |
| Backend / API | `app/api/tickets/`, `app/api/admin/` (stretch), rule checks |
| Frontend | `app/page.tsx`, `components/`, `app/admin/page.tsx` (stretch) |
| Database | Supabase, seed runs/resets, checking rows after each write |
| Team Lead | `AGENTS.md`, README, Vercel, slides, form |

---

## 13. Judging checklist

| Area (marks) | We meet it by |
|---|---|
| **Agent (30)** | 5 tools, 2 write · Gemini picks tools · Zod on every tool · refusals §11 |
| **Working app (25)** | D1–D3 on the **Vercel** link · new ticket shows in My Tickets |
| **Code & GitHub (15)** | Every member commits · README · no keys in repo |
| **UI & UX (10)** | 360px phone · tools used visible · priority/status badges |
| **Slides (20)** | 5 slides, own screenshots · each member explains their part |

---

## 14. Slides outline (H12)

| # | Slide | Content |
|---|---|---|
| 1 | Title & team | DeskBot · PS4 · team no., members, roles |
| 2 | The problem | IT flooded with simple tickets · 30 known fixes exist · 5 teams, tickets often land in the wrong one |
| 3 | Solution & demo | Screenshot: D1 chat with tools used · screenshot: new ticket in My Tickets |
| 4 | How the agent works | User → Gemini → tools → Supabase · 3 read + 2 write tools · rules in code · team picked by code from the category |
| 5 | Results & links | What works · a refusal (ticket 10 / duplicate) · next: admin board, P1 summary · GitHub + Vercel links |

---

## 15. Judge Q&A

| Question | Answer |
|---|---|
| How does the agent decide what to do? | Gemini reads the tool descriptions and picks a tool; our code runs it. |
| What stops the AI breaking your rules? | The write tools check the rules in code and throw before changing data. |
| Why no user id in the tools? | So nobody can act as someone else; the server sets `CURRENT_USER_ID`. |
| Who picks the support team? | Our code, from the category → team mapping in `kb_articles`. The AI can't misroute. |
| Why does search split words? | Users don't type the exact keywords — "strange link" must still find "suspicious link". |
| What does Zod do? | Checks Gemini's arguments (category, priority, lengths) before the tool runs. |
| Where are your keys? | Only in `.env.local` and Vercel settings. |

---

## Appendix A — `AGENTS.md` (paste as-is, also to `.github/copilot-instructions.md`)

```md
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
```
