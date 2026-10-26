import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Shadow Forge — Rise Through the Ranks",
  description: "A Solo Leveling themed gym tracker. Log your workouts, earn XP, and rise through the Hunter ranks.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
