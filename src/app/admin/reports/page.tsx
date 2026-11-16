"use client";

import { useEffect, useState, FormEvent } from "react";
import Link from "next/link";
import {
  collection,
  doc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import RoleGuard from "@/components/RoleGuard";
import { DEFAULT_SKILLS, MASTERY_LABELS } from "@/lib/constants";

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

interface StudentOption {
  id: string;
  fullName: string;
  studentCode: string;
  level: string;
}

interface ReportItem {
  id: string;
  studentId: string;
  studentName: string;
  month: number;
  year: number;
  status: "draft" | "published";
  presentCount: number;
  totalSessions: number;
  masteredSkills: string[];
  notes?: string;
}

interface ProgressItem {
  id: string;
  studentId: string;
  studentName?: string;
  skillId: string;
  masteryLevel: 1 | 2 | 3 | 4;
  date: string;
  notes?: string;
  nextRecommendation?: string;
}

interface AttendanceItem {
  id: string;
  studentId: string;
  studentName?: string;
  date: string;
  status: "present" | "excused" | "absent";
  notes?: string;
}

export default function AdminReportsAndEvaluationPage() {
  const [activeTab, setActiveTab] = useState<"rapor" | "evaluasi" | "absensi">(
    "rapor"
  );
  const [loading, setLoading] = useState(true);
  const [successMsg, setSuccessMsg] = useState("");

  // Data master
  const [students, setStudents] = useState<StudentOption[]>([]);
  const [reports, setReports] = useState<ReportItem[]>([]);
  const [progressList, setProgressList] = useState<ProgressItem[]>([]);
  const [attendanceList, setAttendanceList] = useState<AttendanceItem[]>([]);

  // Filter murid untuk tab Evaluasi & Absensi
  const [filterStudentId, setFilterStudentId] = useState("ALL");

  // Form buat rapor bulanan
  const now = new Date();
  const [selectedStudentId, setSelectedStudentId] = useState("");
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());
  const [reportStatus, setReportStatus] = useState<"published" | "draft">(
    "published"
  );
  const [reportNotes, setReportNotes] = useState("");
  const [creatingReport, setCreatingReport] = useState(false);

  const loadAllData = async () => {
    setLoading(true);
    try {
      const [studSnap, repSnap, progSnap, attSnap] = await Promise.all([
        getDocs(collection(db, "students")),
        getDocs(collection(db, "monthlyReports")),
        getDocs(collection(db, "progressRecords")),
        getDocs(collection(db, "attendance")),
      ]);

      const studList: StudentOption[] = [];
      const nameMap: Record<string, string> = {};

      studSnap.forEach((d) => {
        const data = d.data();
        const fullName = data.fullName || "Tanpa Nama";
        nameMap[d.id] = fullName;
        studList.push({
          id: d.id,
          fullName,
          studentCode: data.studentCode || "-",
          level: data.level || "Pemula",
        });
      });
      studList.sort((a, b) => a.fullName.localeCompare(b.fullName));

      const repList: ReportItem[] = [];
      repSnap.forEach((d) => {
        const data = d.data();
        repList.push({
          id: d.id,
          studentId: data.studentId,
          studentName: data.studentName || nameMap[data.studentId] || "Murid",
          month: Number(data.month) || 1,
          year: Number(data.year) || now.getFullYear(),
          status: data.status === "published" ? "published" : "draft",
          presentCount: Number(data.presentCount) || 0,
          totalSessions: Number(data.totalSessions) || 0,
          masteredSkills: Array.isArray(data.masteredSkills)
            ? data.masteredSkills
            : [],
          notes: data.notes || data.summary || "",
        });
      });
      repList.sort((a, b) => {
        if (b.year !== a.year) return b.year - a.year;
        return b.month - a.month;
      });

      const progItems: ProgressItem[] = [];
      progSnap.forEach((d) => {
        const data = d.data();
        progItems.push({
          id: d.id,
          studentId: data.studentId,
          studentName: data.studentName || nameMap[data.studentId] || "Murid",
          skillId: data.skillId,
          masteryLevel: ([1, 2, 3, 4].includes(data.masteryLevel)
            ? data.masteryLevel
            : 1) as 1 | 2 | 3 | 4,
          date: data.date || "",
          notes: data.notes || "",
          nextRecommendation: data.nextRecommendation || "",
        });
      });
      progItems.sort((a, b) => b.date.localeCompare(a.date));

      const attItems: AttendanceItem[] = [];
      attSnap.forEach((d) => {
        const data = d.data();
        attItems.push({
          id: d.id,
          studentId: data.studentId,
          studentName: data.studentName || nameMap[data.studentId] || "Murid",
          date: data.date || "",
          status: data.status || "present",
          notes: data.notes || "",
        });
      });
      attItems.sort((a, b) => b.date.localeCompare(a.date));

      setStudents(studList);
      setReports(repList);
      setProgressList(progItems);
      setAttendanceList(attItems);

      if (studList.length > 0 && !selectedStudentId) {
        setSelectedStudentId(studList[0].id);
      }
    } catch (error) {
      console.error("Gagal memuat data evaluasi & rapor:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleCreateReport = async (e: FormEvent) => {
    e.preventDefault();
    if (!selectedStudentId) return;

    const student = students.find((s) => s.id === selectedStudentId);
    if (!student) return;

    setCreatingReport(true);
    setSuccessMsg("");

    try {
      const monthPrefix = `${selectedYear}-${String(selectedMonth).padStart(
        2,
        "0"
      )}`;

      const monthAttendance = attendanceList.filter(
        (a) => a.studentId === student.id && a.date.startsWith(monthPrefix)
      );
      const presentCount = monthAttendance.filter(
        (a) => a.status === "present"
      ).length;
      const totalSessions = monthAttendance.length;

      const studentProgress = progressList.filter(
        (p) => p.studentId === student.id
      );
      const masteredSet = new Set<string>();
      DEFAULT_SKILLS.forEach((skill) => {
        const latest = studentProgress.find((p) => p.skillId === skill.id);
        if (latest && latest.masteryLevel >= 3) {
          masteredSet.add(skill.name);
        }
      });

      const newRef = doc(collection(db, "monthlyReports"));
      await setDoc(newRef, {
        studentId: student.id,
        studentName: student.fullName,
        month: selectedMonth,
        year: selectedYear,
        status: reportStatus,
        presentCount,
        totalSessions,
        masteredSkills: Array.from(masteredSet),
        notes: reportNotes.trim(),
        createdAt: serverTimestamp(),
      });

      setReportNotes("");
      setSuccessMsg(
        `Rapor bulan ${MONTH_NAMES[selectedMonth - 1]} ${selectedYear} untuk ${
          student.fullName
        } berhasil disimpan.`
      );
      await loadAllData();
    } catch (error) {
      console.error("Gagal membuat rapor:", error);
      alert("Gagal menyimpan rapor bulanan. Periksa Firestore Rules Anda.");
    } finally {
      setCreatingReport(false);
    }
  };

  const handleToggleReportStatus = async (rep: ReportItem) => {
    const nextStatus = rep.status === "published" ? "draft" : "published";
    try {
      await updateDoc(doc(db, "monthlyReports", rep.id), {
        status: nextStatus,
        updatedAt: serverTimestamp(),
      });
      setReports((prev) =>
        prev.map((item) =>
          item.id === rep.id ? { ...item, status: nextStatus } : item
        )
      );
    } catch (error) {
      console.error("Gagal mengubah status rapor:", error);
    }
  };

  const handleDeleteReport = async (id: string, studentName: string) => {
    if (!window.confirm(`Hapus rapor milik ${studentName}?`)) return;
    try {
      await deleteDoc(doc(db, "monthlyReports", id));
      setReports((prev) => prev.filter((r) => r.id !== id));
    } catch (error) {
      console.error("Gagal menghapus rapor:", error);
    }
  };

  const handleDeleteProgress = async (id: string) => {
    if (!window.confirm("Hapus catatan evaluasi ini?")) return;
    try {
      await deleteDoc(doc(db, "progressRecords", id));
      setProgressList((prev) => prev.filter((p) => p.id !== id));
    } catch (error) {
      console.error("Gagal menghapus evaluasi:", error);
    }
  };

  const handleDeleteAttendance = async (id: string) => {
    if (!window.confirm("Hapus catatan absensi ini?")) return;
    try {
      await deleteDoc(doc(db, "attendance", id));
      setAttendanceList((prev) => prev.filter((a) => a.id !== id));
    } catch (error) {
      console.error("Gagal menghapus absensi:", error);
    }
  };

  const getSkillName = (skillId: string) => {
    const found = DEFAULT_SKILLS.find((s) => s.id === skillId);
    return found ? found.name : skillId;
  };

  const filteredProgress =
    filterStudentId === "ALL"
      ? progressList
      : progressList.filter((p) => p.studentId === filterStudentId);

  const filteredAttendance =
    filterStudentId === "ALL"
      ? attendanceList
      : attendanceList.filter((a) => a.studentId === filterStudentId);

  return (
    <RoleGuard allowedRoles={["admin"]}>
      <div className="min-h-[85vh] bg-slate-50 pb-16">
        {/* Header */}
        <div className="bg-slate-900 text-white border-b border-slate-800">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 py-7">
            <Link
              href="/admin"
              className="text-xs font-bold text-lime-400 hover:underline"
            >
              ← Kembali ke Dashboard Admin
            </Link>
            <h1 className="text-2xl sm:text-3xl font-black mt-3">
              Evaluasi, Absensi &amp; Rapor Bulanan Murid
            </h1>
            <p className="text-sm text-slate-300 mt-1">
              Pantau hasil penilaian lapangan dari Coach, rekap kehadiran Sabtu, dan terbitkan rapor ke portal orang tua.
            </p>
          </div>
        </div>

        <div className="max-w-5xl mx-auto px-4 sm:px-6 mt-6 space-y-6">
          {successMsg && (
            <div className="p-4 rounded-xl bg-lime-100 border border-lime-400 text-slate-950 text-sm font-bold">
              ✓ {successMsg}
            </div>
          )}

          {/* Tab Navigasi */}
          <div className="grid grid-cols-3 gap-2 bg-slate-200/70 p-1.5 rounded-2xl">
            <button
              type="button"
              onClick={() => setActiveTab("rapor")}
              className={`py-2.5 px-3 rounded-xl text-xs sm:text-sm font-extrabold transition-colors ${
                activeTab === "rapor"
                  ? "bg-white text-slate-950 shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Rapor Bulanan ({reports.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("evaluasi")}
              className={`py-2.5 px-3 rounded-xl text-xs sm:text-sm font-extrabold transition-colors ${
                activeTab === "evaluasi"
                  ? "bg-white text-slate-950 shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Evaluasi Skill ({progressList.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("absensi")}
              className={`py-2.5 px-3 rounded-xl text-xs sm:text-sm font-extrabold transition-colors ${
                activeTab === "absensi"
                  ? "bg-white text-slate-950 shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Rekap Absensi ({attendanceList.length})
            </button>
          </div>

          {loading ? (
            <div className="p-8 rounded-2xl bg-white border border-slate-200 text-center text-sm text-slate-500">
              Memuat data evaluasi, absensi, dan rapor...
            </div>
          ) : activeTab === "rapor" ? (
            <div className="space-y-6">
              {/* Form Generate Rapor Bulanan */}
              <form
                onSubmit={handleCreateReport}
                className="p-5 sm:p-7 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-4"
              >
                <h2 className="text-lg font-black text-slate-900">
                  Buat &amp; Terbitkan Rapor Bulanan Baru
                </h2>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Pilih Murid *
                    </label>
                    <select
                      value={selectedStudentId}
                      onChange={(e) => setSelectedStudentId(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-bold bg-white"
                    >
                      {students.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.fullName} ({s.level})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Bulan *
                    </label>
                    <select
                      value={selectedMonth}
                      onChange={(e) => setSelectedMonth(Number(e.target.value))}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-bold bg-white"
                    >
                      {MONTH_NAMES.map((m, idx) => (
                        <option key={m} value={idx + 1}>
                          {m}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Tahun *
                    </label>
                    <input
                      type="number"
                      value={selectedYear}
                      onChange={(e) => setSelectedYear(Number(e.target.value))}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-bold"
                    />
                  </div>

                  <div className="sm:col-span-2 lg:col-span-3">
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Catatan Evaluasi Bulanan
                    </label>
                    <input
                      type="text"
                      value={reportNotes}
                      onChange={(e) => setReportNotes(e.target.value)}
                      placeholder="Contoh: Keseimbangan meningkat pesat, siap naik ke materi crossover."
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Status Publikasi
                    </label>
                    <select
                      value={reportStatus}
                      onChange={(e) =>
                        setReportStatus(
                          e.target.value as "published" | "draft"
                        )
                      }
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-bold bg-white"
                    >
                      <option value="published">Terbitkan Langsung</option>
                      <option value="draft">Simpan Draft</option>
                    </select>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={creatingReport || students.length === 0}
                  className="px-6 py-3 rounded-xl bg-lime-400 hover:bg-lime-300 text-slate-950 font-extrabold text-sm transition-colors disabled:opacity-60"
                >
                  {creatingReport ? "Menyimpan Rapor..." : "+ Buat Rapor Bulanan"}
                </button>
              </form>

              {/* Daftar Rapor Bulanan */}
              <div className="space-y-3">
                <h2 className="text-base font-extrabold text-slate-900">
                  Daftar Rapor Murid ({reports.length})
                </h2>

                {reports.length === 0 ? (
                  <div className="p-6 rounded-2xl bg-white border border-slate-200 text-sm text-slate-500">
                    Belum ada rapor bulanan yang dibuat.
                  </div>
                ) : (
                  reports.map((rep) => (
                    <div
                      key={rep.id}
                      className="p-5 rounded-2xl bg-white border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                    >
                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span
                            className={`text-[11px] font-extrabold px-2.5 py-0.5 rounded ${
                              rep.status === "published"
                                ? "bg-lime-200 text-slate-950"
                                : "bg-amber-100 text-amber-900"
                            }`}
                          >
                            {rep.status === "published"
                              ? "TERBIT KE ORANG TUA"
                              : "DRAFT"}
                          </span>
                          <span className="text-xs font-bold text-slate-500">
                            {MONTH_NAMES[rep.month - 1]} {rep.year}
                          </span>
                        </div>
                        <h3 className="text-base font-black text-slate-900">
                          {rep.studentName}
                        </h3>
                        <p className="text-xs text-slate-600">
                          Kehadiran: <strong>{rep.presentCount}</strong> dari{" "}
                          <strong>{rep.totalSessions}</strong> sesi • Skill
                          Dikuasai:{" "}
                          <strong>{rep.masteredSkills.length}</strong> materi
                        </p>
                        {rep.notes && (
                          <p className="text-xs text-slate-500">
                            Catatan: {rep.notes}
                          </p>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleToggleReportStatus(rep)}
                          className="px-3.5 py-1.5 rounded-lg bg-slate-900 text-lime-400 text-xs font-bold hover:bg-slate-800"
                        >
                          {rep.status === "published"
                            ? "Tarik ke Draft"
                            : "Terbitkan"}
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            handleDeleteReport(rep.id, rep.studentName)
                          }
                          className="px-3.5 py-1.5 rounded-lg bg-red-50 text-red-700 text-xs font-bold hover:bg-red-100"
                        >
                          Hapus
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          ) : activeTab === "evaluasi" ? (
            <div className="space-y-4">
              {/* Filter Murid */}
              <div className="p-4 rounded-2xl bg-white border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <span className="text-xs font-extrabold text-slate-700">
                  Filter Berdasarkan Nama Murid:
                </span>
                <select
                  value={filterStudentId}
                  onChange={(e) => setFilterStudentId(e.target.value)}
                  className="px-3.5 py-2 rounded-xl border border-slate-300 text-xs sm:text-sm font-bold bg-white"
                >
                  <option value="ALL">Semua Murid ({progressList.length})</option>
                  {students.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.fullName}
                    </option>
                  ))}
                </select>
              </div>

              {filteredProgress.length === 0 ? (
                <div className="p-6 rounded-2xl bg-white border border-slate-200 text-sm text-slate-500">
                  Belum ada catatan evaluasi skill dari Coach.
                </div>
              ) : (
                filteredProgress.map((item) => {
                  const badge = MASTERY_LABELS[item.masteryLevel];
                  return (
                    <div
                      key={item.id}
                      className="p-5 rounded-2xl bg-white border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      <div className="space-y-1">
                        <span className="text-xs font-bold text-slate-400">
                          Tanggal Evaluasi: {item.date}
                        </span>
                        <h3 className="text-base font-black text-slate-900">
                          {item.studentName} — {getSkillName(item.skillId)}
                        </h3>
                        {item.notes && (
                          <p className="text-xs text-slate-600">
                            Catatan Coach: {item.notes}
                          </p>
                        )}
                        {item.nextRecommendation && (
                          <p className="text-xs text-blue-800 font-semibold">
                            Rekomendasi: {item.nextRecommendation}
                          </p>
                        )}
                      </div>

                      <div className="flex items-center gap-2 self-start sm:self-center shrink-0">
                        <span
                          className={`text-xs font-extrabold px-3 py-1.5 rounded-full border ${badge.colorClass}`}
                        >
                          Level {item.masteryLevel}/4 • {badge.label}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleDeleteProgress(item.id)}
                          className="px-2.5 py-1.5 rounded-lg bg-red-50 text-red-700 text-xs font-bold hover:bg-red-100"
                        >
                          Hapus
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {/* Filter Murid */}
              <div className="p-4 rounded-2xl bg-white border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <span className="text-xs font-extrabold text-slate-700">
                  Filter Berdasarkan Nama Murid:
                </span>
                <select
                  value={filterStudentId}
                  onChange={(e) => setFilterStudentId(e.target.value)}
                  className="px-3.5 py-2 rounded-xl border border-slate-300 text-xs sm:text-sm font-bold bg-white"
                >
                  <option value="ALL">
                    Semua Murid ({attendanceList.length})
                  </option>
                  {students.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.fullName}
                    </option>
                  ))}
                </select>
              </div>

              {filteredAttendance.length === 0 ? (
                <div className="p-6 rounded-2xl bg-white border border-slate-200 text-sm text-slate-500">
                  Belum ada data absensi latihan yang tercatat.
                </div>
              ) : (
                filteredAttendance.map((att) => (
                  <div
                    key={att.id}
                    className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200 flex items-center justify-between gap-3"
                  >
                    <div>
                      <p className="text-xs font-bold text-slate-400">
                        Tanggal: {att.date}
                      </p>
                      <h3 className="text-base font-black text-slate-900">
                        {att.studentName}
                      </h3>
                      {att.notes && (
                        <p className="text-xs text-slate-600 mt-0.5">
                          Catatan: {att.notes}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span
                        className={`text-xs font-extrabold px-3 py-1 rounded-full ${
                          att.status === "present"
                            ? "bg-lime-100 text-slate-950"
                            : att.status === "excused"
                            ? "bg-amber-100 text-amber-900"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {att.status === "present"
                          ? "HADIR"
                          : att.status === "excused"
                          ? "IZIN"
                          : "TIDAK HADIR"}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleDeleteAttendance(att.id)}
                        className="px-2.5 py-1 rounded-lg bg-red-50 text-red-700 text-xs font-bold hover:bg-red-100"
                      >
                        Hapus
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </RoleGuard>
  );
}
