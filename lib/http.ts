import "server-only";
import { NextResponse } from "next/server";
import { getActor } from "./actor";
import type { Actor, Role } from "./actorShared";

/** An error whose message is safe to show to the user, with an HTTP status. */
export class HttpError extends Error {
  constructor(
    public status: number,
    message: string
  ) {
    super(message);
  }
}

/** The acting user; throws 403 if a specific role is required and does not match. */
export async function requireActor(role?: Role): Promise<Actor> {
  const actor = await getActor();
  if (role && actor.role !== role) {
    throw new HttpError(403, role === "admin" ? "IT admin only." : "Switch to an employee to do that.");
  }
  return actor;
}

/** Turns any error into a JSON response. Unknown errors are logged and hidden. */
export function errorResponse(err: unknown, tag: string) {
  if (err instanceof HttpError) {
    return NextResponse.json({ error: err.message }, { status: err.status });
  }
  console.error(`[${tag}]`, err instanceof Error ? err.message : err);
  return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
}

/** Parses a positive integer route param like /tickets/12. */
export function parseId(raw: string): number {
  const id = Number(raw);
  if (!Number.isInteger(id) || id <= 0) throw new HttpError(400, "Invalid ticket id");
  return id;
}
