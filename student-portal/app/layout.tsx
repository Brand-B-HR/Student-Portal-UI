import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "StudentCV Portal",
  description: "Upload and manage your student CV",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-mint-50 text-ink-900 antialiased">{children}</body>
    </html>
  );
}