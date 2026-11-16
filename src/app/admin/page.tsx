"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import RoleGuard from "@/components/RoleGuard";

export default function AdminDashboardPage() {
  const { userProfile } = useAuth();
  const [stats, setStats] = useState({
    totalStudents: 0,
    activeStudents: 0,
    totalCoaches: 0,
    pendingPayments: 0,
  });
  const [loadingStats, setLoadingStats] = useState(true);

  useEffect(() => {
    async function fetchAdminSummary() {
      try {
        const [studentsSnap, coachesSnap, pendingPaySnap] = await Promise.all([
          getDocs(collection(db, "students")),
          getDocs(collection(db, "coaches")),
          getDocs(
            query(
              collection(db, "payments"),
              where("status", "==", "pending_verification")
            )
          ),
        ]);

        let activeCount = 0;
        studentsSnap.forEach((docSnap) => {
          if (docSnap.data().status === "active") activeCount += 1;
        });

        setStats({
          totalStudents: studentsSnap.size,
          activeStudents: activeCount,
          totalCoaches: coachesSnap.size,
          pendingPayments: pendingPaySnap.size,
        });
      } catch (error) {
        console.error("Gagal memuat ringkasan admin:", error);
      } finally {
        setLoadingStats(false);
      }
    }

    fetchAdminSummary();
  }, []);

  const adminModules = [
    {
      title: "Data Murid & Kode Klaim",
      desc: "Kelola profil anggota, status aktif murid, dan kode tautan wali murid.",
      badge: "Aktif",
      href: "/admin/students",
    },
    {
      title: "Tim Coach & Hak Akses",
      desc: "Atur profil pelatih, berikan izin login akun coach, dan kelola tim lapangan.",
      badge: "Aktif",
      href: "/admin/coaches",
    },
    {
      title: "Jadwal Sabtu & Kurikulum",
      desc: "Buat sesi latihan Sabtu 16.00–18.00 WIB dan sinkronkan 8 materi skill.",
      badge: "Aktif",
      href: "/admin/schedules",
    },
    {
      title: "Absensi & Evaluasi Lapangan",
      desc: "Catat kehadiran Sabtu dan nilai perkembangan 8 materi skill anak.",
      badge: "Aktif",
      href: "/coach/attendance",
    },
    {
      title: "Rapor Bulanan & Publikasi",
      desc: "Tinjau catatan evaluasi coach dan terbitkan rapor ke portal orang tua.",
      badge: "Aktif",
      href: "/coach/reports",
    },
    {
      title: "Verifikasi Pembayaran",
      desc: "Periksa konfirmasi transfer pendaftaran & daftar ulang, lalu aktifkan status murid.",
      badge: "Aktif",
      href: "/admin/payments",
    },
    {
      title: "Pengumuman & Kompetisi",
      desc: "Publikasikan info latihan Sabtu dan agenda lomba ke portal orang tua.",
      badge: "Aktif",
      href: "/admin/announcements",
    },
  ];

  return (
    <RoleGuard allowedRoles={["admin"]}>
      <div className="min-h-[85vh] bg-slate-50 pb-14">
        {/* Header Admin */}
        <div className="bg-slate-900 text-white border-b border-slate-800">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <span className="inline-block px-3 py-1 rounded-full bg-lime-400 text-slate-950 text-xs font-extrabold uppercase tracking-wider">
                  Admin Klub • TREX Skate School
                </span>
                <h1 className="text-2xl sm:text-3xl font-black mt-3">
                  Selamat Datang, {userProfile?.name || "Admin"}
                </h1>
                <p className="text-sm text-slate-300 mt-1">
                  Pusat kendali operasional murid, jadwal latihan Sabtu, rapor,
                  dan administrasi klub.
                </p>
              </div>

              <Link
                href="/coach"
                className="inline-flex items-center justify-center px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs sm:text-sm font-bold text-lime-400 transition-colors shrink-0"
              >
                Buka Mode Lapangan (Coach) →
              </Link>
            </div>

            {/* Ringkasan Statistik */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mt-7">
              <div className="p-4 rounded-2xl bg-slate-800/90 border border-slate-700">
                <p className="text-xs text-slate-400 font-medium">
                  Total Murid
                </p>
                <p className="text-2xl sm:text-3xl font-black text-white mt-1">
                  {loadingStats ? "..." : stats.totalStudents}
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-800/90 border border-slate-700">
                <p className="text-xs text-slate-400 font-medium">
                  Murid Aktif
                </p>
                <p className="text-2xl sm:text-3xl font-black text-lime-400 mt-1">
                  {loadingStats ? "..." : stats.activeStudents}
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-800/90 border border-slate-700">
                <p className="text-xs text-slate-400 font-medium">Tim Coach</p>
                <p className="text-2xl sm:text-3xl font-black text-white mt-1">
                  {loadingStats ? "..." : stats.totalCoaches}
                </p>
              </div>

              <Link
                href="/admin/payments"
                className="p-4 rounded-2xl bg-slate-800/90 border border-slate-700 hover:border-amber-400 transition-colors"
              >
                <p className="text-xs text-slate-400 font-medium">
                  Cek Pembayaran
                </p>
                <p className="text-2xl sm:text-3xl font-black text-amber-400 mt-1">
                  {loadingStats ? "..." : stats.pendingPayments}
                </p>
              </Link>
            </div>
          </div>
        </div>

        {/* Modul Manajemen */}
        <div className="max-w-6xl mx-auto px-4 sm:px-6 mt-8">
          <h2 className="text-lg font-extrabold text-slate-900 mb-4">
            Menu Manajemen Operasional
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {adminModules.map((mod) => (
              <Link
                key={mod.title}
                href={mod.href}
                className="p-5 rounded-2xl bg-white border border-slate-300 hover:border-lime-500 shadow-xs transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className="text-[11px] font-extrabold px-2.5 py-0.5 rounded-md bg-lime-400 text-slate-950">
                      {mod.badge}
                    </span>
                    <span className="text-xs font-extrabold text-slate-900">
                      Buka →
                    </span>
                  </div>
                  <h3 className="text-base font-extrabold text-slate-900">
                    {mod.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-600 mt-1.5 leading-relaxed">
                    {mod.desc}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </RoleGuard>
  );
}
