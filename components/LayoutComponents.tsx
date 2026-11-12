"use client";

import React, { createContext, useContext, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  MessageSquare,
  Ticket,
  LayoutGrid,
  Bell,
  Bot,
  ChevronDown,
  LogOut,
  Menu,
  X,
  Shield,
  Check,
} from "./Icons";
import { DeskBotLogo } from "@/components/deskbot/deskbot-logo";
import { hasUnseenUpdates } from "@/lib/seenUpdates";

// ---------------------------------------------------------------- acting user (from /api/user)

export type Actor = { role: "employee" | "admin"; userId: string; name: string };

export interface EmployeeProfile {
  id: string;
  name: string;
  department?: string;
  location?: string;
  email?: string;
  laptop_model?: string | null;
}

type EmployeeOption = { id: string; name: string; department: string };

type ShellState = { actor: Actor | null; profile: EmployeeProfile | null; employees: EmployeeOption[] };

const ShellContext = createContext<ShellState>({ actor: null, profile: null, employees: [] });

/** The user the app is acting as (null while loading). */
export function useActingUser(): ShellState {
  return useContext(ShellContext);
}

async function logout() {
  await fetch("/api/logout", { method: "POST" });
  window.location.href = "/login";
}

async function switchUser(userId: string) {
  const res = await fetch("/api/switch-user", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    alert(data.error ?? "Could not switch user");
    return;
  }
  // Full reload so every card, chat and poller starts fresh as the new user.
  window.location.href = data.redirect ?? "/";
}

/**
 * Page frame: dark-teal sidebar + header with the "Switch user" menu.
 * On phones the sidebar becomes a slide-in menu.
 */
export function AppShell({ title, children }: { title: string; children: React.ReactNode }) {
  const [state, setState] = useState<ShellState>({ actor: null, profile: null, employees: [] });
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    fetch("/api/user", { cache: "no-store" })
      .then((r) => r.json())
      .then((data) => {
        if (data.actor) setState({ actor: data.actor, profile: data.profile, employees: data.employees ?? [] });
      })
      .catch((err) => console.error("Failed to load user:", err));
  }, []);

  return (
    <ShellContext.Provider value={state}>
      <div className="flex h-dvh w-full overflow-hidden bg-[#03120e]/60 backdrop-blur-xs font-sans text-slate-800 antialiased">
        {/* Desktop sidebar */}
        <div className="hidden md:flex">
          <Sidebar role={state.actor?.role} />
        </div>

        {/* Mobile slide-in sidebar */}
        {menuOpen && (
          <div className="fixed inset-0 z-40 flex md:hidden">
            <div className="absolute inset-0 bg-black/40" onClick={() => setMenuOpen(false)} />
            <div className="relative flex">
              <Sidebar role={state.actor?.role} onNavigate={() => setMenuOpen(false)} />
              <button
                onClick={() => setMenuOpen(false)}
                className="absolute right-3 top-4 rounded p-1 text-emerald-100 hover:bg-[#1a4a47]"
                aria-label="Close menu"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>
        )}

        <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
          <Header title={title} onMenu={() => setMenuOpen(true)} />
          <main className="flex-1 overflow-y-auto p-3 sm:p-4 md:p-6">{children}</main>
        </div>
      </div>
    </ShellContext.Provider>
  );
}

// ---------------------------------------------------------------- sidebar

const NAV = {
  employee: [
    { href: "/", label: "Helpdesk Chat", icon: MessageSquare },
    { href: "/tickets", label: "My Tickets", icon: Ticket },
  ],
  admin: [
    { href: "/admin", label: "Ticket Queue", icon: LayoutGrid },
    { href: "/admin/assistant", label: "Admin DeskBot", icon: Bot },
  ],
};

