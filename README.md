## Problem Statement

DeskBot helps Zentrix Software employees get known IT fixes quickly and route unresolved issues to the right helpdesk team.

## Users

- **Zentrix Software employees** can search for IT help, create tickets, and check or update their own tickets.
- **IT Helpdesk Administrator** can review and manage the company ticket queue, update tickets, and send employees notes.

## Live Application Link

[https://team-20-ps-4.vercel.app/](https://team-20-ps-4.vercel.app/)

## Agent Tools

| Tool | Access | What it does |
|---|---|---|
| `searchKnowledgeBase` | READ | Finds up to three matching help articles with solution steps and support team. |
| `getMyTickets` | READ | Lists the acting employee's tickets, newest first, with IT update counts. |
| `getTicketStatus` | READ | Returns status and details, including priority, team, dates, and SLA hours, for one of the employee's tickets. |
| `getTicketUpdates` | READ | Returns employee and IT notes for one of the employee's tickets. |
| `createTicket` | WRITE | Creates an employee ticket; the team is selected from its category, and duplicate active tickets in that category are blocked. |
| `updateTicket` | WRITE | Lets an employee add details, close, or reopen their own ticket under the allowed status rules. |
| `getQueue` | READ | Lists up to 20 tickets filtered by team, status, priority, or overdue SLA. |
| `getTicketDetails` | READ | Returns a ticket's details, employee, SLA, description, and notes for the administrator. |
| `updateTicketAsAdmin` | WRITE | Lets the administrator change a ticket's status or send an employee a note when explicitly requested. |
| `getOpenP1Tickets` | READ | Lists active P1 tickets with their team, employee, and SLA details. |

## Database Tables

| Table | Purpose |
|---|---|
| `employees` | Stores employee identity and workplace details, including department, location, and optional laptop model. |
| `support_teams` | Stores support team names and the issues each team handles. |
| `kb_articles` | Stores help article titles, categories, keywords, solution steps, and the responsible team. |
| `tickets` | Stores employee IT issues, their category, priority, assigned team, status, and timestamps. |
| `sla_rules` | Defines each priority's meaning and response and resolution targets in hours. |

## Three Demo Prompts

1. **"My VPN keeps disconnecting since morning."** DeskBot searches the knowledge base and returns VPN troubleshooting steps. If the problem continues, it can create a P3 ticket for Network & VPN with an 8-hour response target.
2. **"I clicked a strange link in an email."** DeskBot returns the security article's urgent steps and creates a P1 ticket for the Security team.
3. **"What is the status of my laptop ticket?"** For seeded employee E101, DeskBot finds ticket #1, “Laptop battery drains fast,” and reports it as in progress, Hardware, priority P3.

## Team Members

- Abhinav Kumar
- Megha Kadiyala
- Kaushik Narayan
- Atharv Nitin Patil
