"use client";

import React, { Suspense, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AppShell } from "@/components/LayoutComponents";
import { HelpdeskChat, type AgentChatHandle } from "@/components/HelpdeskChat";

const ADMIN_PROMPTS = [
  "Summarise all open P1 tickets.",
  "Which tickets are past their SLA?",
  "Summarise ticket 1.",
];

/** Admin DeskBot: Gemini with the admin tools (queue, ticket details, P1 summary, manual update on request). */
export default function AdminAssistantPage() {
  return (
    <AppShell title="IT Helpdesk · Admin DeskBot">
      <Suspense>
        <AdminChat />
      </Suspense>
    </AppShell>
  );
}

function AdminChat() {
  const chatRef = useRef<AgentChatHandle>(null);
  const params = useSearchParams();
  const router = useRouter();
  const ask = params.get("ask");

  // "Summarise open P1 tickets" from the queue page arrives as ?ask=...; send it once.
  useEffect(() => {
    if (!ask) return;
    const t = setTimeout(() => chatRef.current?.sendMessage(ask), 50);
    router.replace("/admin/assistant");
    return () => clearTimeout(t);
  }, [ask, router]);

  return (
    <div className="mx-auto max-w-4xl">
      <HelpdeskChat
        ref={chatRef}
        title="Admin DeskBot"
        userBadge="IT"
        greeting="Hi! I can list the queue, find tickets past their SLA, summarise any ticket or all open P1s, and update a ticket when you ask me to."
        samplePrompts={ADMIN_PROMPTS}
        storageKey="deskbot_chat_ADMIN"
        placeholder="Ask about the ticket queue…"
      />
    </div>
  );
}
