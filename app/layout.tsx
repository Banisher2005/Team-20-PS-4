import type { Metadata } from "next";
import "./globals.css";
import { MeshDriftBackground } from "@/components/background/mesh-drift";
import { DEFAULT_THEME, THEME_INIT_SCRIPT } from "@/lib/theme";

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
