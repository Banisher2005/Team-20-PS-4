"use client";

import React, { useEffect, useState } from "react";
import { Moon, Sun } from "./Icons";
import { THEME_EVENT, getTheme, setTheme, type Theme } from "@/lib/theme";

/** Sun / moon button that switches DeskBot between light and dark mode. */
export function ThemeToggle({ className = "" }: { className?: string }) {
  // Starts as null so the server render and the first client render match; the real theme is read after mount.
  const [theme, setThemeState] = useState<Theme | null>(null);

  useEffect(() => {
    setThemeState(getTheme());
    const onChange = (e: Event) => setThemeState((e as CustomEvent<Theme>).detail);
    window.addEventListener(THEME_EVENT, onChange);
    return () => window.removeEventListener(THEME_EVENT, onChange);
  }, []);

  const isDark = theme === "dark";
  const label = isDark ? "Switch to light mode" : "Switch to dark mode";

  return (
    <button
      type="button"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      title={label}
      aria-label={label}
      aria-pressed={isDark}
      className={`rounded-full p-2 text-mute transition-colors hover:bg-edge/10 hover:text-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent ${className}`}
    >
      {/* Shows the mode you will switch TO. Hidden until mounted to avoid a wrong icon flash. */}
      <span className={theme === null ? "invisible" : ""}>
        {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
      </span>
    </button>
  );
}
