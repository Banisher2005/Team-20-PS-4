"use client";

import React, { useState, useEffect, useRef } from "react";
import { Sidebar, Header, type EmployeeProfile } from "@/components/LayoutComponents";
import { HelpdeskChat, type AgentChatHandle } from "@/components/HelpdeskChat";
import { MyTicketsCard } from "@/components/MyTicketsCard";
import { ITAdminBoardCard } from "@/components/ITAdminBoardCard";

export default function HomePage() {
  const [activeTab, setActiveTab] = useState("chat");
  const [employee, setEmployee] = useState<EmployeeProfile | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const chatRef = useRef<AgentChatHandle>(null);

  // Fetch logged in employee details from existing backend
  useEffect(() => {
    async function loadEmployee() {
      try {
        const res = await fetch("/api/user");
        const data = await res.json();
        if (data.employee) {
          setEmployee(data.employee);
        }
      } catch (err) {
        console.error("Failed to load user profile:", err);
      }
    }
    loadEmployee();
  }, []);

  async function handleLogout() {
    await fetch("/api/logout", { method: "POST" });
    window.location.href = "/login";
  }

  function handleDataChanged() {
    setRefreshKey((k) => k + 1);
  }

  function handleSummarizeP1() {
    chatRef.current?.sendMessage("Summarise all open P1 tickets.");
  }

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#edf4f2] text-slate-800 antialiased font-sans">
      {/* Dark Teal Vertical Sidebar */}
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Header */}
        <Header employee={employee} onLogout={handleLogout} />

        {/* Dashboard 2-column Layout matching screenshot */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 max-w-[1600px] mx-auto">
            {/* Left Side: Helpdesk Chat */}
            <section className="lg:col-span-7 flex flex-col">
              <HelpdeskChat ref={chatRef} onDataChanged={handleDataChanged} />
            </section>

            {/* Right Side: My Tickets + IT Admin Board */}
            <section className="lg:col-span-5 flex flex-col gap-5">
              <MyTicketsCard
                refreshKey={refreshKey}
                onViewAll={() => setActiveTab("tickets")}
              />
              <ITAdminBoardCard
                refreshKey={refreshKey}
                onDataChanged={handleDataChanged}
                onSummarizeP1={handleSummarizeP1}
              />
            </section>
          </div>
        </main>
      </div>
    </div>
  );
}
