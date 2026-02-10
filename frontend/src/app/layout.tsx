import type { Metadata } from "next";
import { Geist_Mono } from "next/font/google";
import "./globals.css";
import Sidebar from "@/components/layout/Sidebar";

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Vigilan IDS",
  description: "Intrusion Detection System Dashboard",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" data-theme="mocha">
      <body
        className={`${geistMono.variable} font-mono antialiased app-body`}
      >
        <div className="flex min-h-screen">
          <Sidebar />
          <main className="flex-1" style={{ marginLeft: "var(--sidebar-width)" }}>
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
