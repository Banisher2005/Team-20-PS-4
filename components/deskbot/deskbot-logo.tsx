"use client";

import React from "react";

export function DeskBotLogo({ className = "w-12 h-12" }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <style>{`
        @keyframes deskbotFloat {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-3px); }
        }
        @keyframes deskbotBlink {
          0%, 90%, 100% { transform: scaleY(1); }
          95% { transform: scaleY(0.1); }
        }
        @keyframes deskbotPulse {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.3); opacity: 0.6; }
        }
        .deskbot-head-group {
          animation: deskbotFloat 2.6s ease-in-out infinite;
          transform-origin: center center;
        }
        .deskbot-eyes-group {
          animation: deskbotBlink 3.8s ease-in-out infinite;
          transform-origin: center 27px;
        }
        .deskbot-antenna-beacon {
          animation: deskbotPulse 1.6s ease-in-out infinite;
          transform-origin: 24px 6px;
        }
      `}</style>

      {/* Antenna signal pulse dot */}
      <circle className="deskbot-antenna-beacon" cx="24" cy="6" r="3" fill="#7ce577" />
      <line x1="24" y1="9" x2="24" y2="15" stroke="#7ce577" strokeWidth="2.5" strokeLinecap="round" />

      {/* Head Group with gentle bobbing */}
      <g className="deskbot-head-group">
        {/* Outer Glow */}
        <rect x="6" y="14" width="36" height="28" rx="8" fill="#0e7c5a" fillOpacity="0.4" />
        {/* Face Shield */}
        <rect
          x="7"
          y="15"
          width="34"
          height="26"
          rx="7"
          fill="#03120e"
          stroke="#7ce577"
          strokeWidth="2"
        />

        {/* Ears / Side Mounts */}
        <rect x="3" y="24" width="4" height="8" rx="2" fill="#7ce577" />
        <rect x="41" y="24" width="4" height="8" rx="2" fill="#7ce577" />

        {/* Eyes Group with blink */}
        <g className="deskbot-eyes-group">
          <circle cx="18" cy="27" r="3.5" fill="#f4ffc7" />
          <circle cx="30" cy="27" r="3.5" fill="#f4ffc7" />
        </g>

        {/* Mouth Smile */}
        <path
          d="M20 34C21.5 35.5 26.5 35.5 28 34"
          stroke="#7ce577"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </g>
    </svg>
  );
}
