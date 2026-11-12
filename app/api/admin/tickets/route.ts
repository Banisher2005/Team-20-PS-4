import { NextResponse } from "next/server";
import { z } from "zod";
import { errorResponse, requireActor } from "@/lib/http";
import { getQueue, updateTicket } from "@/lib/tickets";
import { statusSchema } from "@/lib/helpdesk";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/*
 * IT admin console API. proxy.ts already blocks non-admins; requireActor("admin") checks again.
 * GET   /api/admin/tickets -> all tickets with employee, team and SLA
 * PATCH /api/admin/tickets body: { id, status?, note? } -> manual resolution; note is shown to the employee
 */

export async function GET() {
  try {
    const actor = await requireActor("admin");
    return NextResponse.json({ tickets: await getQueue(actor) });
  } catch (err) {
    return errorResponse(err, "admin/tickets");
  }
}

const patchSchema = z
  .object({
    id: z.number().int().positive(),
    status: statusSchema.optional(),
    note: z.string().trim().max(1000).optional(),
  })
  .refine((v) => v.status !== undefined || (v.note ?? "").length > 0, "Nothing to update");

export async function PATCH(request: Request) {
  try {
    const actor = await requireActor("admin");
    const parsed = patchSchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) {
      return NextResponse.json({ error: "Choose a status or write a note." }, { status: 400 });
    }
    const { id, status, note } = parsed.data;
    return NextResponse.json({ result: await updateTicket(actor, id, { status, note }) });
  } catch (err) {
    return errorResponse(err, "admin/tickets PATCH");
  }
}
