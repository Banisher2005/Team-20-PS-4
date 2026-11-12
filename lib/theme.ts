/**
 * Light / dark theme for DeskBot.
 * The theme lives on <html data-theme="light|dark">, which drives every colour token in app/globals.css.
 * The choice is remembered per browser in localStorage (default: light).
 */

export type Theme = "light" | "dark";

export const THEME_STORAGE_KEY = "deskbot-theme";
export const DEFAULT_THEME: Theme = "light";
export const THEME_EVENT = "deskbot-theme-change";

/**
 * Runs in <head> before the page paints, so a saved dark theme never flashes light first.
 * Kept tiny and dependency-free on purpose (it is inlined as a string).
 */
export const THEME_INIT_SCRIPT = `(function(){try{var t=localStorage.getItem("${THEME_STORAGE_KEY}");if(t==="light"||t==="dark"){document.documentElement.setAttribute("data-theme",t);}}catch(e){}})();`;

export function getTheme(): Theme {
  if (typeof document === "undefined") return DEFAULT_THEME;
  return document.documentElement.getAttribute("data-theme") === "dark" ? "dark" : "light";
}

export function setTheme(theme: Theme): void {
  const root = document.documentElement;
  // Brief cross-fade of colours (see .theme-transition in globals.css).
  root.classList.add("theme-transition");
  root.setAttribute("data-theme", theme);
  window.setTimeout(() => root.classList.remove("theme-transition"), 300);
  try {
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch {
    // Storage blocked (private mode): the theme still applies for this visit.
  }
  window.dispatchEvent(new CustomEvent<Theme>(THEME_EVENT, { detail: theme }));
}
