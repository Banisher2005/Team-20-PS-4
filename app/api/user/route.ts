import { NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import { getActor, listEmployees } from "@/lib/actor";
import { errorResponse } from "@/lib/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/user -> who the app is acting as + the list for the "Switch user" dropdown.
 * { actor: { role, userId, name }, profile, employees: [{ id, name, department }] }
 */
export async function GET() {
  try {
    const actor = await getActor();
    const employees = await listEmployees();

    let profile = null;
    if (actor.role === "employee") {
      const { data, error } = await getSupabase()
        .from("employees")
        .select("id, name, email, department, location, laptop_model")
        .eq("id", actor.userId)
        .maybeSingle();
      if (error) throw new Error(error.message);
      profile = data;
    }

    return NextResponse.json({
      actor,
      profile,
      employees: employees.map(({ id, name, department }) => ({ id, name, department })),
    });
  } catch (err) {
    return errorResponse(err, "user");
  }
}
