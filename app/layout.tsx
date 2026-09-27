import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Big Move",
  description: "Gareth & Kristin's move planner",
  appleWebApp: { capable: true, title: "Big Move", statusBarStyle: "default" },
};

export const viewport: Viewport = { width: "device-width", initialScale: 1, themeColor: "#2f5d50" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-GB">
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}
