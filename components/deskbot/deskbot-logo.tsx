"use client";

import React, { useEffect, useRef } from "react";
import { gsap } from "gsap";

export function DeskBotLogo({ className = "w-12 h-12" }: { className?: string }) {
  const headRef = useRef<SVGGElement>(null);
  const eyesRef = useRef<SVGGElement>(null);
  const antennaRef = useRef<SVGCircleElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Gentle floating/hover loop
      gsap.to(headRef.current, {
        y: -3,
        duration: 1.8,
        repeat: -1,
        yoyo: true,
        ease: "power1.inOut",
      });

      // Periodic blink animation
      const blinkTl = gsap.timeline({ repeat: -1, repeatDelay: 3.5 });
      blinkTl
        .to(eyesRef.current, { scaleY: 0.1, transformOrigin: "center center", duration: 0.12 })
        .to(eyesRef.current, { scaleY: 1, duration: 0.12 });

      // Antenna pulse
      gsap.to(antennaRef.current, {
        scale: 1.25,
        opacity: 0.7,
        repeat: -1,
        yoyo: true,
        transformOrigin: "center center",
        duration: 1.2,
        ease: "sine.inOut",
      });
    });

    return () => ctx.revert();
  }, []);

  return (
    <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      {/* Antenna signal pulse dot */}
      <circle ref={antennaRef} cx="24" cy="6" r="3" fill="#7ce577" />
      <line x1="24" y1="9" x2="24" y2="15" stroke="#7ce577" strokeWidth="2.5" strokeLinecap="round" />

      {/* Head Group */}
      <g ref={headRef}>
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

        {/* Eyes Group */}
        <g ref={eyesRef}>
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
