"use client";

import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import BrandLogo from "@/components/BrandLogo";
import PwaInstaller from "@/components/PwaInstaller";

export default function Navbar() {
  const { firebaseUser, userProfile, logout } = useAuth();

  return (
    <header className="bg-slate-900 border-b border-slate-800 text-white sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        <Link href="/" className="flex items-center gap-2.5 shrink-0">
          <BrandLogo size="sm" />
          <span className="font-black text-sm sm:text-base tracking-tight hidden sm:inline">
            TREX SKATE SCHOOL
          </span>
        </Link>

        <nav className="hidden md:flex items-center gap-6 text-xs sm:text-sm font-bold text-slate-300">
          <Link href="/schedule" className="hover:text-lime-400 transition-colors">
            Jadwal
          </Link>
          <Link href="/curriculum" className="hover:text-lime-400 transition-colors">
            Kurikulum
          </Link>
        </nav>

        <div className="flex items-center gap-2.5">
          <PwaInstaller />

          {firebaseUser ? (
            <div className="flex items-center gap-2.5">
              <span className="text-xs font-bold text-slate-300 hidden lg:inline">
                {userProfile?.name || firebaseUser.email}
              </span>
              {userProfile?.role === "admin" ? (
                <Link
                  href="/admin"
                  className="px-4 py-2 rounded-xl bg-lime-400 hover:bg-lime-300 text-slate-950 font-extrabold text-xs transition-colors"
                >
                  Dashboard Admin
                </Link>
              ) : userProfile?.role === "coach" ? (
                <Link
                  href="/coach"
                  className="px-4 py-2 rounded-xl bg-lime-400 hover:bg-lime-300 text-slate-950 font-extrabold text-xs transition-colors"
                >
                  Portal Coach
                </Link>
              ) : (
                <Link
                  href="/parent"
                  className="px-4 py-2 rounded-xl bg-lime-400 hover:bg-lime-300 text-slate-950 font-extrabold text-xs transition-colors"
                >
                  Portal Orang Tua
                </Link>
              )}
              <button
                type="button"
                onClick={logout}
                className="text-xs font-bold text-slate-400 hover:text-red-400 transition-colors px-2 py-1"
              >
                Keluar
              </button>
            </div>
          ) : (
            <Link
              href="/login"
              className="px-4 py-2 rounded-xl bg-lime-400 hover:bg-lime-300 text-slate-950 font-extrabold text-xs transition-colors shadow-sm"
            >
              Portal Akun
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
