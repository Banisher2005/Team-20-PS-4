import { NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import { CURRENT_USER_ID } from "@/lib/currentUser";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** GET /api/tickets -> the logged-in user's tickets, newest first (max 50). */
export async function GET() {
  const { data, error } = await getSupabase()
    .from("tickets")
    .select("*, support_teams(name)")
    .eq("employee_id", CURRENT_USER_ID)
    .order("created_at", { ascending: false })
    .limit(50);
  if (error) {
    console.error("[tickets]", error.message);
    return NextResponse.json({ error: "Could not load tickets" }, { status: 500 });
  }
  return NextResponse.json({ tickets: data });
}
