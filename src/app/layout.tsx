import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "MemoSyncer",
  description: "Smart Bilingual Flashcard Knowledge Base",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}
