"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import RoleGuard from "@/components/RoleGuard";
import { MASTERY_LABELS } from "@/lib/constants";
import { MonthlyReport } from "@/types/database";

const MONTH_NAMES = [
  "Januari",
  "Februari",
  "Maret",
  "April",
  "Mei",
  "Juni",
  "Juli",
  "Agustus",
  "September",
  "Oktober",
  "November",
  "Desember",
];

export default function MonthlyReportDetailPage() {
  const params = useParams<{ reportId: string }>();
  const { firebaseUser, userProfile } = useAuth();
  const [report, setReport] = useState<MonthlyReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    async function loadReport() {
      if (!params?.reportId || !firebaseUser) return;
      setLoading(true);
      setErrorMsg("");

      try {
        const repSnap = await getDoc(
          doc(db, "monthlyReports", params.reportId)
        );
        if (!repSnap.exists()) {
          setErrorMsg("Dokumen rapor bulanan tidak ditemukan.");
          setLoading(false);
          return;
        }

        const repData = {
          id: repSnap.id,
          ...(repSnap.data() as Omit<MonthlyReport, "id">),
        };

        // Verifikasi tambahan untuk akun orang tua
        if (userProfile?.role === "parent") {
          const studentSnap = await getDoc(
            doc(db, "students", repData.studentId)
          );
          const parentUids: string[] = studentSnap.exists()
            ? studentSnap.data().parentUids || []
            : [];

          if (
            repData.status !== "published" ||
            !parentUids.includes(firebaseUser.uid)
          ) {
            setErrorMsg("Anda tidak memiliki izin melihat dokumen rapor ini.");
            setLoading(false);
            return;
          }
        }

        setReport(repData);
      } catch (error) {
        console.error("Gagal memuat rapor:", error);
        setErrorMsg("Terjadi kendala saat membuka dokumen rapor.");
      } finally {
        setLoading(false);
      }
    }

    loadReport();
  }, [params?.reportId, firebaseUser, userProfile?.role]);

  const backHref =
    userProfile?.role === "parent" ? "/parent" : "/coach/reports";

  return (
    <RoleGuard allowedRoles={["parent", "coach", "admin"]}>
      <div className="min-h-screen bg-slate-100 py-6 px-4 sm:px-6 pb-16">
        {/* Navigasi Kembali */}
        <div className="max-w-3xl mx-auto mb-5 flex items-center justify-between">
          <Link
            href={backHref}
            className="text-xs sm:text-sm font-bold text-slate-700 hover:text-slate-950"
          >
            ← Kembali ke Portal
          </Link>
        </div>

        {loading ? (
          <div className="max-w-3xl mx-auto p-10 bg-white rounded-2xl border border-slate-200 text-center text-sm text-slate-500">
            Menyiapkan lembar rapor resmi TREX Skate School...
          </div>
        ) : errorMsg || !report ? (
          <div className="max-w-3xl mx-auto p-8 bg-white rounded-2xl border border-red-200 text-sm text-red-800 font-semibold">
            {errorMsg || "Dokumen rapor tidak tersedia."}
          </div>
        ) : (
          /* Lembar Rapor Digital Resmi */
          <article className="max-w-3xl mx-auto bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            {/* Kop Rapor Klub */}
            <div className="bg-slate-900 text-white px-6 py-6 sm:px-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b-4 border-lime-400">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-xl bg-lime-400 text-slate-950 flex items-center justify-center font-black text-xl tracking-tighter shrink-0">
                  TX
                </div>
                <div>
                  <h1 className="text-xl sm:text-2xl font-black tracking-wide">
                    TREX SKATE SCHOOL
                  </h1>
                  <p className="text-xs text-lime-400 font-bold uppercase tracking-wider">
                    Laporan Evaluasi Perkembangan Murid
                  </p>
                </div>
              </div>

              <div className="sm:text-right">
                <span className="inline-block px-3 py-1 rounded-md bg-slate-800 text-lime-400 text-xs font-extrabold uppercase">
                  Periode: {MONTH_NAMES[report.month - 1]} {report.year}
                </span>
              </div>
            </div>

            <div className="p-6 sm:p-8 space-y-6">
              {/* Identitas Murid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200 text-sm">
                <div className="col-span-2">
                  <span className="block text-[11px] font-bold uppercase text-slate-400">
                    Nama Lengkap Murid
                  </span>
                  <span className="font-black text-slate-900 text-base">
                    {report.studentName}
                  </span>
                </div>
                <div>
                  <span className="block text-[11px] font-bold uppercase text-slate-400">
                    ID Anggota
                  </span>
                  <span className="font-mono font-bold text-slate-800">
                    {report.studentCode}
                  </span>
                </div>
                <div>
                  <span className="block text-[11px] font-bold uppercase text-slate-400">
                    Level / Kelas
                  </span>
                  <span className="font-bold text-slate-900">
                    {report.level}
                  </span>
                </div>
                <div className="col-span-2">
                  <span className="block text-[11px] font-bold uppercase text-slate-400">
                    Coach Pembina
                  </span>
                  <span className="font-bold text-slate-900">
                    {report.coachName}
                  </span>
                </div>
                <div className="col-span-2">
                  <span className="block text-[11px] font-bold uppercase text-slate-400">
                    Rekap Kehadiran Latihan
                  </span>
                  <span className="font-extrabold text-blue-900">
                    Hadir {report.presentCount} dari {report.totalSessions} Sesi
                    (
                    {Math.round(
                      (report.presentCount /
                        Math.max(1, report.totalSessions)) *
                        100
                    )}
                    %)
                  </span>
                </div>
              </div>

              {/* Tabel Penilaian 8 Keterampilan */}
              <div>
                <h2 className="text-sm font-extrabold uppercase tracking-wider text-slate-800 mb-3">
                  1. Capaian Kurikulum Keterampilan Skating
                </h2>
                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <table className="w-full text-left border-collapse text-sm">
                    <thead>
                      <tr className="bg-slate-900 text-white text-xs uppercase">
                        <th className="py-2.5 px-3.5 w-10">No</th>
                        <th className="py-2.5 px-3.5">Materi Keterampilan</th>
                        <th className="py-2.5 px-3.5 text-right">
                          Tingkat Penguasaan
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {report.skillSummary?.map((item, idx) => {
                        const badge = MASTERY_LABELS[item.masteryLevel];
                        return (
                          <tr key={item.skillId} className="bg-white">
                            <td className="py-2.5 px-3.5 font-bold text-slate-500">
                              {idx + 1}
                            </td>
                            <td className="py-2.5 px-3.5 font-bold text-slate-900">
                              {item.skillName}
                            </td>
                            <td className="py-2.5 px-3.5 text-right">
                              <span
                                className={`inline-block text-xs font-extrabold px-2.5 py-0.5 rounded-full border ${badge.colorClass}`}
                              >
                                {item.masteryLevel}/4 • {badge.label}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Ringkasan Kekuatan & Fokus */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-lime-50/70 border border-lime-300">
                  <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-900">
                    Materi Sudah Dikuasai
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-700 mt-1.5 leading-relaxed">
                    {report.masteredSkills && report.masteredSkills.length > 0
                      ? report.masteredSkills.join(", ")
                      : "Masih dalam tahap penguatan teknik dasar."}
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-blue-50/70 border border-blue-200">
                  <h3 className="text-xs font-extrabold uppercase tracking-wider text-blue-950">
                    Materi Dalam Pengembangan
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-700 mt-1.5 leading-relaxed">
                    {report.developingSkills &&
                    report.developingSkills.length > 0
                      ? report.developingSkills.join(", ")
                      : "Siap melanjutkan ke tahap berikutnya."}
                  </p>
                </div>
              </div>

              {/* Catatan & Rekomendasi Coach */}
              <div className="space-y-3">
                <h2 className="text-sm font-extrabold uppercase tracking-wider text-slate-800">
                  2. Catatan Evaluasi &amp; Rekomendasi Pelatih
                </h2>
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2 text-sm text-slate-800">
                  <p className="leading-relaxed">
                    {report.coachNotes ||
                      "Murid menunjukkan semangat berlatih yang baik selama sesi rutin Sabtu."}
                  </p>
                  {report.nextRecommendation && (
                    <p className="pt-2 border-t border-slate-200 text-xs sm:text-sm">
                      <strong className="text-slate-950">
                        Rekomendasi Bulan Berikutnya:
                      </strong>{" "}
                      {report.nextRecommendation}
                    </p>
                  )}
                </div>
              </div>

              {/* Pengesahan Rapor */}
              <div className="pt-4 border-t border-slate-200 flex items-end justify-between text-xs text-slate-500">
                <div>
                  <p>Dokumen Evaluasi Digital • Portal TREX Skate School</p>
                  <p>Jadwal Latihan Rutin: Sabtu, 16.00 – 18.00 WIB</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-slate-800">
                    Disahkan oleh Pelatih Pembina
                  </p>
                  <p className="mt-6 font-black text-slate-950 text-sm">
                    {report.coachName}
                  </p>
                </div>
              </div>
            </div>
          </article>
        )}
      </div>
    </RoleGuard>
  );
}
