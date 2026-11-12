"use client";

import React from "react";
import { MessageSquare, Ticket, LayoutGrid, Bell, Bot, ChevronDown, LogOut } from "./Icons";

export interface EmployeeProfile {
  id: string;
  name: string;
  department?: string;
  location?: string;
  designation?: string;
  email?: string;
}

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export function Sidebar({ activeTab, setActiveTab }: SidebarProps) {
  const navItems = [
    { id: "chat", label: "Helpdesk Chat", icon: MessageSquare },
    { id: "tickets", label: "My Tickets", icon: Ticket },
    { id: "admin", label: "IT Admin Board", icon: LayoutGrid },
  ];

  return (
    <aside className="w-64 bg-[#143d3b] text-white flex flex-col flex-shrink-0 transition-all select-none">
      {/* Brand logo area */}
      <div className="h-16 flex items-center gap-3 px-6 border-b border-[#1c4d4b]">
        <div className="w-9 h-9 rounded-lg bg-[#276e6a] flex items-center justify-center text-emerald-300 shadow-inner">
          <Bot className="w-5 h-5" />
        </div>
        <span className="text-xl font-bold tracking-tight text-white flex items-center gap-1.5">
          DeskBot
        </span>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-4 py-6 space-y-1.5">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? "bg-[#bbf7d0] text-slate-900 shadow-xs font-semibold"
                  : "text-emerald-100/90 hover:bg-[#1a4a47] hover:text-white"
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? "text-slate-900" : "text-emerald-300"}`} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Bottom Accent Decor (from screenshot) */}
      <div className="p-6">
        <div className="flex items-center gap-1.5 opacity-90">
          <div className="w-4 h-3 bg-emerald-400 transform -skew-x-12 rounded-xs" />
          <div className="w-4 h-3 bg-emerald-400 transform -skew-x-12 rounded-xs" />
          <div className="w-4 h-3 bg-emerald-400 transform -skew-x-12 rounded-xs" />
          <div className="w-8 h-3 bg-emerald-300 transform -skew-x-12 rounded-xs ml-1" />
        </div>
      </div>
    </aside>
  );
}

interface HeaderProps {
  employee: EmployeeProfile | null;
  onLogout?: () => void;
}

export function Header({ employee, onLogout }: HeaderProps) {
  return (
    <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between shadow-2xs">
      {/* Title */}
      <div className="flex items-center gap-4">
        <div className="h-6 w-0.5 bg-slate-300 hidden sm:block" />
        <h1 className="text-base sm:text-lg font-bold text-slate-800 tracking-tight">
          IT Helpdesk Ticket Agent
        </h1>
      </div>

      {/* Right User Bar */}
      <div className="flex items-center gap-4">
        {/* Notification Bell */}
        <button
          className="relative p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-full transition-colors"
          title="Notifications"
        >
          <Bell className="w-5 h-5" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-emerald-500 rounded-full ring-2 ring-white" />
        </button>

        {/* User Card */}
        <div className="flex items-center gap-3 pl-3 border-l border-slate-200">
          <span className="inline-flex items-center px-2 py-0.5 rounded font-mono text-xs font-bold bg-[#dcfce7] text-[#166534] border border-[#bbf7d0]">
            {employee?.id ?? "E101"}
          </span>
          <div className="hidden sm:block text-left leading-tight">
            <div className="text-sm font-bold text-slate-900">
              {employee?.name ?? "Karthik S."}
            </div>
            <div className="text-xs text-slate-500">
              {employee?.designation ?? "Employee"}
            </div>
          </div>
          {onLogout ? (
            <button
              onClick={onLogout}
              title="Log out"
              className="p-1 text-slate-400 hover:text-slate-700 rounded transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          ) : (
            <ChevronDown className="w-4 h-4 text-slate-500 cursor-pointer" />
          )}
        </div>
      </div>
    </header>
  );
}
