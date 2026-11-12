"use client";

import React from "react";

export function DeskBotLogo({ className = "h-14 w-auto" }: { className?: string }) {
  return (
    <img
      src="/deskbot-logo.png"
      alt="DeskBot"
      className={`object-contain drop-shadow-[0_0_12px_rgba(124,229,119,0.25)] ${className}`}
    />
  );
}
