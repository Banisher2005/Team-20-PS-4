"use client";

import { useState } from "react";
import { Bot } from "@/components/Icons";

export default function LoginPage() {
  const [passcode, setPasscode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const res = await fetch("/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ passcode }),
    });
    setLoading(false);
    if (res.ok) {
      window.location.href = "/";
    } else {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Login failed");
    }
  }

  return (
    <main className="flex min-h-dvh items-center justify-center bg-[#edf4f2] p-4">
      <form onSubmit={handleSubmit} className="w-full max-w-sm overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center gap-3 bg-[#143d3b] px-6 py-5 text-white">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#276e6a] text-emerald-300">
            <Bot className="h-5 w-5" />
          </div>
          <div>
            <p className="text-lg font-bold leading-tight">DeskBot</p>
            <p className="text-xs text-emerald-100/80">Zentrix Software · IT Helpdesk</p>
          </div>
        </div>
        <div className="p-6">
          <h1 className="text-base font-bold text-slate-900">Enter team passcode</h1>
          <p className="mt-1 text-sm text-slate-500">
            After login you are Karthik S (E101). Use <span className="font-semibold">Switch user</span> at the top right to
            act as another employee or as the IT Helpdesk admin.
          </p>
          <input
            type="password"
            value={passcode}
            onChange={(e) => setPasscode(e.target.value)}
            className="mt-4 w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
            placeholder="Passcode"
            autoFocus
          />
          {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
          <button
            type="submit"
            disabled={loading || !passcode}
            className="mt-4 w-full rounded-lg bg-[#86efac] px-3 py-2 font-bold text-slate-900 hover:bg-[#6ee7b7] disabled:opacity-50"
          >
            {loading ? "Checking..." : "Enter"}
          </button>
        </div>
      </form>
    </main>
  );
}
