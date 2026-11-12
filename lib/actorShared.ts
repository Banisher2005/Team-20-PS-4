/** Shared by server code and proxy.ts (no server-only imports here). */

export const ACTING_USER_COOKIE = "deskbot_user";
export const ADMIN_ID = "ADMIN";
export const DEFAULT_EMPLOYEE_ID = "E101";

export type Role = "employee" | "admin";

/** Who is acting: an employee (E101..E115) or the IT helpdesk admin. */
export type Actor = { role: Role; userId: string; name: string };
