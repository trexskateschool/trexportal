"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { collection, getDocs, query, where, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import RoleGuard from "@/components/RoleGuard";

interface StudentItem {
  id: string;
  studentCode: string;
  fullName: string;
  level: string;
  status: string;
}

interface ScheduleItem {
  id: string;
  date: string;
  title: string;
}

export default function AdminOrCoachDashboardPage() {
  const { firebaseUser, userProfile } = useAuth();
  const [students, setStudents] = useState<StudentItem[]>([]);
  const [schedules, setSchedules] = useState<ScheduleItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Statistik ringkas
  const [pendingPaymentsCount, setPendingPaymentsCount] = useState(0);

  useEffect(() => {
    async function loadDashboardData() {
      setLoading(true);
      try {
        const [studSnap, schedSnap, paySnap] = await Promise.all([
          getDocs(collection(db, "students")),
          getDocs(query(collection(db, "schedules"), orderBy("date", "desc"))),
          getDocs(
            query(
              collection(db, "payments"),
              where("status", "==", "pending_verification")
            )
          ),
        ]);

        const studList: StudentItem[] = [];
        studSnap.forEach((d) => {
          studList.push({
            id: d.id,
            ...(d.data() as Omit<StudentItem, "id">),
          });
        });

        const schedList: ScheduleItem[] = [];
        schedSnap.forEach((d) => {
          schedList.push({
            id: d.id,
            ...(d.data() as Omit<ScheduleItem, "id">),
          });
        });

        setStudents(studList);
        setSchedules(schedList);
        setPendingPaymentsCount(paySnap.size);
      } catch (error) {
        console.error("Gagal memuat data dashboard:", error);
      } finally {
        setLoading(false);
      }
    }

    loadDashboardData();
  }, []);

  return (
    <RoleGuard allowedRoles={["admin", "coach"]}>
      <div className="min-h-[88vh] bg-slate-50 pb-16">
        {/* Header Admin / Coach */}
        <div className="bg-slate-900 text-white border-b border-slate-800">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <span className="inline-block px-3 py-1 rounded-full bg-lime-400 text-slate-950 text-xs font-extrabold uppercase tracking-wider">
                  Panel Operasional Klub ({userProfile?.role?.toUpperCase() || "ADMIN"})
                </span>
                <h1 className="text-2xl sm:text-3xl font-black mt-3">
                  Halo, {userProfile?.name || "Admin / Coach"}
                </h1>
                <p className="text-sm text-slate-300 mt-1">
                  Email terdaftar:{" "}
                  <strong className="text-lime-400 font-mono">
                    {firebaseUser?.email}
                  </strong>
                </p>
              </div>

              {pendingPaymentsCount > 0 && (
                <Link
                  href="/admin/payments"
                  className="px-4 py-2.5 rounded-xl bg-amber-500 text-slate-950 font-black text-xs sm:text-sm animate-pulse"
                >
                  ⚠ {pendingPaymentsCount} Pembayaran Perlu Diverifikasi
                </Link>
              )}
            </div>
          </div>
        </div>

        {/* Konten Utama: Isi Absensi & Update Perkembangan Anak */}
        <div className="max-w-5xl mx-auto px-4 sm:px-6 mt-6 space-y-6">
          {/* Menu Pintas Aksi Cepat */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Aksi 1: Mengisi Absensi Anak */}
            <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs flex flex-col justify-between space-y-4">
              <div>
                <span className="text-xs font-extrabold px-2.5 py-1 rounded bg-blue-100 text-blue-900">
                  MENU UTAMA 01
                </span>
                <h2 className="text-xl font-black text-slate-900 mt-2">
                  Pengisian Absensi Anak
                </h2>
                <p className="text-xs sm:text-sm text-slate-600 mt-1 leading-relaxed">
                  Catat kehadiran peserta didik untuk sesi latihan rutin hari Sabtu (Hadir, Izin, atau Tidak Hadir).
                </p>
              </div>

              <Link
                href="/coach/attendance"
                className="w-full py-3 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-lime-400 font-extrabold text-xs sm:text-sm text-center transition-colors"
              >
                Buka Form Absensi Lapangan →
              </Link>
            </div>

            {/* Aksi 2: Mengupdate Perkembangan Anak */}
            <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs flex flex-col justify-between space-y-4">
              <div>
                <span className="text-xs font-extrabold px-2.5 py-1 rounded bg-lime-200 text-slate-950">
                  MENU UTAMA 02
                </span>
                <h2 className="text-xl font-black text-slate-900 mt-2">
                  Update Perkembangan Skill
                </h2>
                <p className="text-xs sm:text-sm text-slate-600 mt-1 leading-relaxed">
                  Perbarui tingkat penguasaan 8 materi skill anak, berikan catatan latihan, serta rekomendasi berikutnya.
                </p>
              </div>

              <Link
                href="/coach/reports"
                className="w-full py-3 px-4 rounded-xl bg-lime-400 hover:bg-lime-300 text-slate-950 font-extrabold text-xs sm:text-sm text-center transition-colors"
              >
                Buka Evaluasi &amp; Rapor Skill →
              </Link>
            </div>
          </div>

          {/* Daftar Ringkas Murid & Jadwal */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Daftar Murid Terdaftar */}
            <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-black text-slate-900 text-base">
                  Daftar Murid ({students.length})
                </h3>
                <Link
                  href="/admin/students"
                  className="text-xs font-bold text-blue-600 hover:underline"
                >
                  Kelola Data Murid →
                </Link>
              </div>

              {loading ? (
                <p className="text-xs text-slate-500">Memuat data murid...</p>
              ) : students.length === 0 ? (
                <p className="text-xs text-slate-500">Belum ada murid terdaftar.</p>
              ) : (
                <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                  {students.slice(0, 6).map((s) => (
                    <div
                      key={s.id}
                      className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between text-xs"
                    >
                      <div>
                        <p className="font-black text-slate-900">{s.fullName}</p>
                        <p className="text-slate-500 font-mono">
                          {s.studentCode} • {s.level}
                        </p>
                      </div>
                      <span
                        className={`font-bold px-2 py-0.5 rounded-full text-[10px] ${
                          s.status === "active"
                            ? "bg-lime-200 text-slate-950"
                            : "bg-amber-100 text-amber-900"
                        }`}
                      >
                        {s.status}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Jadwal Latihan Sabtu */}
            <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-black text-slate-900 text-base">
                  Jadwal Sesi Latihan
                </h3>
                <Link
                  href="/admin/schedules"
                  className="text-xs font-bold text-blue-600 hover:underline"
                >
                  Atur Jadwal →
                </Link>
              </div>

              {loading ? (
                <p className="text-xs text-slate-500">Memuat jadwal...</p>
              ) : schedules.length === 0 ? (
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs text-slate-600">
                  <p className="font-bold text-slate-900">Sabtu, 16.00 – 18.00 WIB</p>
                  <p className="text-slate-500 mt-0.5">Sesi latihan rutin mingguan klub.</p>
                </div>
              ) : (
                <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                  {schedules.slice(0, 4).map((sch) => (
                    <div
                      key={sch.id}
                      className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs"
                    >
                      <p className="font-black text-slate-900">{sch.title}</p>
                      <p className="text-slate-500 mt-0.5">Tanggal: {sch.date}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </RoleGuard>
  );
}
