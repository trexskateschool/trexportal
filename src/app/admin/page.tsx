"use client";

import Link from "next/link";
import RoleGuard from "@/components/RoleGuard";
import { useAuth } from "@/context/AuthContext";

export default function AdminDashboardPage() {
  const { userProfile } = useAuth();

  const adminMenus = [
    {
      href: "/admin/students",
      badge: "MURID",
      title: "Data Murid & Aktivasi",
      desc: "Kelola daftar murid, status keanggotaan, dan penautan akun wali.",
    },
    {
      href: "/admin/claims",
      badge: "KODE KLAIM",
      title: "Manajemen Kode Klaim",
      desc: "Buat dan pantau kode 6 karakter untuk menghubungkan akun orang tua.",
    },
    {
      href: "/admin/schedules",
      badge: "LATIHAN",
      title: "Jadwal & Kurikulum",
      desc: "Atur agenda latihan Sabtu dan standar 8 materi skill sepatu roda.",
    },
    {
      href: "/admin/coaches",
      badge: "PELATIH",
      title: "Profil Tim Coach",
      desc: "Tambah dan edit profil pelatih yang tampil di halaman publik.",
    },
    {
      href: "/admin/competitions",
      badge: "LOMBA",
      title: "Agenda Kompetisi",
      desc: "Tambah dan edit jadwal kejuaraan dan festival sepatu roda.",
    },
    {
      href: "/admin/announcements",
      badge: "INFO KLUB",
      title: "Pengumuman Klub",
      desc: "Publikasikan pengumuman yang tampil di dashboard orang tua.",
    },
    {
      href: "/admin/payments",
      badge: "KEUANGAN",
      title: "Verifikasi Pembayaran",
      desc: "Cek konfirmasi transfer pendaftaran dan iuran wali murid.",
    },
    {
      href: "/admin/reports",
      badge: "EVALUASI",
      title: "Rapor Bulanan Murid",
      desc: "Tinjau dan terbitkan rapor perkembangan bulanan dari coach.",
    },
  ];

  return (
    <RoleGuard allowedRoles={["admin"]}>
      <div className="min-h-[85vh] bg-slate-50 pb-16">
        <div className="bg-slate-900 text-white border-b border-slate-800">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
            <span className="inline-block px-3 py-1 rounded-full bg-lime-400 text-slate-950 text-xs font-extrabold uppercase tracking-wider">
              Panel Pengurus Klub
            </span>
            <h1 className="text-2xl sm:text-3xl font-black mt-3">
              Dashboard Admin TREX
            </h1>
            <p className="text-sm text-slate-300 mt-1">
              Selamat datang, {userProfile?.name || "Admin"}. Pilih menu pengelolaan di bawah ini.
            </p>
          </div>
        </div>

        <div className="max-w-5xl mx-auto px-4 sm:px-6 mt-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {adminMenus.map((menu) => (
              <Link
                key={menu.href}
                href={menu.href}
                className="p-5 rounded-2xl bg-white border border-slate-200 hover:border-lime-400 shadow-xs transition-all block group"
              >
                <span className="inline-block text-[10px] font-extrabold px-2.5 py-0.5 rounded bg-slate-100 group-hover:bg-lime-200 text-slate-800 transition-colors">
                  {menu.badge}
                </span>
                <h2 className="text-base font-black text-slate-900 mt-3">
                  {menu.title}
                </h2>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  {menu.desc}
                </p>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </RoleGuard>
  );
}
