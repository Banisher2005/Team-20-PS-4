import { NextResponse } from "next/server";
import { errorResponse, requireActor } from "@/lib/http";
import { listMyTickets } from "@/lib/tickets";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** GET /api/tickets -> the logged-in employee's tickets, newest first (max 50), with unread IT replies. */
export async function GET() {
  try {
    const actor = await requireActor("employee");
    return NextResponse.json({ tickets: await listMyTickets(actor, 50) });
  } catch (err) {
    return errorResponse(err, "tickets");
  }
}
