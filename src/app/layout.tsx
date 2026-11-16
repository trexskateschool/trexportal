import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "TREX Skate School | Digital Management System",
  description:
    "Platform manajemen latihan sepatu roda, pemantauan perkembangan anak, dan rapor digital TREX Skate School.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0f172a",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" className={inter.className}>
      <body className="min-h-screen bg-slate-50 text-slate-900 antialiased overflow-x-hidden">
        {children}
      </body>
    </html>
  );
}
