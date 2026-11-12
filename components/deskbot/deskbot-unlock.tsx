"use client";

import React, { useState, useRef } from "react";
import { MeshDriftBackground } from "@/components/background/mesh-drift";
import { DeskBotLogo } from "@/components/deskbot/deskbot-logo";

export function DeskBotUnlock() {
  const [passcode, setPasscode] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [isShaking, setIsShaking] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!passcode.trim() || loading) return;

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ passcode }),
      });

      if (res.ok) {
        setIsUnlocked(true);
        setTimeout(() => {
          window.location.href = "/";
        }, 450);
      } else {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? "Incorrect passcode. Please try again.");
        setLoading(false);
        setIsShaking(true);
        setTimeout(() => setIsShaking(false), 500);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Authentication error");
      setLoading(false);
      setIsShaking(true);
      setTimeout(() => setIsShaking(false), 500);
    }
  }

  return (
    <main className="relative flex min-h-dvh items-center justify-center p-4 overflow-hidden">
      {/* Exact Mesh Drift WebGL Background */}
      <MeshDriftBackground />

      <style>{`
        @keyframes unlockShake {
          0%, 100% { transform: translateX(0); }
          20%, 60% { transform: translateX(-8px); }
          40%, 80% { transform: translateX(8px); }
        }
        .shake-animation {
          animation: unlockShake 0.4s ease-in-out;
        }
      `}</style>

      {/* Glassmorphic Unlock Container */}
      <div
        className={`w-full max-w-md overflow-hidden rounded-2xl border border-emerald-400/30 bg-[#03120e]/80 backdrop-blur-xl shadow-2xl p-8 text-white relative z-10 transition-all duration-500 ${
          isUnlocked ? "opacity-0 scale-95 -translate-y-4" : "opacity-100 scale-100"
        } ${isShaking ? "shake-animation" : ""}`}
        style={{
          boxShadow: "0 25px 50px -12px rgba(3, 18, 14, 0.7), 0 0 30px rgba(124, 229, 119, 0.15)",
        }}
      >
        {/* DeskBot Branding */}
        <div className="flex flex-col items-center text-center mb-6">
          <div className="mb-2 flex justify-center w-full">
            <img
              src="/deskbot-logo.png"
              alt="DeskBot"
              className="h-28 sm:h-32 w-auto max-w-[390px] object-contain drop-shadow-[0_0_25px_rgba(124,229,119,0.4)] transition-transform duration-300 hover:scale-105"
            />
          </div>
          <p className="text-xs text-emerald-300 font-medium tracking-wide uppercase">
            IT Helpdesk Ticket Agent · Zentrix Software
          </p>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-emerald-200 mb-1.5">
              Enter Team Passcode
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={passcode}
                onChange={(e) => setPasscode(e.target.value)}
                placeholder="Access passcode"
                autoFocus
                className="w-full rounded-xl border border-emerald-500/40 bg-[#07241c]/60 px-4 py-3 text-sm text-white placeholder-emerald-400/50 outline-none focus:border-[#7ce577] focus:ring-2 focus:ring-[#7ce577]/30 transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-emerald-300 hover:text-white px-2 py-1 rounded transition-colors"
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>
          </div>

          {error && (
            <div className="p-3 text-xs text-red-200 bg-red-950/60 rounded-xl border border-red-500/50">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !passcode.trim()}
            className="w-full py-3 px-4 rounded-xl font-bold text-sm bg-gradient-to-r from-[#7ce577] to-[#0e7c5a] text-[#03120e] hover:brightness-110 active:scale-[0.98] disabled:opacity-50 transition-all shadow-lg shadow-emerald-950/50 flex items-center justify-center gap-2"
          >
            {loading ? (
              <span className="inline-block animate-pulse">Unlocking DeskBot...</span>
            ) : (
              <span>Unlock Dashboard →</span>
            )}
          </button>

          <p className="text-[11px] text-center text-emerald-300/60 pt-2 leading-relaxed">
            Logged-in default: Karthik S (E101). User switching is available on the main dashboard.
          </p>
        </form>
      </div>
    </main>
  );
}
