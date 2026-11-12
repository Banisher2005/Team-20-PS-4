import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "DeskBot · IT Helpdesk",
  description: "IT help in chat — fixes from the knowledge base first, tickets to the right team if needed.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen">{children}</body>
    </html>
  );
}
