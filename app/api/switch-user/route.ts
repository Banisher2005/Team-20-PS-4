import { NextResponse } from "next/server";
import { z } from "zod";
import { listEmployees } from "@/lib/actor";
import { ACTING_USER_COOKIE, ADMIN_ID } from "@/lib/actorShared";
import { errorResponse } from "@/lib/http";

export const runtime = "nodejs";

const schema = z.object({ userId: z.string().trim().regex(/^(E\d{3}|ADMIN)$/) });

/** POST /api/switch-user  body: { userId: "E103" | "ADMIN" } -> sets who the app acts as (demo user switcher). */
export async function POST(request: Request) {
  try {
    const parsed = schema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) return NextResponse.json({ error: "Unknown user" }, { status: 400 });
    const { userId } = parsed.data;

    if (userId !== ADMIN_ID) {
      const employees = await listEmployees();
      if (!employees.some((e) => e.id === userId)) {
        return NextResponse.json({ error: `No employee ${userId}` }, { status: 404 });
      }
    }

    const response = NextResponse.json({ ok: true, redirect: userId === ADMIN_ID ? "/admin" : "/" });
    response.cookies.set(ACTING_USER_COOKIE, userId, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 12,
    });
    return response;
  } catch (err) {
    return errorResponse(err, "switch-user");
  }
}
