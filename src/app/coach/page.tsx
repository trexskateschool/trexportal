"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import RoleGuard from "@/components/RoleGuard";

export default function CoachDashboardPage() {
  const { userProfile } = useAuth();
  const [studentCount, setStudentCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadCoachSummary() {
      try {
        const snap = await getDocs(collection(db, "students"));
        setStudentCount(snap.size);
      } catch (error) {
        console.error("Gagal memuat data murid coach:", error);
      } finally {
        setLoading(false);
      }
    }

    loadCoachSummary();
  }, []);

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
                  Jadwal Latihan Rutin: Sabtu, 16.00 – 18.00 WIB • Total Murid
                  Terdaftar:{" "}
                  <strong className="text-lime-400">
                    {loading ? "..." : `${studentCount} Anak`}
                  </strong>
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
          </div>
        </div>

        {/* Kartu Tugas Lapangan Coach */}
        <div className="max-w-5xl mx-auto px-4 sm:px-6 mt-8">
          <h2 className="text-lg font-extrabold text-slate-900 mb-4">
            Aktivitas Pelatihan &amp; Penilaian
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs">
              <span className="text-[11px] font-extrabold px-2.5 py-0.5 rounded-md bg-lime-200 text-slate-950">
                TUGAS MINGGUAN • FASE 5
              </span>
              <h3 className="text-lg font-extrabold text-slate-900 mt-3">
                Absensi Latihan Sabtu
              </h3>
              <p className="text-sm text-slate-600 mt-1.5 leading-relaxed">
                Catat kehadiran murid (Hadir, Izin, atau Tidak Hadir) langsung
                dari pinggir lapangan lewat HP.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs">
              <span className="text-[11px] font-extrabold px-2.5 py-0.5 rounded-md bg-blue-100 text-blue-900">
                EVALUASI SKILL • FASE 5
              </span>
              <h3 className="text-lg font-extrabold text-slate-900 mt-3">
                Input Perkembangan Anak
              </h3>
              <p className="text-sm text-slate-600 mt-1.5 leading-relaxed">
                Nilai penguasaan 8 materi teknik (Level 1–4) dan tulis catatan
                latihan untuk masing-masing murid.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs">
              <span className="text-[11px] font-extrabold px-2.5 py-0.5 rounded-md bg-slate-900 text-lime-400">
                EVALUASI BULANAN • FASE 5
              </span>
              <h3 className="text-lg font-extrabold text-slate-900 mt-3">
                Susun Draft Rapor
              </h3>
              <p className="text-sm text-slate-600 mt-1.5 leading-relaxed">
                Rangkum kemajuan bulanan dan rekomendasi materi berikutnya
                sebelum diterbitkan oleh Admin.
              </p>
            </div>
          </div>
        </div>
      </div>
    </RoleGuard>
  );
}
