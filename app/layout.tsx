import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AppProviders } from "./providers";
import { MobileNav } from "@/components/shell/MobileNav";
import { TopBar } from "@/components/shell/TopBar";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "CS of Doom — Dungeon Run",
  description: "Master IGCSE Computer Science (0478), one sector at a time.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} h-full`}>
      <body className="min-h-full bg-bg font-sans text-text antialiased">
        <AppProviders>
          <TopBar />
          <main className="mx-auto w-full max-w-5xl px-4 pb-24 pt-6">{children}</main>
          <MobileNav />
        </AppProviders>
      </body>
    </html>
  );
}
