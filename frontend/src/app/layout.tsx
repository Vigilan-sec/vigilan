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
    <html lang="fr" className="dark">
      <body
        className={`${geistMono.variable} font-mono antialiased bg-zinc-950 text-zinc-100`}
      >
        <div className="flex min-h-screen">
          <Sidebar />
          <main className="flex-1 ml-56">{children}</main>
        </div>
      </body>
    </html>
  );
}
