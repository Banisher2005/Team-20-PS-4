import type { Metadata } from "next";
import "./globals.css";
import { MeshDriftBackground } from "@/components/background/mesh-drift";

export const metadata: Metadata = {
  title: "DeskBot · IT Helpdesk",
  description: "IT help in chat — fixes from the knowledge base first, tickets to the right team if needed.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen relative overflow-x-hidden antialiased">
        <MeshDriftBackground />
        <div className="relative z-10">{children}</div>
      </body>
    </html>
  );
}
