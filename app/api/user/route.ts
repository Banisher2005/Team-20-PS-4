import { NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import { CURRENT_USER_ID, CURRENT_USER_NAME } from "@/lib/currentUser";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const { data: emp, error } = await getSupabase()
      .from("employees")
      .select("id, name, department, location, email, laptop_model")
      .eq("id", CURRENT_USER_ID)
      .maybeSingle();

    if (error) {
      console.error("[user GET]", error.message);
    }

    const employee = emp ?? {
      id: CURRENT_USER_ID,
      name: CURRENT_USER_NAME,
      department: "Engineering",
      location: "Chennai",
      designation: "Employee",
      email: "karthik.s@zentrix.com",
    };

    return NextResponse.json({
      employee: {
        ...employee,
        designation: employee.department || "Employee",
      },
    });
  } catch (err) {
    console.error("[user GET]", err);
    return NextResponse.json({ error: "Failed to load user" }, { status: 500 });
  }
}
