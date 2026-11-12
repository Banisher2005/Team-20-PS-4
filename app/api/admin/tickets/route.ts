import { NextResponse } from "next/server";
import { z } from "zod";
import { getSupabase } from "@/lib/supabase";
import { statusSchema } from "@/lib/helpdesk";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/*
 * IT Admin board API (stretch, PRD §9.3).
 * GET   /api/admin/tickets -> all tickets with employee + team name
 * PATCH /api/admin/tickets body: { id: number, status } -> IT staff can set any status
 */

export async function GET() {
  const { data, error } = await getSupabase()
    .from("tickets")
    .select("id, title, category, priority, status, team_id, created_at, updated_at, support_teams(name), employees(name)")
    .order("created_at", { ascending: false })
    .limit(200);
  if (error) {
    console.error("[admin/tickets]", error.message);
    return NextResponse.json({ error: "Could not load tickets" }, { status: 500 });
  }
  return NextResponse.json({ tickets: data });
}

const patchSchema = z.object({
  id: z.number().int().positive(),
  status: statusSchema,
});

export async function PATCH(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid update", details: parsed.error.issues }, { status: 400 });
  }
  const { id, status } = parsed.data;
  const { data, error } = await getSupabase()
    .from("tickets")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select("id, status, updated_at")
    .maybeSingle();
  if (error) {
    console.error("[admin/tickets PATCH]", error.message);
    return NextResponse.json({ error: "Could not update ticket" }, { status: 500 });
  }
  if (!data) return NextResponse.json({ error: `Ticket #${id} not found` }, { status: 404 });
  return NextResponse.json({ ticket: data });
}
