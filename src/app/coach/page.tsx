"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import RoleGuard from "@/components/RoleGuard";

export default function CoachDashboardPage() {
  const { userProfile } = useAuth();
  const [summary, setSummary] = useState({
    studentCount: 0,
    scheduleCount: 0,
    draftReports: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadCoachSummary() {
      try {
        const [studSnap, schedSnap, draftSnap] = await Promise.all([
          getDocs(collection(db, "students")),
          getDocs(collection(db, "schedules")),
          getDocs(
            query(
              collection(db, "monthlyReports"),
              where("status", "==", "draft")
            )
          ),
        ]);

        setSummary({
          studentCount: studSnap.size,
          scheduleCount: schedSnap.size,
          draftReports: draftSnap.size,
        });
      } catch (error) {
        console.error("Gagal memuat ringkasan coach:", error);
      } finally {
        setLoading(false);
      }
    }

    loadCoachSummary();
  }, []);

  const coachMenus = [
    {
      badge: "TUGAS MINGGUAN • AKTIF",
      badgeClass: "bg-lime-400 text-slate-950",
      title: "Absensi Latihan Sabtu",
      desc: "Catat kehadiran murid (Hadir, Izin, atau Alpa) langsung dari pinggir lapangan lewat HP.",
      href: "/coach/attendance",
    },
    {
      badge: "EVALUASI SKILL • AKTIF",
      badgeClass: "bg-blue-100 text-blue-900",
      title: "Input Perkembangan Anak",
      desc: "Nilai penguasaan 8 materi teknik (Level 1–4) dan tulis catatan latihan untuk masing-masing murid.",
      href: "/coach/progress",
    },
    {
      badge: "EVALUASI BULANAN • AKTIF",
      badgeClass: "bg-slate-900 text-lime-400",
      title: "Susun Draft Rapor",
      desc: "Rangkum kemajuan bulanan dan rekomendasi materi berikutnya untuk diterbitkan ke wali.",
      href: "/coach/reports",
    },
  ];

  return (
    <RoleGuard allowedRoles={["coach", "admin"]}>
      <div className="min-h-[85vh] bg-slate-50 pb-14">
        {/* Header Coach */}
        <div className="bg-slate-900 text-white border-b border-slate-800">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <span className="inline-block px-3 py-1 rounded-full bg-blue-600 text-white text-xs font-extrabold uppercase tracking-wider">
                  Panel Coach Lapangan
                </span>
                <h1 className="text-2xl sm:text-3xl font-black mt-3">
                  Halo, Coach {userProfile?.name || "TREX"}
                </h1>
                <p className="text-sm text-slate-300 mt-1">
                  Jadwal Latihan Rutin: Sabtu, 16.00 – 18.00 WIB
                </p>
              </div>

              {userProfile?.role === "admin" && (
                <Link
                  href="/admin"
                  className="inline-flex items-center justify-center px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs sm:text-sm font-bold text-lime-400 transition-colors shrink-0"
                >
                  ← Kembali ke Dashboard Admin
                </Link>
              )}
            </div>

            {/* Statistik Ringkas */}
            <div className="grid grid-cols-3 gap-3 sm:gap-4 mt-7">
              <div className="p-4 rounded-2xl bg-slate-800/90 border border-slate-700">
                <p className="text-xs text-slate-400">Total Murid</p>
                <p className="text-xl sm:text-2xl font-black text-white mt-1">
                  {loading ? "..." : summary.studentCount}
                </p>
              </div>
              <div className="p-4 rounded-2xl bg-slate-800/90 border border-slate-700">
                <p className="text-xs text-slate-400">Sesi Jadwal</p>
                <p className="text-xl sm:text-2xl font-black text-lime-400 mt-1">
                  {loading ? "..." : summary.scheduleCount}
                </p>
              </div>
              <div className="p-4 rounded-2xl bg-slate-800/90 border border-slate-700">
                <p className="text-xs text-slate-400">Draft Rapor</p>
                <p className="text-xl sm:text-2xl font-black text-amber-400 mt-1">
                  {loading ? "..." : summary.draftReports}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Kartu Tugas Lapangan Coach */}
        <div className="max-w-5xl mx-auto px-4 sm:px-6 mt-8">
          <h2 className="text-lg font-extrabold text-slate-900 mb-4">
            Menu Pelatihan &amp; Penilaian
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {coachMenus.map((item) => (
              <Link
                key={item.title}
                href={item.href}
                className="p-6 rounded-2xl bg-white border border-slate-300 hover:border-lime-500 shadow-xs flex flex-col justify-between transition-all"
              >
                <div>
                  <span
                    className={`inline-block text-[11px] font-extrabold px-2.5 py-0.5 rounded-md ${item.badgeClass}`}
                  >
                    {item.badge}
                  </span>
                  <h3 className="text-lg font-extrabold text-slate-900 mt-3">
                    {item.title}
                  </h3>
                  <p className="text-sm text-slate-600 mt-1.5 leading-relaxed">
                    {item.desc}
                  </p>
                </div>
                <span className="mt-5 inline-block text-xs font-black text-slate-900">
                  Buka Menu →
                </span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </RoleGuard>
  );
}
