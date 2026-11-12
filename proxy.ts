import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE, isValidSession } from "@/lib/auth";
import { ACTING_USER_COOKIE, ADMIN_ID } from "@/lib/actorShared";

/**
 * Passcode gate + role routing.
 * - Every page and API needs a valid passcode session, except login and health.
 * - /admin and /api/admin are only for the "IT Helpdesk (Admin)" user picked in the switcher.
 * - The admin opening the employee home is sent to the admin console.
 */
export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isApi = pathname.startsWith("/api/");

  const redirect = (path: string) => {
    const url = request.nextUrl.clone();
    url.pathname = path;
    url.search = "";
    return NextResponse.redirect(url);
  };

  const ok = await isValidSession(request.cookies.get(SESSION_COOKIE)?.value);
  if (!ok) {
    return isApi ? NextResponse.json({ error: "Not logged in" }, { status: 401 }) : redirect("/login");
  }

  const isAdmin = request.cookies.get(ACTING_USER_COOKIE)?.value === ADMIN_ID;
  const adminArea = pathname.startsWith("/admin") || pathname.startsWith("/api/admin");
  if (adminArea && !isAdmin) {
    return isApi ? NextResponse.json({ error: "IT admin only." }, { status: 403 }) : redirect("/");
  }
  if (isAdmin && (pathname === "/" || pathname === "/tickets")) return redirect("/admin");
  if (isAdmin) {
    const ticketPage = pathname.match(/^\/tickets\/(\d+)$/);
    if (ticketPage) return redirect(`/admin/tickets/${ticketPage[1]}`);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!login|api/login|api/health|_next/static|_next/image|favicon.ico).*)"],
};
