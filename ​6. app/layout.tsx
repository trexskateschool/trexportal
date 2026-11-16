import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "TREX Skate School",
  description: "Sistem Manajemen Klub Sepatu Roda TREX Skate School",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id">
      <body className="bg-slate-50 text-slate-900 antialiased">
        {children}
      </body>
    </html>
  );
}
