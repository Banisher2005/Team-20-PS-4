import "server-only";
import { cookies } from "next/headers";
import { getSupabase } from "./supabase";
import { ACTING_USER_COOKIE, ADMIN_ID, DEFAULT_EMPLOYEE_ID, type Actor } from "./actorShared";

export type { Actor } from "./actorShared";

type EmployeeRow = { id: string; name: string; department: string; location: string };

let cache: { at: number; rows: EmployeeRow[] } | null = null;

/** All employees for the "Switch user" dropdown (cached for 60 s; 15 rows in the seed). */
export async function listEmployees(): Promise<EmployeeRow[]> {
  if (cache && Date.now() - cache.at < 60_000) return cache.rows;
  const { data, error } = await getSupabase()
    .from("employees")
    .select("id, name, department, location")
    .order("id");
  if (error) throw new Error(error.message);
  cache = { at: Date.now(), rows: data ?? [] };
  return cache.rows;
}

/**
 * Who the app is acting as, from the httpOnly "deskbot_user" cookie set by /api/switch-user.
 * Employee ids are checked against the employees table; anything unknown falls back to E101.
 * Tools never take a user id: they always get this actor from the server.
 */
export async function getActor(): Promise<Actor> {
  const raw = (await cookies()).get(ACTING_USER_COOKIE)?.value;
  if (raw === ADMIN_ID) return { role: "admin", userId: ADMIN_ID, name: "IT Helpdesk" };

  const employees = await listEmployees();
  const match = employees.find((e) => e.id === raw) ?? employees.find((e) => e.id === DEFAULT_EMPLOYEE_ID);
  if (!match) throw new Error("No employees found. Has seed/ps4_it_helpdesk.sql been run?");
  return { role: "employee", userId: match.id, name: match.name };
}
