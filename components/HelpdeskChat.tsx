"use client";

import React, { useEffect, useRef, useState, useImperativeHandle, forwardRef } from "react";
import { Bot, Paperclip, Send, CheckCircle2 } from "./Icons";
import type { AgentResult, AgentStep } from "@/lib/agent/types";
import { PriorityBadge } from "./Badges";

interface Message {
  role: "user" | "model";
  text: string;
  steps?: AgentStep[];
  timestamp?: string;
}

export interface AgentChatHandle {
  sendMessage: (text: string) => void;
}

export const HelpdeskChat = forwardRef<AgentChatHandle, { onDataChanged?: () => void }>(
  function HelpdeskChat({ onDataChanged }, ref) {
    const [messages, setMessages] = useState<Message[]>([
      {
        role: "model",
        text: "Hi Karthik! 👋 How can I help you with IT today?",
        timestamp: "11:46 AM",
      },
    ]);
    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const bottomRef = useRef<HTMLDivElement>(null);

    function getCurrentTime() {
      return new Date().toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      });
    }

    useEffect(() => {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages, loading]);

    async function send(text: string) {
      const trimmed = text.trim();
      if (!trimmed || loading) return;

      const userTime = getCurrentTime();
      const next: Message[] = [
        ...messages,
        { role: "user", text: trimmed, timestamp: userTime },
      ];
      setMessages(next);
      setInput("");
      setLoading(true);
      setError("");

      try {
        const res = await fetch("/api/agent", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messages: next.slice(-20).map(({ role, text }) => ({ role, text })),
          }),
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "Agent request failed");
        const result = data as AgentResult;

        const modelTime = getCurrentTime();
        setMessages([
          ...next,
          {
            role: "model",
            text: result.reply,
            steps: result.steps,
            timestamp: modelTime,
          },
        ]);

        if (result.steps && result.steps.some((s) => s.writes && s.ok)) {
          onDataChanged?.();
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Something went wrong");
      } finally {
        setLoading(false);
      }
    }

    useImperativeHandle(ref, () => ({
      sendMessage: (text: string) => {
        send(text);
      },
    }));

    return (
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs flex flex-col h-[750px] overflow-hidden">
        {/* Chat Header */}
        <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-6 h-6 rounded bg-[#276e6a] text-emerald-300 flex items-center justify-center">
              <Bot className="w-4 h-4" />
            </div>
            <h2 className="text-base font-bold text-slate-900 tracking-tight">Helpdesk Chat</h2>
          </div>
        </div>

        {/* Chat Messages Area */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5 bg-[#fafcfb]">
          {messages.map((m, idx) => (
            <div
              key={idx}
              className={`flex flex-col ${m.role === "user" ? "items-end" : "items-start"}`}
            >
              {m.role === "user" ? (
                /* User Message Bubble */
                <div className="flex items-start gap-2 max-w-[85%]">
                  <div className="flex flex-col items-end">
                    <div className="bg-[#dcfce7] text-slate-900 border border-[#bbf7d0] px-4 py-2.5 rounded-2xl rounded-tr-xs text-sm font-medium shadow-2xs">
                      {m.text}
                    </div>
                    {m.timestamp && (
                      <span className="text-[10px] text-slate-400 mt-1 mr-1">
                        {m.timestamp}
                      </span>
                    )}
                  </div>
                  <span className="font-mono text-xs font-bold bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded border border-slate-300 mt-1">
                    E101
                  </span>
                </div>
              ) : (
                /* Bot Message Layout */
                <div className="flex items-start gap-3 max-w-[90%]">
                  <div className="w-8 h-8 rounded-lg bg-[#276e6a] text-emerald-300 flex items-center justify-center flex-shrink-0 mt-0.5 shadow-2xs">
                    <Bot className="w-5 h-5" />
                  </div>

                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-900">DeskBot</span>
                      <div className="w-2 h-2 rounded-xs bg-emerald-500" />
                      {m.timestamp && (
                        <span className="text-[10px] text-slate-400 ml-auto">
                          {m.timestamp}
                        </span>
                      )}
                    </div>

                    {/* Tool executions if any */}
                    {m.steps && m.steps.length > 0 && (
                      <div className="text-xs text-slate-500 bg-slate-50 border border-slate-200 rounded-lg p-2 space-y-1">
                        {m.steps.map((st, i) => (
                          <div key={i} className="flex items-center gap-1.5 font-mono text-[11px]">
                            <span className={st.ok ? "text-emerald-600" : "text-red-500"}>▸</span>
                            <span className="font-semibold text-slate-700">{st.tool}</span>
                            <span className="text-slate-400">({st.ok ? "success" : "failed"})</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Formatted Content */}
                    <div className="text-sm text-slate-800 leading-relaxed space-y-2.5">
                      <FormattedBotMessage text={m.text} steps={m.steps} />
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}

          {loading && (
            <div className="flex items-center gap-2 text-xs font-medium text-slate-500 bg-white border border-slate-200 px-3 py-2 rounded-lg w-fit">
              <Bot className="w-4 h-4 text-emerald-600 animate-pulse" />
              <span>DeskBot is finding the solution...</span>
            </div>
          )}

          {error && (
            <div className="p-3 text-xs text-red-600 bg-red-50 rounded-lg border border-red-200">
              {error}
            </div>
          )}

          <div ref={bottomRef} />
        </div>

        {/* Chat Input Bar */}
        <div className="p-3.5 border-t border-slate-200 bg-white">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              send(input);
            }}
            className="flex items-center gap-2 bg-[#f8fafc] border border-slate-200 rounded-xl px-3 py-1.5 focus-within:border-emerald-500 focus-within:ring-1 focus-within:ring-emerald-500 transition-all"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Describe your IT problem..."
              className="flex-1 bg-transparent py-2 text-sm text-slate-900 placeholder-slate-400 focus:outline-hidden"
            />
            <button
              type="button"
              className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg transition-colors"
              title="Attach screenshot or file"
            >
              <Paperclip className="w-4 h-4" />
            </button>
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="w-8 h-8 rounded-lg bg-[#86efac] hover:bg-[#6ee7b7] text-slate-900 flex items-center justify-center disabled:opacity-40 transition-colors shadow-2xs"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    );
  }
);

function FormattedBotMessage({
  text,
  steps,
}: {
  text: string;
  steps?: AgentStep[];
}) {
  const createdStep = steps?.find((s) => s.tool === "createTicket" && s.ok);
  const createdTicket = createdStep?.result as
    | {
        id: number;
        category: string;
        priority: string;
        team?: string;
        team_name?: string;
      }
    | undefined;

  const lines = text.split("\n");

  return (
    <div className="space-y-2">
      {lines.map((line, idx) => {
        const stepMatch = line.match(/^(\d+)[\.\)]\s*(.*)$/);
        if (stepMatch) {
          const num = stepMatch[1];
          const content = stepMatch[2];
          return (
            <div key={idx} className="flex items-start gap-2.5 my-1.5">
              <span className="w-5 h-5 rounded bg-[#86efac] text-slate-900 font-bold text-xs flex items-center justify-center flex-shrink-0 mt-0.5 shadow-2xs">
                {num}
              </span>
              <span className="text-sm font-medium text-slate-800">{content}</span>
            </div>
          );
        }

        return (
          <p key={idx} className="whitespace-pre-wrap">
            {line}
          </p>
        );
      })}

      {createdTicket && (
        <div className="mt-3 p-4 bg-white rounded-xl border border-slate-200 shadow-2xs space-y-3">
          <div className="flex items-center gap-2 text-emerald-700 font-bold text-sm">
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            <span>Ticket created successfully!</span>
          </div>

          <div className="grid grid-cols-4 gap-2 bg-slate-50 p-2.5 rounded-lg border border-slate-100 text-xs">
            <div>
              <div className="text-slate-400 font-medium">Ticket ID</div>
              <div className="font-mono font-bold text-slate-900 mt-0.5">
                TKT-{10400 + Number(createdTicket.id)}
              </div>
            </div>

            <div>
              <div className="text-slate-400 font-medium">Category</div>
              <div className="font-semibold text-slate-800 mt-0.5">
                {createdTicket.category}
              </div>
            </div>

            <div>
              <div className="text-slate-400 font-medium">Priority</div>
              <div className="mt-0.5">
                <PriorityBadge priority={createdTicket.priority} />
              </div>
            </div>

            <div>
              <div className="text-slate-400 font-medium">Assigned Team</div>
              <div className="font-semibold text-slate-800 mt-0.5">
                {createdTicket.team_name ?? createdTicket.team ?? "IT Support"}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
