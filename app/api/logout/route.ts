import { NextResponse } from "next/server";
import { SESSION_COOKIE } from "@/lib/auth";
import { ACTING_USER_COOKIE } from "@/lib/actorShared";

export async function POST() {
  const response = NextResponse.json({ ok: true });
  response.cookies.delete(SESSION_COOKIE);
  response.cookies.delete(ACTING_USER_COOKIE);
  return response;
}
