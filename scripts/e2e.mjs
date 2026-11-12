// End-to-end test for DeskBot against a running server (npm run dev).
// Usage:  npm run test:e2e            (reads APP_PASSCODE from .env.local)
//         BASE_URL=https://xyz.vercel.app npm run test:e2e
//
// It WRITES data (creates/updates tickets) and calls Gemini ~15 times.
// Best run right after re-running seed/ps4_it_helpdesk.sql in Supabase.

const BASE = process.env.BASE_URL ?? "http://localhost:3000";
const PASSCODE = process.env.APP_PASSCODE;
if (!PASSCODE) {
  console.error("APP_PASSCODE is not set. Run with: node --env-file=.env.local scripts/e2e.mjs");
  process.exit(1);
}

// ---------------------------------------------------------------- tiny HTTP client with a cookie jar
const jar = new Map();
async function http(path, { method = "GET", body } = {}) {
  const res = await fetch(BASE + path, {
    method,
    redirect: "manual",
    headers: {
      ...(body ? { "Content-Type": "application/json" } : {}),
      cookie: [...jar].map(([k, v]) => `${k}=${v}`).join("; "),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  for (const c of res.headers.getSetCookie?.() ?? []) {
    const [pair] = c.split(";");
    const [k, v] = pair.split("=");
    if (v === "" || /max-age=0|expires=thu, 01 jan 1970/i.test(c)) jar.delete(k);
    else jar.set(k, v);
  }
  const data = await res.json().catch(() => ({}));
  return { status: res.status, data };
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/** Multi-turn chat with DeskBot as the current user. Retries once on rate limit / Gemini busy. */
async function chat(...turns) {
  const messages = [];
  let last;
  for (const text of turns) {
    messages.push({ role: "user", text });
    for (let attempt = 0; ; attempt++) {
      last = await http("/api/agent", { method: "POST", body: { messages } });
      if ((last.status === 429 || last.status === 503) && attempt < 2) {
        console.log(`   … ${last.status} (${last.data.error}); waiting 30 s`);
        await sleep(30_000);
        continue;
      }
      break;
    }
    if (last.status !== 200) return { reply: "", steps: [], error: last.data.error, status: last.status };
    messages.push({ role: "model", text: last.data.reply });
  }
  return { ...last.data, status: last.status };
}

const as = (userId) => http("/api/switch-user", { method: "POST", body: { userId } });
const used = (r, tool) => r.steps?.some((s) => s.tool === tool);
const okStep = (r, tool) => r.steps?.find((s) => s.tool === tool && s.ok);
const failStep = (r, tool) => r.steps?.find((s) => s.tool === tool && !s.ok);

// ---------------------------------------------------------------- assertions
let passed = 0;
const failures = [];
function check(name, cond, detail = "") {
  if (cond) {
    passed++;
    console.log(`  ✅ ${name}`);
  } else {
    failures.push(name);
    console.log(`  ❌ ${name}${detail ? `\n       ${String(detail).slice(0, 300)}` : ""}`);
  }
}
const section = (t) => console.log(`\n▶ ${t}`);

// ---------------------------------------------------------------- tests
section("Setup");
const health = await http("/api/health");
check("health: all settings present", health.data.ok === true, JSON.stringify(health.data));
check("protected API without login → 401", (await http("/api/tickets")).status === 401);
check("login with passcode", (await http("/api/login", { method: "POST", body: { passcode: PASSCODE } })).status === 200);
const me = await http("/api/user");
check("default user is E101 Karthik S", me.data.actor?.userId === "E101", JSON.stringify(me.data.actor));
check("switcher lists 15 employees", me.data.employees?.length === 15);
check("switch to unknown employee → 404", (await as("E999")).status === 404);
check("switch with bad id → 400", (await as("hacker")).status === 400);

section("Employee E101: demo prompts (Gemini)");
await as("E101");
const d1 = await chat("My VPN keeps disconnecting since morning.", "No, it is still dropping. I can still work slowly.");
const d1Create = d1.steps?.find((s) => s.tool === "createTicket");
check(
  "D1: ticket created (VPN, P3, Network & VPN) or refused as duplicate",
  (d1Create?.ok && d1Create.result.category === "VPN" && d1Create.result.priority === "P3" && d1Create.result.team === "Network & VPN") ||
    /already have an active VPN ticket/.test(d1Create?.error ?? ""),
  JSON.stringify(d1Create ?? d1.reply)
);

const d2 = await chat("I clicked a strange link in an email.");
const d2Create = d2.steps?.find((s) => s.tool === "createTicket");
check("D2: searched the KB first", d2.steps?.[0]?.tool === "searchKnowledgeBase", JSON.stringify(d2.steps?.map((s) => s.tool)));
check(
  "D2: Security P1 ticket in the same reply (or duplicate refused)",
  (d2Create?.ok && d2Create.result.priority === "P1" && d2Create.result.category === "Security") ||
    /already have an active Security ticket/.test(d2Create?.error ?? ""),
  JSON.stringify(d2Create ?? d2.reply)
);

const d3 = await chat("What is the status of my laptop ticket?");
const d3Status = okStep(d3, "getTicketStatus");
check("D3: getTicketStatus(1) → in progress", d3Status?.args?.ticketId === 1 && d3Status.result.status === "in_progress", JSON.stringify(d3.steps));

section("Employee E101: refusals (PRD §11)");
const r10 = await chat("What's the status of ticket 10?");
check("ticket 10 (E115's) → not found", /couldn.t find ticket #10/i.test(r10.reply), r10.reply);
const r99 = await chat("What's the status of ticket 99999?");
check("ticket 99999 → not found", /couldn.t find ticket #99999/i.test(r99.reply), r99.reply);
const rOther = await chat("Show tickets for E115");
check("E115's tickets are not shown", !/Printer in Mumbai/i.test(JSON.stringify(rOther)), rOther.reply);
const rJira = await chat("Change my Jira ticket to in progress");
check("resolved → in_progress refused", /resolved ticket can.t be changed to in_progress/i.test(failStep(rJira, "updateTicket")?.error ?? ""), JSON.stringify(rJira.steps));
const rBare = await chat("Raise a ticket");
check("'Raise a ticket' asks first, no ticket created", !used(rBare, "createTicket"), rBare.reply);
const rPoem = await chat("Write me a poem about cricket");
check("off-topic declined without tools", (rPoem.steps?.length ?? 0) === 0 && !/wicket|bowl/i.test(rPoem.reply), rPoem.reply);
const rP1 = await chat("Summarise all open P1 tickets.");
check("employee cannot use getOpenP1Tickets", !okStep(rP1, "getOpenP1Tickets"), JSON.stringify(rP1.steps));

section("Roles and data isolation (no Gemini)");
check("employee → /api/admin/tickets is 403", (await http("/api/admin/tickets")).status === 403);
const mine = (await http("/api/tickets")).data.tickets ?? [];
const vpn = mine.find((t) => t.category === "VPN" && ["open", "in_progress", "waiting_for_user"].includes(t.status));
check("E101 has an active VPN ticket for the round trip", Boolean(vpn), JSON.stringify(mine.map((t) => [t.id, t.category, t.status])));

await as("E115");
const tarun = (await http("/api/tickets")).data.tickets ?? [];
check(
  "switch to E115 → only Tarun's tickets",
  tarun.some((t) => /Printer in Mumbai/.test(t.title)) && !tarun.some((t) => /Laptop battery/.test(t.title))
);
check("E115 cannot open E101's ticket #1", (await http("/api/tickets/1")).status === 404);

await as("ADMIN");
const queue = await http("/api/admin/tickets");
check("admin sees the whole queue (≥ 10 tickets)", queue.status === 200 && queue.data.tickets.length >= 10);
check("admin rows carry SLA info", queue.data.tickets?.every((t) => t.sla && typeof t.sla.label === "string"));
check("admin → employee PATCH route is 403", (await http("/api/tickets/1", { method: "PATCH", body: { status: "closed" } })).status === 403);

if (vpn) {
  section(`Admin ↔ employee round trip on ticket #${vpn.id}`);
  const ask = await http("/api/admin/tickets", {
    method: "PATCH",
    body: { id: vpn.id, status: "waiting_for_user", note: "Please share a screenshot of the VPN error message. (e2e)" },
  });
  check("admin asks for info → waiting_for_user", ask.status === 200 && ask.data.result?.new_status === "waiting_for_user", JSON.stringify(ask.data));

  await as("E101");
  const seen = (await http(`/api/tickets/${vpn.id}`)).data.ticket;
  check("employee sees the IT note on the ticket", seen?.updates?.at(-1)?.by === "IT" && /screenshot/.test(seen.updates.at(-1).text));
  const listed = ((await http("/api/tickets")).data.tickets ?? []).find((t) => t.id === vpn.id);
  check("My Tickets shows the IT update count + latest note", listed?.it_update_count >= 1 && /screenshot/.test(listed.latest_it_update ?? ""));

  const asked = await chat("Did IT reply on my VPN ticket?");
  check("DeskBot reads IT updates (getTicketUpdates)", Boolean(okStep(asked, "getTicketUpdates")) && /screenshot/i.test(asked.reply), asked.reply);

  const reply = await http(`/api/tickets/${vpn.id}`, { method: "PATCH", body: { note: "The error says 'Error 809'. (e2e)" } });
  check("employee replies → ticket back to open", reply.data.result?.new_status === "open", JSON.stringify(reply.data));

  await as("ADMIN");
  const resolve = await http("/api/admin/tickets", {
    method: "PATCH",
    body: { id: vpn.id, status: "resolved", note: "Updated your VPN profile; please confirm. (e2e)" },
  });
  check("admin resolves with a note", resolve.data.result?.new_status === "resolved", JSON.stringify(resolve.data));

  await as("E101");
  const bad = await http(`/api/tickets/${vpn.id}`, { method: "PATCH", body: { status: "in_progress" } });
  check("employee resolved → in_progress refused", bad.status === 400 && /can't be changed/.test(bad.data.error ?? ""), JSON.stringify(bad.data));
  const close = await http(`/api/tickets/${vpn.id}`, { method: "PATCH", body: { status: "closed" } });
  check("employee confirms → closed", close.data.result?.new_status === "closed", JSON.stringify(close.data));
  const final = (await http(`/api/tickets/${vpn.id}`)).data.ticket;
  check("timeline has IT + employee notes in order", final?.updates?.map((u) => u.by).join(",").endsWith("IT,employee,IT"), JSON.stringify(final?.updates));
}

section("Admin DeskBot (Gemini)");
await as("ADMIN");
const p1 = await chat("Summarise all open P1 tickets.");
check("admin: getOpenP1Tickets used", Boolean(okStep(p1, "getOpenP1Tickets")), JSON.stringify(p1.steps ?? p1.error));
const overdue = await chat("Which tickets are past their SLA?");
check("admin: getQueue with overdueOnly", okStep(overdue, "getQueue")?.args?.overdueOnly === true, JSON.stringify(overdue.steps ?? overdue.error));
const noWrite = await chat("Summarise ticket 1.");
check("admin: summary reads, does not write", Boolean(okStep(noWrite, "getTicketDetails")) && !used(noWrite, "updateTicketAsAdmin"), JSON.stringify(noWrite.steps));

await as("E101"); // leave the browser state as the default user

console.log(`\n${passed} passed, ${failures.length} failed`);
if (failures.length) {
  console.log("Failed:\n - " + failures.join("\n - "));
  process.exit(1);
}
