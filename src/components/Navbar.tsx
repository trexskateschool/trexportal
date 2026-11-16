"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const { firebaseUser, logout } = useAuth();
  const router = useRouter();

  const navLinks = [
    { name: "Jadwal", href: "/#jadwal" },
    { name: "Kurikulum", href: "/#kurikulum" },
    { name: "Tim Coach", href: "/#coach" },
    { name: "Kompetisi", href: "/#kompetisi" },
  ];

  const handleLogout = async () => {
    setIsOpen(false);
    await logout();
    router.push("/login");
  };

  return (
    <header className="sticky top-0 z-50 w-full bg-slate-900/95 backdrop-blur-md border-b border-slate-800 text-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        {/* Brand Identity */}
        <Link
          href="/"
          className="flex items-center gap-3 group"
          onClick={() => setIsOpen(false)}
        >
          <div className="w-10 h-10 rounded-xl bg-lime-400 text-slate-950 flex items-center justify-center font-black text-base tracking-tighter shadow-md shrink-0 group-hover:scale-105 transition-transform">
            TX
          </div>
          <div className="leading-tight">
            <span className="block text-base font-extrabold tracking-wide text-white">
              TREX
            </span>
            <span className="block text-[10px] font-bold tracking-widest text-lime-400 uppercase">
              Skate School
            </span>
          </div>
        </Link>

        {/* Desktop Menu */}
        <nav className="hidden md:flex items-center gap-7">
          {navLinks.map((link) => (
            <Link
              key={link.name}
              href={link.href}
              className="text-sm font-medium text-slate-300 hover:text-lime-400 transition-colors"
            >
              {link.name}
            </Link>
          ))}

          {firebaseUser ? (
            <div className="flex items-center gap-3">
              <Link
                href="/dashboard"
                className="px-4 py-2 rounded-lg bg-lime-400 text-slate-950 text-sm font-bold hover:bg-lime-300 transition-colors shadow-sm"
              >
                Dashboard
              </Link>
              <button
                type="button"
                onClick={handleLogout}
                className="px-3.5 py-2 rounded-lg border border-slate-700 text-slate-300 hover:text-white hover:bg-slate-800 text-sm font-semibold transition-colors"
              >
                Keluar
              </button>
            </div>
          ) : (
            <Link
              href="/login"
              className="px-4 py-2 rounded-lg bg-lime-400 text-slate-950 text-sm font-bold hover:bg-lime-300 transition-colors shadow-sm"
            >
              Portal Akun
            </Link>
          )}
        </nav>

        {/* Mobile Menu Button */}
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          aria-label="Buka menu navigasi"
          className="md:hidden p-2 rounded-lg text-slate-200 hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-lime-400"
        >
          {isOpen ? (
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              className="w-6 h-6"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          ) : (
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              className="w-6 h-6"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
          )}
        </button>
      </div>

      {/* Mobile Dropdown Drawer */}
      {isOpen && (
        <div className="md:hidden bg-slate-900 border-b border-slate-800 px-4 pt-2 pb-5 space-y-2">
          {navLinks.map((link) => (
            <Link
              key={link.name}
              href={link.href}
              onClick={() => setIsOpen(false)}
              className="block px-3 py-2.5 rounded-lg text-base font-medium text-slate-200 hover:bg-slate-800 hover:text-lime-400 transition-colors"
            >
              {link.name}
            </Link>
          ))}

          <div className="pt-2 space-y-2">
            {firebaseUser ? (
              <>
                <Link
                  href="/dashboard"
                  onClick={() => setIsOpen(false)}
                  className="block w-full text-center px-4 py-3 rounded-xl bg-lime-400 text-slate-950 font-bold text-sm hover:bg-lime-300 transition-colors"
                >
                  Buka Dashboard Akun
                </Link>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="block w-full text-center px-4 py-2.5 rounded-xl border border-slate-700 text-slate-300 font-semibold text-sm hover:bg-slate-800"
                >
                  Keluar Akun
                </button>
              </>
            ) : (
              <Link
                href="/login"
                onClick={() => setIsOpen(false)}
                className="block w-full text-center px-4 py-3 rounded-xl bg-lime-400 text-slate-950 font-bold text-sm hover:bg-lime-300 transition-colors"
              >
                Masuk Portal Orang Tua &amp; Coach
              </Link>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
