"use client";

import React, { useState, useRef } from "react";
import { MeshDriftBackground } from "@/components/background/mesh-drift";
import Image from "next/image";
import { ThemeToggle } from "@/components/ThemeToggle";

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

      <div className="absolute right-[max(1rem,env(safe-area-inset-right,0px))] top-[max(1rem,env(safe-area-inset-top,0px))] z-20 rounded-full border border-edge/20 bg-solid/60 backdrop-blur-md">
        <ThemeToggle />
      </div>

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
        className={`w-full max-w-md overflow-hidden rounded-2xl border border-edge/30 bg-solid/80 backdrop-blur-xl shadow-2xl p-8 text-ink relative z-10 transition-all duration-500 ${
          isUnlocked ? "opacity-0 scale-95 -translate-y-4" : "opacity-100 scale-100"
        } ${isShaking ? "shake-animation" : ""}`}
        style={{
          boxShadow: "0 25px 50px -12px rgba(3, 18, 14, 0.7), 0 0 30px rgba(124, 229, 119, 0.15)",
        }}
      >
        {/* DeskBot Animated Branding */}
        <div className="flex flex-col items-center text-center mb-6">
          {/* Transparent logo in two colourways; globals.css shows the one matching data-theme. */}
          <h1 className="mb-1">
            {(["light", "dark"] as const).map((theme) => (
              <Image
                key={theme}
                src={`/deskbot-wordmark-${theme}.png`}
                unoptimized
                alt="DeskBot"
                width={237}
                height={70}
                className={`theme-${theme}-only h-[70px] w-auto`}
                priority
              />
            ))}
          </h1>
          <p className="text-xs text-mute font-medium tracking-wide mt-1 uppercase">
            IT Helpdesk Ticket Agent · Zentrix Software
          </p>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-mute2 mb-1.5">
              Enter Team Passcode
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={passcode}
                onChange={(e) => setPasscode(e.target.value)}
                placeholder="Access passcode"
                autoFocus
                className="w-full rounded-xl border border-edge/40 bg-deep/60 px-4 py-3 text-sm text-ink placeholder-mute/50 outline-none focus:border-accent focus:ring-2 focus:ring-accent/30 transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-mute hover:text-ink px-2 py-1 rounded transition-colors"
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
            className="w-full py-3 px-4 rounded-xl font-bold text-sm bg-gradient-to-r from-lime to-[#0e7c5a] text-[#03120e] hover:brightness-110 active:scale-[0.98] disabled:opacity-50 transition-all shadow-lg shadow-emerald-950/50 flex items-center justify-center gap-2"
          >
            {loading ? (
              <span className="inline-block animate-pulse">Unlocking DeskBot...</span>
            ) : (
              <span>Unlock Dashboard →</span>
            )}
          </button>

          <p className="text-[11px] text-center text-mute/60 pt-2 leading-relaxed">
            Logged-in default: Karthik S (E101). User switching is available on the main dashboard.
          </p>
        </form>
      </div>
    </main>
  );
}
