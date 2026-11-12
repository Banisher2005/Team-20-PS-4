"use client";

import React, { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";
import { Bot, Send, CheckCircle2 } from "./Icons";
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

type Props = {
  /** Shown on the user's bubbles, e.g. "E101" or "IT". */
  userBadge: string;
  /** First bot message. */
  greeting: string;
  title?: string;
  samplePrompts?: string[];
  /** sessionStorage key so the chat survives a page reload (one per user). */
  storageKey?: string;
  placeholder?: string;
  onDataChanged?: () => void;
};

function now(): string {
  return new Date().toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit", hour12: true });
}

function loadStored(key?: string): Message[] | null {
  if (!key) return null;
  try {
    const raw = sessionStorage.getItem(key);
    return raw ? (JSON.parse(raw) as Message[]) : null;
  } catch {
    return null;
  }
}

export const HelpdeskChat = forwardRef<AgentChatHandle, Props>(function HelpdeskChat(
  { userBadge, greeting, title = "Helpdesk Chat", samplePrompts = [], storageKey, placeholder, onDataChanged },
  ref
) {
  const greetingMessage: Message = { role: "model", text: greeting };
  const [messages, setMessages] = useState<Message[]>([greetingMessage]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);
  const restored = useRef(false);

  // Restore this user's chat after a reload; reset when the user changes.
  useEffect(() => {
    restored.current = false;
    setMessages(loadStored(storageKey) ?? [{ role: "model", text: greeting }]);
    restored.current = true;
  }, [storageKey, greeting]);

  useEffect(() => {
    if (!storageKey || !restored.current) return;
    try {
      sessionStorage.setItem(storageKey, JSON.stringify(messages.slice(-40)));
    } catch {
      // storage unavailable: chat simply won't survive a reload
    }
  }, [messages, storageKey]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  async function send(text: string) {
    const trimmed = text.trim();
    if (!trimmed || loading) return;

    const next: Message[] = [...messages, { role: "user", text: trimmed, timestamp: now() }];
    setMessages(next);
    setInput("");
    setLoading(true);
    setError("");

    try {
      // The greeting is UI-only; Gemini gets the real conversation (last 20 turns).
      const history = next.filter((m) => m.timestamp || m.role === "user").slice(-20);
      const res = await fetch("/api/agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: history.map(({ role, text }) => ({ role, text })) }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Agent request failed");
      const result = data as AgentResult;

      setMessages([...next, { role: "model", text: result.reply, steps: result.steps, timestamp: now() }]);
      if (result.steps?.some((s) => s.writes && s.ok)) onDataChanged?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  useImperativeHandle(ref, () => ({ sendMessage: (text: string) => send(text) }));

  function clearChat() {
    setMessages([greetingMessage]);
    setError("");
  }

  const showSamples = samplePrompts.length > 0 && messages.length <= 1 && !loading;

  return (
    <div className="flex h-[calc(100dvh-7.5rem)] min-h-[460px] flex-col overflow-hidden rounded-xl border border-emerald-500/20 bg-white/90 backdrop-blur-md shadow-2xs md:h-[calc(100dvh-9rem)] lg:max-h-[780px]">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3.5 sm:px-5">
        <div className="flex items-center gap-2.5">
          <div className="flex h-6 w-6 items-center justify-center rounded bg-[#276e6a] text-emerald-300">
            <Bot className="h-4 w-4" />
          </div>
          <h2 className="text-base font-bold tracking-tight text-slate-900">{title}</h2>
        </div>
        {messages.length > 1 && (
          <button onClick={clearChat} className="text-xs font-semibold text-slate-500 hover:text-slate-900">
            New chat
          </button>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 space-y-5 overflow-y-auto bg-[#fafcfb] p-3 sm:p-5">
        {messages.map((m, idx) => (
          <div key={idx} className={`flex flex-col ${m.role === "user" ? "items-end" : "items-start"}`}>
            {m.role === "user" ? (
              <div className="flex max-w-[90%] items-start gap-2 sm:max-w-[85%]">
                <div className="flex min-w-0 flex-col items-end">
                  <div className="break-words rounded-2xl rounded-tr-xs border border-[#bbf7d0] bg-[#dcfce7] px-4 py-2.5 text-sm font-medium text-slate-900 shadow-2xs">
                    {m.text}
                  </div>
                  {m.timestamp && <span className="mr-1 mt-1 text-[10px] text-slate-400">{m.timestamp}</span>}
                </div>
                <span className="mt-1 rounded border border-slate-300 bg-slate-100 px-1.5 py-0.5 font-mono text-xs font-bold text-slate-700">
                  {userBadge}
                </span>
              </div>
            ) : (
              <div className="flex w-full max-w-[96%] items-start gap-2 sm:max-w-[90%] sm:gap-3">
                <div className="mt-0.5 hidden h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-[#276e6a] text-emerald-300 shadow-2xs sm:flex">
                  <Bot className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1 space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-900">DeskBot</span>
                    <div className="h-2 w-2 rounded-xs bg-emerald-500" />
                    {m.timestamp && <span className="ml-auto text-[10px] text-slate-400">{m.timestamp}</span>}
                  </div>
                  {m.steps && m.steps.length > 0 && <ToolSteps steps={m.steps} />}
                  <div className="space-y-2.5 text-sm leading-relaxed text-slate-800">
                    <FormattedBotMessage text={m.text} steps={m.steps} />
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}

        {showSamples && (
          <div className="space-y-2 pl-0 sm:pl-11">
            <p className="text-xs font-semibold text-slate-500">Try one of these:</p>
            <div className="flex flex-col gap-2">
              {samplePrompts.map((p) => (
                <button
                  key={p}
                  onClick={() => send(p)}
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-left text-sm text-slate-800 transition-colors hover:border-emerald-400 hover:bg-emerald-50 sm:w-fit"
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
        )}

        {loading && (
          <div className="flex w-fit items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-500">
            <Bot className="h-4 w-4 animate-pulse text-emerald-600" />
            <span>DeskBot is working on it…</span>
          </div>
        )}

        {error && <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-600">{error}</div>}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="border-t border-slate-200 bg-white p-2.5 sm:p-3.5">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            send(input);
          }}
          className="flex items-center gap-2 rounded-xl border border-slate-200 bg-[#f8fafc] px-3 py-1.5 transition-all focus-within:border-emerald-500 focus-within:ring-1 focus-within:ring-emerald-500"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={placeholder ?? "Describe your IT problem..."}
            maxLength={2000}
            className="min-w-0 flex-1 bg-transparent py-2 text-sm text-slate-900 placeholder-slate-400 focus:outline-hidden"
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            aria-label="Send"
            className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-[#86efac] text-slate-900 shadow-2xs transition-colors hover:bg-[#6ee7b7] disabled:opacity-40"
          >
            <Send className="h-4 w-4" />
          </button>
        </form>
      </div>
    </div>
  );
});

/** Tools used for a reply; click one to see its arguments and result. */
function ToolSteps({ steps }: { steps: AgentStep[] }) {
  return (
    <div className="space-y-1 rounded-lg border border-slate-200 bg-slate-50 p-2 text-xs text-slate-500">
      <div className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">Tools used</div>
      {steps.map((s, i) => (
        <details key={i} className="group">
          <summary className="flex cursor-pointer select-none list-none items-center gap-1.5 font-mono text-[11px]">
            <span className={s.ok ? "text-emerald-600" : "text-red-500"}>▸</span>
            <span className="font-semibold text-slate-700">{s.tool}</span>
            <span className="text-slate-400">({s.ok ? "success" : "failed"})</span>
            {s.writes && <span className="rounded bg-amber-100 px-1 text-[10px] text-amber-800">writes data</span>}
          </summary>
          <pre className="mt-1 max-h-48 overflow-auto whitespace-pre-wrap break-words rounded bg-white p-2 text-[11px] text-slate-600">
            {JSON.stringify({ args: s.args, ...(s.ok ? { result: s.result } : { error: s.error }) }, null, 2)}
          </pre>
        </details>
      ))}
    </div>
  );
}

/** Renders **bold** and *italic* as React elements (no innerHTML, so no XSS). */
function Inline({ text }: { text: string }) {
  const parts = text.split(/(\*\*[^*\n]+\*\*|\*[^*\n]+\*)/g);
  return (
    <>
      {parts.map((part, i) => {
        if (/^\*\*[^*\n]+\*\*$/.test(part)) return <strong key={i}>{part.slice(2, -2)}</strong>;
        if (/^\*[^*\n]+\*$/.test(part)) return <em key={i}>{part.slice(1, -1)}</em>;
        return part;
      })}
    </>
  );
}

type CreatedTicket = { id: number; category: string; priority: string; team?: string | null; response_hours?: number | null };

function FormattedBotMessage({ text, steps }: { text: string; steps?: AgentStep[] }) {
  const created = steps?.find((s) => s.tool === "createTicket" && s.ok)?.result as CreatedTicket | undefined;

  return (
    <div className="space-y-2">
      {text.split("\n").map((line, idx) => {
        const step = line.match(/^(\d+)[.)]\s*(.*)$/);
        if (step) {
          return (
            <div key={idx} className="my-1.5 flex items-start gap-2.5">
              <span className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded bg-[#86efac] text-xs font-bold text-slate-900 shadow-2xs">
                {step[1]}
              </span>
              <span className="text-sm font-medium text-slate-800">
                <Inline text={step[2]} />
              </span>
            </div>
          );
        }
        const bullet = line.match(/^\s*[-•]\s+(.*)$/);
        if (bullet) {
          return (
            <div key={idx} className="flex items-start gap-2 pl-1">
              <span className="mt-2 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-emerald-500" />
              <span>
                <Inline text={bullet[1]} />
              </span>
            </div>
          );
        }
        if (!line.trim()) return null;
        return (
          <p key={idx} className="whitespace-pre-wrap break-words">
            <Inline text={line} />
          </p>
        );
      })}

      {created && (
        <div className="mt-3 space-y-3 rounded-xl border border-slate-200 bg-white p-3 shadow-2xs sm:p-4">
          <div className="flex items-center gap-2 text-sm font-bold text-emerald-700">
            <CheckCircle2 className="h-5 w-5 text-emerald-600" />
            <span>Ticket created</span>
          </div>
          <div className="grid grid-cols-2 gap-2 rounded-lg border border-slate-100 bg-slate-50 p-2.5 text-xs sm:grid-cols-4">
            <Field label="Ticket">
              <span className="font-mono font-bold text-slate-900">#{created.id}</span>
            </Field>
            <Field label="Category">{created.category}</Field>
            <Field label="Priority">
              <PriorityBadge priority={created.priority} />
            </Field>
            <Field label="Team">{created.team ?? "IT Support"}</Field>
          </div>
          {created.response_hours != null && (
            <p className="text-xs text-slate-500">IT will respond within {created.response_hours} h.</p>
          )}
        </div>
      )}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="font-medium text-slate-400">{label}</div>
      <div className="mt-0.5 font-semibold text-slate-800">{children}</div>
    </div>
  );
}
