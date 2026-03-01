import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "MCAT Master — Ace Your Exam",
  description:
    "Gamified MCAT study app with spaced repetition flashcards, quiz mode, streak tracking, and analytics. Built for the serious MCAT student.",
  keywords: ["MCAT", "study", "flashcards", "spaced repetition", "MCAT prep"],
  openGraph: {
    title: "MCAT Master",
    description: "Gamified MCAT study app with spaced repetition",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>{children}</body>
    </html>
  );
}
