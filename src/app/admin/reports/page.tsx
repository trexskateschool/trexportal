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
import { MasteryLevel } from "@/types/database";

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

type AttendanceStatus = "present" | "sick" | "excused";

interface StudentOption {
  id: string;
  fullName: string;
  studentCode: string;
  level: string;
  coachName: string;
}

interface ReportItem {
  id: string;
  studentId: string;
  studentName: string;
  studentCode: string;
  level: string;
  coachName: string;
  month: number;
  year: number;
  status: "draft" | "published";
  presentCount: number;
  sickCount: number;
  excusedCount: number;
  totalSessions: number;
  skills: Record<string, number>;
  masteredSkills: string[];
  developingSkills: string[];
  notes: string;
  nextRecommendation: string;
}

interface ProgressItem {
  id: string;
  studentId: string;
  studentName?: string;
  skillId: string;
  masteryLevel: MasteryLevel;
  date: string;
  notes?: string;
  nextRecommendation?: string;
}

interface AttendanceItem {
  id: string;
  studentId: string;
  studentName?: string;
  date: string;
  status: AttendanceStatus;
  notes?: string;
}

export default function AdminReportsAndEvaluationPage() {
  const [activeTab, setActiveTab] = useState<"rapor" | "evaluasi" | "absensi">(
    "rapor"
  );
  const [loading, setLoading] = useState(true);
  const [successMsg, setSuccessMsg] = useState("");

  // Data Master
  const [students, setStudents] = useState<StudentOption[]>([]);
  const [reports, setReports] = useState<ReportItem[]>([]);
  const [progressList, setProgressList] = useState<ProgressItem[]>([]);
  const [attendanceList, setAttendanceList] = useState<AttendanceItem[]>([]);

  // ==========================================
  // STATE TAB 1: RAPOR BULANAN
  // ==========================================
  const now = new Date();
  const [reportStudentId, setReportStudentId] = useState("");
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());
  const [reportStatus, setReportStatus] = useState<"published" | "draft">(
    "published"
  );
  const [reportNotes, setReportNotes] = useState("");
  const [reportRecommendation, setReportRecommendation] = useState("");
  const [creatingReport, setCreatingReport] = useState(false);
  const [previewReport, setPreviewReport] = useState<ReportItem | null>(null);

  // ==========================================
  // STATE TAB 2: EVALUASI 8 SKILL (SAMA DENGAN ORANG TUA)
  // ==========================================
  const [evalStudentId, setEvalStudentId] = useState("");
  const [editingEval, setEditingEval] = useState(false);
  const [evalDate, setEvalDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [evalScores, setEvalScores] = useState<Record<string, MasteryLevel>>({});
  const [evalNoteInput, setEvalNoteInput] = useState("");
  const [evalRecInput, setEvalRecInput] = useState("");
  const [savingEval, setSavingEval] = useState(false);

  // ==========================================
  // STATE TAB 3: ABSENSI PER SESI LATIHAN (HADIR, SAKIT, IZIN)
  // ==========================================
  const [sessionDate, setSessionDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [sessionStatuses, setSessionStatuses] = useState<
    Record<string, AttendanceStatus>
  >({});
  const [sessionNotes, setSessionNotes] = useState<Record<string, string>>({});
  const [savingAttendance, setSavingAttendance] = useState(false);
  const [filterAttendanceStudent, setFilterAttendanceStudent] = useState("ALL");

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
      const studentMap: Record<string, StudentOption> = {};

      studSnap.forEach((d) => {
        const data = d.data();
        const item: StudentOption = {
          id: d.id,
          fullName: data.fullName || "Tanpa Nama",
          studentCode: data.studentCode || "-",
          level: data.level || "Beginner",
          coachName: data.coachName || "Tim Coach TREX",
        };
        studentMap[d.id] = item;
        studList.push(item);
      });
      studList.sort((a, b) => a.fullName.localeCompare(b.fullName));

      const repList: ReportItem[] = [];
      repSnap.forEach((d) => {
        const data = d.data();
        const st = studentMap[data.studentId];
        repList.push({
          id: d.id,
          studentId: data.studentId,
          studentName: data.studentName || st?.fullName || "Murid",
          studentCode: data.studentCode || st?.studentCode || "-",
          level: data.level || st?.level || "Beginner",
          coachName: data.coachName || st?.coachName || "Tim Coach TREX",
          month: Number(data.month) || 1,
          year: Number(data.year) || now.getFullYear(),
          status: data.status === "published" ? "published" : "draft",
          presentCount: Number(data.presentCount) || 0,
          sickCount: Number(data.sickCount) || 0,
          excusedCount: Number(data.excusedCount) || 0,
          totalSessions: Number(data.totalSessions) || 0,
          skills: (data.skills as Record<string, number>) || {},
          masteredSkills: Array.isArray(data.masteredSkills)
            ? data.masteredSkills
            : [],
          developingSkills: Array.isArray(data.developingSkills)
            ? data.developingSkills
            : [],
          notes: data.notes || data.coachNotes || data.summary || "",
          nextRecommendation: data.nextRecommendation || "",
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
          studentName:
            data.studentName || studentMap[data.studentId]?.fullName || "Murid",
          skillId: data.skillId,
          masteryLevel: ([1, 2, 3, 4].includes(data.masteryLevel)
            ? data.masteryLevel
            : 1) as MasteryLevel,
          date: data.date || "",
          notes: data.notes || "",
          nextRecommendation: data.nextRecommendation || "",
        });
      });
      progItems.sort((a, b) => b.date.localeCompare(a.date));

      const attItems: AttendanceItem[] = [];
      attSnap.forEach((d) => {
        const data = d.data();
        const rawStatus = data.status;
        const normalizedStatus: AttendanceStatus =
          rawStatus === "sick"
            ? "sick"
            : rawStatus === "excused" || rawStatus === "absent"
            ? "excused"
            : "present";

        attItems.push({
          id: d.id,
          studentId: data.studentId,
          studentName:
            data.studentName || studentMap[data.studentId]?.fullName || "Murid",
          date: data.date || "",
          status: normalizedStatus,
          notes: data.notes || "",
        });
      });
      attItems.sort((a, b) => b.date.localeCompare(a.date));

      setStudents(studList);
      setReports(repList);
      setProgressList(progItems);
      setAttendanceList(attItems);

      if (studList.length > 0) {
        if (!reportStudentId) setReportStudentId(studList[0].id);
        if (!evalStudentId) setEvalStudentId(studList[0].id);
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

  // Sinkronkan form absensi setiap kali tanggal latihan atau data absensi berubah
  useEffect(() => {
    if (students.length === 0) return;
    const initialStatuses: Record<string, AttendanceStatus> = {};
    const initialNotes: Record<string, string> = {};

    students.forEach((st) => {
      const existing = attendanceList.find(
        (a) => a.studentId === st.id && a.date === sessionDate
      );
      initialStatuses[st.id] = existing ? existing.status : "present";
      initialNotes[st.id] = existing?.notes || "";
    });

    setSessionStatuses(initialStatuses);
    setSessionNotes(initialNotes);
  }, [sessionDate, students, attendanceList]);

  // Helper ambil status 8 skill terbaru untuk murid tertentu
  const getStudentLatestSkills = (studentId: string) => {
    const studentProg = progressList.filter((p) => p.studentId === studentId);
    return DEFAULT_SKILLS.map((skill) => {
      const found = studentProg.find((p) => p.skillId === skill.id);
      return {
        ...skill,
        masteryLevel: (found ? found.masteryLevel : 1) as MasteryLevel,
        lastUpdated: found?.date || null,
      };
    });
  };

  // ==========================================
  // HANDLER TAB 1: RAPOR BULANAN
  // ==========================================
  const handleCreateReport = async (e: FormEvent) => {
    e.preventDefault();
    if (!reportStudentId) return;

    const student = students.find((s) => s.id === reportStudentId);
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
      const sickCount = monthAttendance.filter(
        (a) => a.status === "sick"
      ).length;
      const excusedCount = monthAttendance.filter(
        (a) => a.status === "excused"
      ).length;
      const totalSessions = monthAttendance.length;

      const latestSkills = getStudentLatestSkills(student.id);
      const skillsMap: Record<string, number> = {};
      const masteredList: string[] = [];
      const developingList: string[] = [];

      latestSkills.forEach((sk) => {
        skillsMap[sk.id] = sk.masteryLevel;
        if (sk.masteryLevel >= 4) {
          masteredList.push(sk.name);
        } else {
          developingList.push(sk.name);
        }
      });

      const latestNoteObj = progressList.find(
        (p) => p.studentId === student.id && p.notes
      );
      const finalNotes =
        reportNotes.trim() ||
        latestNoteObj?.notes ||
        "Mengikuti sesi latihan dengan semangat.";
      const finalRec =
        reportRecommendation.trim() ||
        latestNoteObj?.nextRecommendation ||
        "Pertahankan keseimbangan dan kelancaran teknik dasar.";

      const newRef = doc(collection(db, "monthlyReports"));
      await setDoc(newRef, {
        studentId: student.id,
        studentName: student.fullName,
        studentCode: student.studentCode,
        level: student.level,
        coachName: student.coachName,
        month: selectedMonth,
        year: selectedYear,
        status: reportStatus,
        presentCount,
        sickCount,
        excusedCount,
        totalSessions,
        skills: skillsMap,
        masteredSkills: masteredList,
        developingSkills: developingList,
        notes: finalNotes,
        coachNotes: finalNotes,
        summary: finalNotes,
        nextRecommendation: finalRec,
        createdAt: serverTimestamp(),
      });

      setReportNotes("");
      setReportRecommendation("");
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
      if (previewReport?.id === id) setPreviewReport(null);
      setReports((prev) => prev.filter((r) => r.id !== id));
    } catch (error) {
      console.error("Gagal menghapus rapor:", error);
    }
  };

  // ==========================================
  // HANDLER TAB 2: EVALUASI 8 SKILL
  // ==========================================
  const startEditEvaluation = () => {
    if (!evalStudentId) return;
    const currentSkills = getStudentLatestSkills(evalStudentId);
    const map: Record<string, MasteryLevel> = {};
    currentSkills.forEach((sk) => {
      map[sk.id] = sk.masteryLevel;
    });
    const latestRec = progressList.find((p) => p.studentId === evalStudentId);
    setEvalScores(map);
    setEvalNoteInput(latestRec?.notes || "");
    setEvalRecInput(latestRec?.nextRecommendation || "");
    setEditingEval(true);
    setSuccessMsg("");
  };

  const handleSaveEvaluation = async (e: FormEvent) => {
    e.preventDefault();
    const student = students.find((s) => s.id === evalStudentId);
    if (!student) return;

    setSavingEval(true);
    setSuccessMsg("");

    try {
      await Promise.all(
        DEFAULT_SKILLS.map((skill) => {
          const level = evalScores[skill.id] || 1;
          const docId = `${student.id}_${skill.id}_${evalDate}`;
          return setDoc(doc(db, "progressRecords", docId), {
            studentId: student.id,
            studentName: student.fullName,
            skillId: skill.id,
            masteryLevel: level,
            date: evalDate,
            notes: evalNoteInput.trim(),
            nextRecommendation: evalRecInput.trim(),
            updatedAt: serverTimestamp(),
          });
        })
      );

      setEditingEval(false);
      setSuccessMsg(
        `Evaluasi 8 skill untuk ${student.fullName} (${evalDate}) berhasil diperbarui.`
      );
      await loadAllData();
    } catch (error) {
      console.error("Gagal menyimpan evaluasi skill:", error);
      alert("Gagal menyimpan evaluasi skill.");
    } finally {
      setSavingEval(false);
    }
  };

  // ==========================================
  // HANDLER TAB 3: ABSENSI TIAP LATIHAN (HADIR, SAKIT, IZIN)
  // ==========================================
  const handleSaveSessionAttendance = async (e: FormEvent) => {
    e.preventDefault();
    if (!sessionDate || students.length === 0) return;

    setSavingAttendance(true);
    setSuccessMsg("");

    try {
      await Promise.all(
        students.map((st) => {
          const status = sessionStatuses[st.id] || "present";
          const note = (sessionNotes[st.id] || "").trim();
          // ID deterministik agar tidak duplikat di tanggal yang sama
          const docId = `${st.id}_${sessionDate}`;

          return setDoc(doc(db, "attendance", docId), {
            studentId: st.id,
            studentName: st.fullName,
            date: sessionDate,
            status,
            notes: note,
            updatedAt: serverTimestamp(),
          });
        })
      );

      setSuccessMsg(
        `Absensi latihan tanggal ${sessionDate} untuk ${students.length} murid berhasil disimpan.`
      );
      await loadAllData();
    } catch (error) {
      console.error("Gagal menyimpan absensi latihan:", error);
      alert("Gagal menyimpan absensi latihan.");
    } finally {
      setSavingAttendance(false);
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

  // Data evaluasi aktif untuk murid terpilih di Tab 2
  const activeEvalStudent = students.find((s) => s.id === evalStudentId);
  const activeEvalSkills = evalStudentId
    ? getStudentLatestSkills(evalStudentId)
    : [];
  const activeEvalLatestNote = progressList.find(
    (p) => p.studentId === evalStudentId
  );

  // Filter daftar riwayat absensi di Tab 3
  const filteredAttendance =
    filterAttendanceStudent === "ALL"
      ? attendanceList
      : attendanceList.filter((a) => a.studentId === filterAttendanceStudent);

  const getAttendanceBadge = (status: AttendanceStatus) => {
    if (status === "present") {
      return {
        label: "HADIR",
        className: "bg-lime-100 text-slate-950",
      };
    }
    if (status === "sick") {
      return {
        label: "SAKIT",
        className: "bg-amber-100 text-amber-900",
      };
    }
    return {
      label: "IZIN",
      className: "bg-blue-100 text-blue-900",
    };
  };

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
              Isi absensi tiap sesi latihan (Hadir, Sakit, Izin), tinjau progres 8 skill murid, dan terbitkan rapor bulanan.
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
              onClick={() => {
                setActiveTab("rapor");
                setSuccessMsg("");
              }}
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
              onClick={() => {
                setActiveTab("evaluasi");
                setSuccessMsg("");
              }}
              className={`py-2.5 px-3 rounded-xl text-xs sm:text-sm font-extrabold transition-colors ${
                activeTab === "evaluasi"
                  ? "bg-white text-slate-950 shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Evaluasi 8 Skill
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveTab("absensi");
                setSuccessMsg("");
              }}
              className={`py-2.5 px-3 rounded-xl text-xs sm:text-sm font-extrabold transition-colors ${
                activeTab === "absensi"
                  ? "bg-white text-slate-950 shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Absensi Latihan
            </button>
          </div>

          {loading ? (
            <div className="p-8 rounded-2xl bg-white border border-slate-200 text-center text-sm text-slate-500">
              Memuat data evaluasi, absensi, dan rapor...
            </div>
          ) : activeTab === "rapor" ? (
            /* ========================================================
               TAB 1: RAPOR BULANAN + PRATINJAU DOKUMEN RESMI
               ======================================================== */
            <div className="space-y-6">
              {/* Modal / Panel Pratinjau Dokumen Rapor Resmi (Identik dengan Tampilan Orang Tua) */}
              {previewReport && (
                <div className="rounded-3xl bg-white border-2 border-slate-900 shadow-lg overflow-hidden">
                  <div className="bg-slate-900 text-white px-6 py-5 border-b-4 border-lime-400 flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <span className="w-11 h-11 rounded-xl bg-lime-400 text-slate-950 font-black text-base flex items-center justify-center shrink-0">
                        TX
                      </span>
                      <div>
                        <h2 className="text-lg font-black tracking-tight">
                          TREX SKATE SCHOOL
                        </h2>
                        <p className="text-[11px] font-extrabold text-lime-400 uppercase tracking-wider">
                          LAPORAN EVALUASI PERKEMBANGAN MURID
                        </p>
                        <span className="inline-block mt-1.5 px-2.5 py-0.5 rounded bg-slate-800 text-[10px] font-extrabold text-lime-300 uppercase">
                          PERIODE: {MONTH_NAMES[previewReport.month - 1]}{" "}
                          {previewReport.year}
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setPreviewReport(null)}
                      className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-200 shrink-0"
                    >
                      Tutup Dokumen ✕
                    </button>
                  </div>

                  <div className="p-6 space-y-6">
                    {/* Identitas Murid */}
                    <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="sm:col-span-2">
                        <p className="text-[10px] font-extrabold text-slate-400 uppercase">
                          NAMA LENGKAP MURID
                        </p>
                        <p className="text-xl font-black text-slate-900">
                          {previewReport.studentName}
                        </p>
                      </div>
                      <div>
                        <p className="text-[10px] font-extrabold text-slate-400 uppercase">
                          ID ANGGOTA
                        </p>
                        <p className="text-sm font-extrabold text-slate-900">
                          {previewReport.studentCode}
                        </p>
                      </div>
                      <div>
                        <p className="text-[10px] font-extrabold text-slate-400 uppercase">
                          LEVEL / KELAS
                        </p>
                        <p className="text-sm font-extrabold text-slate-900">
                          {previewReport.level}
                        </p>
                      </div>
                      <div>
                        <p className="text-[10px] font-extrabold text-slate-400 uppercase">
                          COACH PEMBINA
                        </p>
                        <p className="text-sm font-extrabold text-slate-900">
                          {previewReport.coachName}
                        </p>
                      </div>
                      <div>
                        <p className="text-[10px] font-extrabold text-slate-400 uppercase">
                          REKAP KEHADIRAN LATIHAN
                        </p>
                        <p className="text-sm font-extrabold text-blue-900">
                          Hadir {previewReport.presentCount} dari{" "}
                          {previewReport.totalSessions} Sesi (
                          {previewReport.totalSessions > 0
                            ? Math.round(
                                (previewReport.presentCount /
                                  previewReport.totalSessions) *
                                  100
                              )
                            : 0}
                          %)
                        </p>
                      </div>
                    </div>

                    {/* Tabel Capaian 8 Skill */}
                    <div className="space-y-3">
                      <h3 className="text-xs font-black uppercase tracking-wider text-slate-900">
                        1. CAPAIAN KURIKULUM KETERAMPILAN SKATING
                      </h3>
                      <div className="rounded-2xl border border-slate-200 overflow-hidden">
                        <div className="bg-slate-900 text-white px-4 py-3 grid grid-cols-12 text-[11px] font-extrabold uppercase">
                          <span className="col-span-2">NO</span>
                          <span className="col-span-5">MATERI KETERAMPILAN</span>
                          <span className="col-span-5 text-right">
                            TINGKAT PENGUASAAN
                          </span>
                        </div>
                        <div className="divide-y divide-slate-100">
                          {DEFAULT_SKILLS.map((sk) => {
                            const lvl = (previewReport.skills?.[sk.id] ||
                              getStudentLatestSkills(
                                previewReport.studentId
                              ).find((s) => s.id === sk.id)?.masteryLevel ||
                              1) as MasteryLevel;
                            const badge = MASTERY_LABELS[lvl];
                            return (
                              <div
                                key={sk.id}
                                className="px-4 py-3 grid grid-cols-12 items-center gap-2"
                              >
                                <span className="col-span-2 text-xs font-bold text-slate-500">
                                  {sk.order}
                                </span>
                                <span className="col-span-5 text-sm font-black text-slate-900">
                                  {sk.name}
                                </span>
                                <div className="col-span-5 text-right">
                                  <span
                                    className={`inline-block text-[11px] font-extrabold px-2.5 py-1 rounded-full border ${badge.colorClass}`}
                                  >
                                    {lvl}/4 • {badge.label}
                                  </span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>

                    {/* Materi Dikuasai & Pengembangan */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="p-4 rounded-2xl bg-lime-50 border border-lime-300 space-y-1">
                        <p className="text-[11px] font-black uppercase text-slate-900">
                          MATERI SUDAH DIKUASAI
                        </p>
                        <p className="text-xs text-slate-700 leading-relaxed">
                          {previewReport.masteredSkills.length > 0
                            ? previewReport.masteredSkills.join(", ")
                            : "Masih dalam tahap penguatan teknik dasar."}
                        </p>
                      </div>
                      <div className="p-4 rounded-2xl bg-slate-100 border border-slate-200 space-y-1">
                        <p className="text-[11px] font-black uppercase text-slate-900">
                          MATERI DALAM PENGEMBANGAN
                        </p>
                        <p className="text-xs text-slate-700 leading-relaxed">
                          {previewReport.developingSkills.length > 0
                            ? previewReport.developingSkills.join(", ")
                            : DEFAULT_SKILLS.map((s) => s.name).join(", ")}
                        </p>
                      </div>
                    </div>

                    {/* Catatan & Rekomendasi */}
                    <div className="space-y-2">
                      <h3 className="text-xs font-black uppercase tracking-wider text-slate-900">
                        2. CATATAN EVALUASI &amp; REKOMENDASI PELATIH
                      </h3>
                      <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                        <p className="text-sm text-slate-800">
                          {previewReport.notes ||
                            "Semangat latihannya terus ditingkatkan."}
                        </p>
                        {previewReport.nextRecommendation && (
                          <p className="text-xs text-slate-700 pt-2 border-t border-slate-200">
                            <strong>Rekomendasi Bulan Berikutnya:</strong>{" "}
                            {previewReport.nextRecommendation}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Footer Pengesahan */}
                    <div className="pt-4 border-t border-slate-200 flex items-end justify-between gap-4 text-xs">
                      <div className="text-slate-500 space-y-0.5">
                        <p>Dokumen Evaluasi Digital • Portal TREX Skate School</p>
                        <p>Jadwal Latihan Rutin: Sabtu, 16.00 – 18.00 WIB</p>
                      </div>
                      <div className="text-right">
                        <p className="text-slate-500">
                          Disahkan oleh Pelatih Pembina
                        </p>
                        <p className="text-sm font-black text-slate-900 mt-1">
                          {previewReport.coachName}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Form Buat Rapor Bulanan */}
              <form
                onSubmit={handleCreateReport}
                className="p-5 sm:p-7 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-4"
              >
                <div>
                  <h2 className="text-lg font-black text-slate-900">
                    Buat &amp; Terbitkan Rapor Bulanan Baru
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Rekap absensi dan nilai 8 skill terakhir murid akan ditarik otomatis ke dalam rapor.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Pilih Murid *
                    </label>
                    <select
                      value={reportStudentId}
                      onChange={(e) => setReportStudentId(e.target.value)}
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

                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Catatan Evaluasi Pelatih
                    </label>
                    <input
                      type="text"
                      value={reportNotes}
                      onChange={(e) => setReportNotes(e.target.value)}
                      placeholder="Kosongkan untuk memakai catatan evaluasi terakhir"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Rekomendasi Berikutnya
                    </label>
                    <input
                      type="text"
                      value={reportRecommendation}
