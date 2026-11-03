import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Shadow Forge — Rise Through the Ranks",
  description: "Solo Leveling gym tracker. Push, Pull, Legs. Rise through the ranks.",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Shadow Forge",
  },
};

export const viewport: Viewport = {
  themeColor: "#4FC3F7",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <head>
        <link rel="apple-touch-icon" href="/icons/icon.svg" />
        <meta name="mobile-web-app-capable" content="yes" />
      </head>
      <body>{children}</body>
    </html>
  );
}