export function Sidebar({ role, onNavigate }: { role?: Actor["role"]; onNavigate?: () => void }) {
  const pathname = usePathname();
  const items = role ? NAV[role] : [];

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname === href || (href !== "/admin" && pathname.startsWith(href + "/")) ||
      (href === "/admin" && pathname.startsWith("/admin/tickets"));

  return (
    <aside className="flex w-64 flex-shrink-0 select-none flex-col bg-[#143d3b]/90 backdrop-blur-md text-white border-r border-[#1c4d4b]/60">
      <div className="flex h-16 items-center gap-3 border-b border-[#1c4d4b]/60 px-6">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#276e6a]/80 text-emerald-300 shadow-inner">
          <DeskBotLogo className="h-6 w-6" />
        </div>
        <span className="text-xl font-bold tracking-tight">DeskBot</span>
      </div>

      <nav className="flex-1 space-y-1.5 px-4 py-6">
        {role === "admin" && (
          <p className="px-4 pb-2 text-[11px] font-semibold uppercase tracking-wider text-emerald-300/70">IT Helpdesk</p>
        )}
        {items.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className={`flex w-full items-center gap-3.5 rounded-lg px-4 py-3 text-sm font-medium transition-colors ${
                active ? "bg-[#bbf7d0] font-semibold text-slate-900" : "text-emerald-100/90 hover:bg-[#1a4a47] hover:text-white"
              }`}
            >
              <Icon className={`h-4 w-4 ${active ? "text-slate-900" : "text-emerald-300"}`} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="p-6">
        <div className="flex items-center gap-1.5 opacity-90">
          <div className="h-3 w-4 -skew-x-12 transform rounded-xs bg-emerald-400" />
          <div className="h-3 w-4 -skew-x-12 transform rounded-xs bg-emerald-400" />
          <div className="h-3 w-4 -skew-x-12 transform rounded-xs bg-emerald-400" />
          <div className="ml-1 h-3 w-8 -skew-x-12 transform rounded-xs bg-emerald-300" />
        </div>
      </div>
    </aside>
  );
}

// ---------------------------------------------------------------- header

export function Header({ title, onMenu }: { title: string; onMenu?: () => void }) {
  const { actor } = useActingUser();
  return (
    <header className="flex h-16 flex-shrink-0 items-center justify-between gap-2 border-b border-emerald-500/20 bg-white/80 backdrop-blur-md px-3 shadow-2xs sm:px-6">
      <div className="flex min-w-0 items-center gap-2 sm:gap-4">
        <button
          onClick={onMenu}
          className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 md:hidden"
          aria-label="Open menu"
        >
          <Menu className="h-5 w-5" />
        </button>
        <div className="hidden h-6 w-0.5 bg-slate-300 sm:block" />
        <h1 className="truncate text-base font-bold tracking-tight text-slate-800 sm:text-lg">{title}</h1>
      </div>

      <div className="flex items-center gap-1 sm:gap-3">
        {actor?.role === "employee" && <UpdatesBell userId={actor.userId} />}
        <UserSwitcher />
        <button
          onClick={logout}
          title="Log out"
          aria-label="Log out"
          className="rounded p-1.5 text-slate-400 transition-colors hover:text-slate-700"
        >
          <LogOut className="h-4 w-4" />
        </button>
      </div>
    </header>
  );
}

/** Bell with interactive notifications panel for tickets with IT updates and status alerts. */
function UpdatesBell({ userId }: { userId: string }) {
  const [ticketsWithUpdates, setTicketsWithUpdates] = useState<
    Array<{ id: number; title: string; priority: string; status: string; updated_at: string; it_update_count: number }>
  >([]);
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await fetch("/api/tickets", { cache: "no-store" });
        if (!res.ok) return;
        const data = await res.json();
        const tickets = (data.tickets ?? []) as Array<{
          id: number;
          title: string;
          priority: string;
          status: string;
          updated_at: string;
          it_update_count: number;
        }>;
        if (!cancelled) {
          setTicketsWithUpdates(tickets.filter((t) => hasUnseenUpdates(userId, t.id, t.it_update_count)));
        }
      } catch {
        // ignore; the bell is a hint only
      }
    }
    load();
    const timer = setInterval(load, 10_000);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [userId]);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const count = ticketsWithUpdates.length;

  return (
    <div className="relative" ref={panelRef}>
      <button
        onClick={() => setOpen((prev) => !prev)}
        className={`relative rounded-full p-2 transition-colors ${
          open ? "bg-emerald-50 text-emerald-700" : "text-slate-500 hover:bg-slate-100 hover:text-slate-700"
        }`}
        title={count ? `${count} ticket(s) with new IT updates` : "Notifications"}
        aria-label="Toggle notifications panel"
      >
        <Bell className="h-5 w-5" />
        {count > 0 && (
          <span className="absolute right-0.5 top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-emerald-500 px-1 text-[10px] font-bold text-white ring-2 ring-white">
            {count}
          </span>
        )}
      </button>

      {/* Notifications Panel Dropdown */}
      {open && (
        <div className="absolute right-0 z-50 mt-2 w-80 sm:w-96 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl animate-in fade-in zoom-in-95 duration-100">
          <div className="flex items-center justify-between border-b border-slate-100 bg-[#fafcfb] p-3.5">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-slate-900">Notifications</h3>
              {count > 0 ? (
                <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
                  {count} new
                </span>
              ) : (
                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-600">
                  All caught up
                </span>
              )}
            </div>
            {count > 0 && (
              <Link
                href="/tickets"
                onClick={() => setOpen(false)}
                className="text-xs font-semibold text-emerald-700 transition-colors hover:text-emerald-900"
              >
                View all
              </Link>
            )}
          </div>

          <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
            {count === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400">
                No new IT ticket updates or unread alerts.
              </div>
            ) : (
              ticketsWithUpdates.map((t) => (
                <Link
                  key={t.id}
                  href={`/tickets/${t.id}`}
                  onClick={() => setOpen(false)}
                  className="flex items-start gap-3 p-3.5 text-xs transition-colors hover:bg-slate-50"
                >
                  <span className="mt-1 h-2 w-2 flex-shrink-0 rounded-full bg-emerald-500" />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className="truncate font-semibold text-slate-900">
                        #{t.id} {t.title}
                      </p>
                      <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-600">
                        {t.status}
                      </span>
                    </div>
                    <p className="mt-1 text-slate-500">
                      New update from IT staff · Priority {t.priority}
                    </p>
                  </div>
                </Link>
              ))
            )}
          </div>

          <div className="border-t border-slate-100 bg-[#fafcfb] p-2.5 text-center">
            <Link
              href="/tickets"
              onClick={() => setOpen(false)}
              className="text-xs font-semibold text-emerald-800 transition-colors hover:text-emerald-950"
            >
              Open My Tickets →
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------- switch user

/** Demo user switcher: pick any employee, or the IT Helpdesk admin. */
export function UserSwitcher() {
  const { actor, profile, employees } = useActingUser();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  async function choose(id: string) {
    if (id === actor?.userId) return setOpen(false);
    setBusy(true);
    await switchUser(id);
    setBusy(false);
  }

  const isAdmin = actor?.role === "admin";
  const subtitle = isAdmin ? "Admin" : (profile?.department ?? "Employee");

  return (
    <div ref={ref} className="relative border-l border-slate-200 pl-2 sm:pl-3">
      <button
        onClick={() => setOpen((o) => !o)}
        disabled={busy || !actor}
        aria-haspopup="listbox"
        aria-expanded={open}
        title="Switch user"
        className="flex items-center gap-2 rounded-lg px-1.5 py-1 text-left transition-colors hover:bg-slate-50 disabled:opacity-60 sm:gap-3"
      >
        <span
          className={`inline-flex items-center rounded border px-2 py-0.5 font-mono text-xs font-bold ${
            isAdmin ? "border-amber-200 bg-amber-50 text-amber-800" : "border-[#bbf7d0] bg-[#dcfce7] text-[#166534]"
          }`}
        >
          {isAdmin ? "IT" : (actor?.userId ?? "…")}
        </span>
        <span className="hidden leading-tight sm:block">
          <span className="block text-sm font-bold text-slate-900">{actor?.name ?? "Loading…"}</span>
          <span className="block text-xs text-slate-500">{subtitle}</span>
        </span>
        <ChevronDown className="h-4 w-4 text-slate-500" />
      </button>

      {open && (
        <div
          role="listbox"
          className="absolute right-0 z-50 mt-2 w-72 max-w-[calc(100vw-1.5rem)] overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg"
        >
          <div className="border-b border-slate-100 px-3 py-2 text-xs font-semibold text-slate-500">Switch user (demo)</div>
          <div className="max-h-80 overflow-y-auto py-1">
            <SwitchOption
              selected={isAdmin}
              onClick={() => choose("ADMIN")}
              badge={<Shield className="h-4 w-4 text-amber-700" />}
              name="IT Helpdesk (Admin)"
              detail="Resolve everyone's tickets"
            />
            <div className="my-1 border-t border-slate-100" />
            {employees.map((e) => (
              <SwitchOption
                key={e.id}
                selected={actor?.userId === e.id}
                onClick={() => choose(e.id)}
                badge={<span className="font-mono text-[11px] font-bold text-[#166534]">{e.id}</span>}
                name={e.name}
                detail={e.department}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function SwitchOption({
  selected,
  onClick,
  badge,
  name,
  detail,
}: {
  selected: boolean;
  onClick: () => void;
  badge: React.ReactNode;
  name: string;
  detail: string;
}) {
  return (
    <button
      role="option"
      aria-selected={selected}
      onClick={onClick}
      className={`flex w-full items-center gap-3 px-3 py-2 text-left text-sm transition-colors hover:bg-emerald-50 ${
        selected ? "bg-emerald-50/70" : ""
      }`}
    >
      <span className="flex w-10 flex-shrink-0 justify-center">{badge}</span>
      <span className="min-w-0 flex-1">
        <span className="block truncate font-semibold text-slate-900">{name}</span>
        <span className="block truncate text-xs text-slate-500">{detail}</span>
      </span>
      {selected && <Check className="h-4 w-4 text-emerald-600" />}
    </button>
  );
}
