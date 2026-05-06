import type { Metadata } from "next";
import "./globals.css";
import { GeistSans, GeistMono } from "geist/font";

export const metadata: Metadata = {
  title: "OneTapMemories",
  description: "Create and share event memories effortlessly",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${GeistSans.variable} ${GeistMono.variable}`}
    >
      <body>{children}</body>
    </html>
  );
}