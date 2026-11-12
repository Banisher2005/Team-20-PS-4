import type { Metadata } from "next";
import { IBM_Plex_Mono, IBM_Plex_Sans } from "next/font/google";
import "./globals.css";
import { MeshDriftBackground } from "@/components/background/mesh-drift";
import { DEFAULT_THEME, THEME_INIT_SCRIPT } from "@/lib/theme";

// Self-hosted by next/font (no layout shift, no external request at runtime).
// globals.css maps these onto Tailwind's font-sans / font-mono.
const plexSans = IBM_Plex_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-plex-sans",
  display: "swap",
});
const plexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-plex-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "DeskBot · IT Helpdesk",
  description: "IT help in chat — fixes from the knowledge base first, tickets to the right team if needed.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    // data-theme is set before paint by THEME_INIT_SCRIPT from the saved choice, so React may see a
    // different value than the server rendered: suppressHydrationWarning is expected here.
    <html
      lang="en"
      data-theme={DEFAULT_THEME}
      className={`${plexSans.variable} ${plexMono.variable}`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      </head>
      <body className="min-h-screen relative overflow-x-hidden antialiased">
        <MeshDriftBackground />
        <div className="relative z-10">{children}</div>
      </body>
    </html>
  );
}
