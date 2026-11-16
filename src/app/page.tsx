"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { collection, getDocs, limit, orderBy, query } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import { getHomeRouteByRole } from "@/components/RoleGuard";

interface PublicAnnouncement {
  id: string;
  title: string;
  category: "training" | "competition" | "general";
  eventDate: string;
  content: string;
}

export default function HomePortalGatewayPage() {
  const { firebaseUser, userProfile, loading } = useAuth();
  const [announcements, setAnnouncements] = useState<PublicAnnouncement[]>([]);

  const adminOrCoachHref =
    userProfile?.role === "coach" ? "/coach" : "/admin";

  useEffect(() => {
    async function loadLatestAnnouncements() {
      try {
        const q = query(
          collection(db, "announcements"),
          orderBy("eventDate", "desc"),
          limit(3)
        );
        const snap = await getDocs(q);
        const list: PublicAnnouncement[] = [];
        snap.forEach((d) => {
          list.push({
            id: d.id,
            ...(d.data() as Omit<PublicAnnouncement, "id">),
          });
        });
        setAnnouncements(list);
      } catch {
        // Abaikan jika koleksi belum berisi data
      }
    }

    loadLatestAnnouncements();
  }, []);

  return (
    <div className="min-h-[88vh] bg-slate-950 text-white flex flex-col justify-between">
      {/* Bagian Atas: Identitas Klub & 3 Akses Utama */}
      <div className="max-w-5xl w-full mx-auto px-4 sm:px-6 pt-10 sm:pt-14 pb-10">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-7">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-lime-400 text-slate-950 flex items-center justify-center font-black text-xl tracking-tighter shrink-0">
              TX
            </div>
            <div>
              <span className="text-[11px] font-extrabold uppercase tracking-widest text-lime-400">
                Portal Digital Resmi
              </span>
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
                TREX SKATE SCHOOL
              </h1>
            </div>
          </div>

          <div className="text-xs sm:text-sm text-slate-300 bg-slate-900 border border-slate-800 px-4 py-2.5 rounded-xl">
            Jadwal Rutin:{" "}
            <strong className="text-lime-400">Sabtu, 16.00 – 18.00 WIB</strong>
          </div>
        </div>

        {/* Banner Jika Pengguna Sudah Login */}
        {!loading && firebaseUser && userProfile && (
          <div className="mt-6 p-4 rounded-2xl bg-slate-900 border border-lime-400/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="text-xs sm:text-sm">
              <span className="text-slate-400">Sesi aktif sebagai </span>
              <strong className="text-white">{userProfile.name}</strong>
              <span className="ml-2 px-2 py-0.5 rounded bg-lime-400/20 text-lime-300 text-[11px] font-extrabold uppercase">
                {userProfile.role}
              </span>
            </div>
            <Link
              href={getHomeRouteByRole(userProfile.role)}
              className="inline-flex items-center justify-center px-4 py-2 rounded-xl bg-lime-400 hover:bg-lime-300 text-slate-950 text-xs font-extrabold transition-colors shrink-0"
            >
              Lanjut ke Dashboard Saya →
            </Link>
          </div>
        )}

        {/* Judul Pilihan Akses */}
        <div className="mt-8 sm:mt-10">
          <h2 className="text-lg sm:text-xl font-extrabold text-slate-100">
            Pilih Akses Masuk Portal
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Silakan pilih menu sesuai kebutuhan Anda di bawah ini.
          </p>
        </div>

        {/* 3 Pintu Masuk Utama */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-5 mt-5">
          {/* 1. PENDAFTARAN BARU */}
          <Link
            href="/daftar"
            className="group p-6 rounded-2xl bg-lime-400 text-slate-950 hover:bg-lime-300 transition-all flex flex-col justify-between shadow-lg"
          >
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-black px-2.5 py-1 rounded-lg bg-slate-950 text-lime-400">
                  01 • CALON MURID
                </span>
                <svg
                  className="w-6 h-6 text-slate-950"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2.2}
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"
                  />
                </svg>
              </div>

              <h3 className="text-2xl font-black mt-5 tracking-tight">
                Pendaftaran Baru
              </h3>
              <p className="text-sm text-slate-900/90 font-medium mt-2 leading-relaxed">
                Daftarkan putra/putri Anda bergabung di kelas latihan sepatu
                roda TREX Skate School.
              </p>
            </div>

            <div className="mt-7 pt-4 border-t border-slate-950/15 flex items-center justify-between font-black text-sm">
              <span>Isi Formulir Daftar</span>
              <span className="group-hover:translate-x-1 transition-transform">
                →
              </span>
            </div>
          </Link>

          {/* 2. MASUK PORTAL ORANG TUA */}
          <Link
            href="/parent"
            className="group p-6 rounded-2xl bg-slate-900 border border-slate-700 hover:border-lime-400 text-white transition-all flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold px-2.5 py-1 rounded-lg bg-blue-600 text-white">
                  02 • WALI MURID
                </span>
                <svg
                  className="w-6 h-6 text-lime-400"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2.2}
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
              </div>

              <h3 className="text-2xl font-black mt-5 tracking-tight">
                Masuk Portal Orang Tua
              </h3>
              <p className="text-sm text-slate-300 mt-2 leading-relaxed">
                Pantau perkembangan skill anak, catatan latihan coach, rekap
                absensi Sabtu, dan rapor bulanan.
              </p>
            </div>

            <div className="mt-7 pt-4 border-t border-slate-800 flex items-center justify-between font-extrabold text-sm text-lime-400">
              <span>Masuk Akun Wali</span>
              <span className="group-hover:translate-x-1 transition-transform">
                →
              </span>
            </div>
          </Link>

          {/* 3. ADMIN & COACH */}
          <Link
            href={adminOrCoachHref}
            className="group p-6 rounded-2xl bg-slate-900 border border-slate-700 hover:border-lime-400 text-white transition-all flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold px-2.5 py-1 rounded-lg bg-slate-800 text-lime-400 border border-slate-700">
                  03 • PENGURUS KLUB
                </span>
                <svg
                  className="w-6 h-6 text-slate-300 group-hover:text-lime-400 transition-colors"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2.2}
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                  />
                </svg>
              </div>

              <h3 className="text-2xl font-black mt-5 tracking-tight">
                Admin
              </h3>
              <p className="text-sm text-slate-300 mt-2 leading-relaxed">
                Kelola data murid, kode klaim wali, jadwal latihan Sabtu,
                absensi lapangan, dan publikasi rapor.
              </p>
            </div>

            <div className="mt-7 pt-4 border-t border-slate-800 flex items-center justify-between font-extrabold text-sm text-slate-200 group-hover:text-lime-400">
              <span>Masuk Dashboard Admin</span>
              <span className="group-hover:translate-x-1 transition-transform">
                →
              </span>
            </div>
          </Link>
        </div>

        {/* Papan Pengumuman & Agenda Klub (Jika Ada) */}
        {announcements.length > 0 && (
          <div className="mt-10 pt-8 border-t border-slate-800 space-y-4">
            <h2 className="text-sm font-extrabold uppercase tracking-wider text-lime-400">
              Papan Informasi &amp; Agenda Klub Terbaru
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {announcements.map((item) => (
                <div
                  key={item.id}
                  className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-1.5"
                >
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-extrabold text-lime-400 uppercase">
                      {item.category === "competition"
                        ? "Kompetisi"
                        : item.category === "training"
                        ? "Info Latihan"
                        : "Pengumuman"}
                    </span>
                    <span className="text-slate-400">{item.eventDate}</span>
                  </div>
                  <h3 className="text-sm font-black text-white">
                    {item.title}
                  </h3>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    {item.content}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Catatan Bawah Ringkas */}
      <div className="max-w-5xl w-full mx-auto px-4 sm:px-6 py-6 border-t border-slate-900 text-xs text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-2">
        <p>© {new Date().getFullYear()} TREX Skate School. All rights reserved.</p>
        <p>Sistem Informasi Akademi &amp; Evaluasi Sepatu Roda</p>
      </div>
    </div>
  );
}
