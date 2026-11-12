import { NextResponse } from "next/server";
import { z } from "zod";
import { errorResponse, parseId, requireActor } from "@/lib/http";
import { getTicketDetail, updateTicket } from "@/lib/tickets";
import { statusSchema } from "@/lib/helpdesk";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

/** GET /api/tickets/:id -> ticket detail + parsed updates (the owning employee, or the admin). */
export async function GET(_request: Request, { params }: Ctx) {
  try {
    const actor = await requireActor();
    const id = parseId((await params).id);
    return NextResponse.json({ ticket: await getTicketDetail(actor, id) });
  } catch (err) {
    return errorResponse(err, "tickets/:id");
  }
}

const patchSchema = z.object({
  status: statusSchema.optional(),
  note: z.string().trim().max(1000).optional(),
});

/** PATCH /api/tickets/:id  body: { status?, note? } -> employee changes (PRD transition rules). */
export async function PATCH(request: Request, { params }: Ctx) {
  try {
    const actor = await requireActor("employee");
    const id = parseId((await params).id);
    const parsed = patchSchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) return NextResponse.json({ error: "Invalid update" }, { status: 400 });
    return NextResponse.json({ result: await updateTicket(actor, id, parsed.data) });
  } catch (err) {
    return errorResponse(err, "tickets/:id PATCH");
  }
}
