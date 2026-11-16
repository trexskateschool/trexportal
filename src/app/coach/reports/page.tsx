"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  collection,
  getDocs,
  doc,
  getDoc,
  setDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import RoleGuard from "@/components/RoleGuard";
import { DEFAULT_SKILLS, MASTERY_LABELS } from "@/lib/constants";
import {
  MasteryLevel,
  MonthlyReport,
  ProgressRecord,
  ReportSkillItem,
  ReportStatus,
  StudentProfile,
} from "@/types/database";

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

export default function CoachReportsPage() {
  const { firebaseUser, userProfile } = useAuth();
  const now = new Date();

  const [students, setStudents] = useState<StudentProfile[]>([]);
  const [selectedStudentId, setSelectedStudentId] = useState("");
  const [month, setMonth] = useState<number>(now.getMonth() + 1);
  const [year, setYear] = useState<number>(now.getFullYear());

  // Isi formulir rapor
  const [presentCount, setPresentCount] = useState<number>(0);
  const [totalSessions, setTotalSessions] = useState<number>(4);
  const [skillLevels, setSkillLevels] = useState<Record<string, MasteryLevel>>(
    {}
  );
  const [coachNotes, setCoachNotes] = useState("");
  const [nextRecommendation, setNextRecommendation] = useState("");
  const [currentReportStatus, setCurrentReportStatus] = useState<
    ReportStatus | "new"
  >("new");

  const [monthReports, setMonthReports] = useState<MonthlyReport[]>([]);
  const [loadingInit, setLoadingInit] = useState(true);
  const [loadingForm, setLoadingForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState("");

  const isAdmin = userProfile?.role === "admin";

  // Muat daftar murid
  useEffect(() => {
    async function loadStudents() {
      try {
        const snap = await getDocs(
          query(collection(db, "students"), orderBy("fullName", "asc"))
        );
        const list: StudentProfile[] = [];
        snap.forEach((d) => {
          list.push({
            id: d.id,
            ...(d.data() as Omit<StudentProfile, "id">),
          });
        });
        setStudents(list);
        if (list.length > 0) {
          setSelectedStudentId(list[0].id);
        }
      } catch (error) {
        console.error("Gagal memuat murid:", error);
      } finally {
        setLoadingInit(false);
      }
    }

    loadStudents();
  }, []);

  // Muat daftar semua rapor pada bulan & tahun terpilih
  const loadMonthlyOverview = async (targetMonth: number, targetYear: number) => {
    try {
      const q = query(
        collection(db, "monthlyReports"),
        where("year", "==", targetYear)
      );
      const snap = await getDocs(q);
      const list: MonthlyReport[] = [];
      snap.forEach((d) => {
        const data = d.data() as Omit<MonthlyReport, "id">;
        if (data.month === targetMonth) {
          list.push({ id: d.id, ...data });
        }
      });
      setMonthReports(list);
    } catch (error) {
      console.error("Gagal memuat rekap rapor bulan ini:", error);
    }
  };

  // Muat atau hitung otomatis data rapor murid untuk bulan & tahun terpilih
  useEffect(() => {
    async function prepareReportForm() {
      if (!selectedStudentId) return;
      setLoadingForm(true);
      setFeedbackMsg("");

      const paddedMonth = String(month).padStart(2, "0");
      const monthPrefix = `${year}-${paddedMonth}`;
      const reportId = `${monthPrefix}_${selectedStudentId}`;

      try {
        await loadMonthlyOverview(month, year);

        const existingSnap = await getDoc(doc(db, "monthlyReports", reportId));
        if (existingSnap.exists()) {
          const data = existingSnap.data() as MonthlyReport;
          setPresentCount(data.presentCount);
          setTotalSessions(data.totalSessions);
          setCoachNotes(data.coachNotes || "");
          setNextRecommendation(data.nextRecommendation || "");
          setCurrentReportStatus(data.status);

          const mapFromReport: Record<string, MasteryLevel> = {};
          DEFAULT_SKILLS.forEach((s) => {
            const item = data.skillSummary?.find((i) => i.skillId === s.id);
            mapFromReport[s.id] = item ? item.masteryLevel : 1;
          });
          setSkillLevels(mapFromReport);
        } else {
          // Hitung otomatis kehadiran & ambil skor evaluasi skill terakhir
          const [attSnap, progSnap] = await Promise.all([
            getDocs(
              query(
                collection(db, "attendance"),
                where("studentId", "==", selectedStudentId)
              )
            ),
            getDocs(
              query(
                collection(db, "progressRecords"),
                where("studentId", "==", selectedStudentId)
              )
            ),
          ]);

          let present = 0;
          let sessions = 0;
          attSnap.forEach((d) => {
            const att = d.data();
            if (typeof att.date === "string" && att.date.startsWith(monthPrefix)) {
              sessions += 1;
              if (att.status === "present") present += 1;
            }
          });

          const records: ProgressRecord[] = [];
          progSnap.forEach((d) => {
            records.push({
              id: d.id,
              ...(d.data() as Omit<ProgressRecord, "id">),
            });
          });
          records.sort((a, b) => b.date.localeCompare(a.date));

          const autoSkillMap: Record<string, MasteryLevel> = {};
          DEFAULT_SKILLS.forEach((s) => {
            const found = records.find((r) => r.skillId === s.id);
            autoSkillMap[s.id] = found ? found.masteryLevel : 1;
          });

          setPresentCount(present);
          setTotalSessions(sessions > 0 ? sessions : 4);
          setSkillLevels(autoSkillMap);
          setCoachNotes(records[0]?.notes || "");
          setNextRecommendation(records[0]?.nextRecommendation || "");
          setCurrentReportStatus("new");
        }
      } catch (error) {
        console.error("Gagal menyiapkan rapor:", error);
      } finally {
        setLoadingForm(false);
      }
    }

    prepareReportForm();
  }, [selectedStudentId, month, year]);

  const handleSaveReport = async (targetStatus: ReportStatus) => {
    const student = students.find((s) => s.id === selectedStudentId);
    if (!student || !firebaseUser) return;

    setSaving(true);
    setFeedbackMsg("");

    try {
      const paddedMonth = String(month).padStart(2, "0");
      const reportId = `${year}-${paddedMonth}_${student.id}`;

      const skillSummary: ReportSkillItem[] = DEFAULT_SKILLS.map((s) => ({
        skillId: s.id,
        skillName: s.name,
        masteryLevel: skillLevels[s.id] || 1,
      }));

      const masteredSkills = skillSummary
        .filter((s) => s.masteryLevel === 4)
        .map((s) => s.skillName);

      const developingSkills = skillSummary
        .filter((s) => s.masteryLevel === 2 || s.masteryLevel === 3)
        .map((s) => s.skillName);

      const payload: Record<string, unknown> = {
        studentId: student.id,
        studentName: student.fullName,
        studentCode: student.studentCode,
        level: student.level,
        coachId: firebaseUser.uid,
        coachName: userProfile?.name || student.coachName || "Coach TREX",
        month,
        year,
        presentCount: Number(presentCount) || 0,
        totalSessions: Number(totalSessions) || 4,
        skillSummary,
        masteredSkills,
        developingSkills,
        coachNotes: coachNotes.trim(),
        nextRecommendation: nextRecommendation.trim(),
        status: targetStatus,
        createdAt: serverTimestamp(),
      };

      if (targetStatus === "published") {
        payload.publishedAt = serverTimestamp();
        payload.publishedBy = userProfile?.name || "Admin TREX";
      }

      await setDoc(doc(db, "monthlyReports", reportId), payload, {
        merge: true,
      });

      setCurrentReportStatus(targetStatus);
      await loadMonthlyOverview(month, year);

      setFeedbackMsg(
        targetStatus === "published"
          ? `✓ Rapor ${MONTH_NAMES[month - 1]} ${year} untuk ${
              student.fullName
            } resmi DITERBITKAN ke portal orang tua!`
          : `✓ Draft rapor ${MONTH_NAMES[month - 1]} ${year} untuk ${
              student.fullName
            } berhasil disimpan.`
      );
    } catch (error) {
      console.error("Gagal menyimpan rapor:", error);
      alert("Gagal menyimpan rapor bulanan. Periksa koneksi Anda.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <RoleGuard allowedRoles={["coach", "admin"]}>
      <div className="min-h-[85vh] bg-slate-50 pb-16">
        {/* Header */}
        <div className="bg-slate-900 text-white border-b border-slate-800">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 py-7">
            <Link
              href={isAdmin ? "/admin" : "/coach"}
              className="text-xs font-bold text-lime-400 hover:underline"
            >
              ← Kembali ke Dashboard
            </Link>
            <h1 className="text-2xl sm:text-3xl font-black mt-3">
              Rapor Perkembangan Bulanan
            </h1>
            <p className="text-sm text-slate-300 mt-1">
              Susun evaluasi bulanan otomatis dari data kehadiran &amp; progres
              skill murid.
            </p>
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-4 sm:px-6 mt-6 space-y-6">
          {loadingInit ? (
            <div className="p-8 rounded-2xl bg-white border border-slate-200 text-center text-sm text-slate-500">
              Memuat data murid...
            </div>
          ) : students.length === 0 ? (
            <div className="p-6 rounded-2xl bg-white border border-slate-200 text-sm text-slate-600">
              Belum ada data murid terdaftar di sistem.
            </div>
          ) : (
            <>
              {/* Filter Murid, Bulan, Tahun */}
              <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs grid grid-cols-1 sm:grid-cols-4 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-600 mb-1">
                    Murid
                  </label>
                  <select
                    value={selectedStudentId}
                    onChange={(e) => setSelectedStudentId(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-bold bg-white"
                  >
                    {students.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.fullName} ({s.studentCode})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">
                    Bulan
                  </label>
                  <select
                    value={month}
                    onChange={(e) => setMonth(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-bold bg-white"
                  >
                    {MONTH_NAMES.map((mName, index) => (
                      <option key={mName} value={index + 1}>
                        {mName}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">
                    Tahun
                  </label>
                  <input
                    type="number"
                    value={year}
                    onChange={(e) => setYear(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-bold"
                  />
                </div>
              </div>

              {feedbackMsg && (
                <div className="p-4 rounded-xl bg-lime-100 border border-lime-400 text-slate-950 text-sm font-bold">
                  {feedbackMsg}
                </div>
              )}

              {/* Form Editor Rapor */}
              <div className="p-5 sm:p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-5">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-4">
                  <div>
                    <h2 className="text-lg font-black text-slate-900">
                      Lembar Rapor {MONTH_NAMES[month - 1]} {year}
                    </h2>
                    <p className="text-xs text-slate-500">
                      {loadingForm
                        ? "Menarik rekap absensi & skor skill..."
                        : "Periksa skor penguasaan dan catatan evaluasi sebelum disimpan."}
                    </p>
                  </div>

                  <span
                    className={`text-xs font-extrabold px-3 py-1 rounded-full ${
                      currentReportStatus === "published"
                        ? "bg-lime-400 text-slate-950"
                        : currentReportStatus === "draft"
                        ? "bg-amber-100 text-amber-900"
                        : "bg-slate-100 text-slate-600"
                    }`}
                  >
                    {currentReportStatus === "published"
                      ? "TERBIT (PUBLISHED)"
                      : currentReportStatus === "draft"
                      ? "DRAFT TERSIMPAN"
                      : "BELUM DIBUAT"}
                  </span>
                </div>

                {/* Rekap Kehadiran */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Jumlah Hadir (Sesi)
                    </label>
                    <input
                      type="number"
                      min={0}
                      max={10}
                      value={presentCount}
                      onChange={(e) => setPresentCount(Number(e.target.value))}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Total Sesi Latihan Bulan Ini
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={10}
                      value={totalSessions}
                      onChange={(e) => setTotalSessions(Number(e.target.value))}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-bold"
                    />
                  </div>
                </div>

                {/* Tabel Skor 8 Skill */}
                <div className="space-y-2.5">
                  <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-500">
                    Capaian 8 Materi Keterampilan
                  </label>
                  {DEFAULT_SKILLS.map((skill) => {
                    const currentLvl = skillLevels[skill.id] || 1;
                    return (
                      <div
                        key={skill.id}
                        className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                      >
                        <span className="text-sm font-bold text-slate-900">
                          {skill.order}. {skill.name}
                        </span>
                        <div className="flex items-center gap-1.5">
                          {([1, 2, 3, 4] as MasteryLevel[]).map((lvl) => (
                            <button
                              key={lvl}
                              type="button"
                              onClick={() =>
                                setSkillLevels((prev) => ({
                                  ...prev,
                                  [skill.id]: lvl,
                                }))
                              }
                              className={`px-2.5 py-1.5 rounded-lg text-xs font-extrabold border transition-colors ${
                                currentLvl === lvl
                                  ? "bg-slate-900 text-lime-400 border-slate-900"
                                  : "bg-white text-slate-600 border-slate-200"
                              }`}
                            >
                              {lvl}. {MASTERY_LABELS[lvl].shortLabel}
                            </button>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Catatan Bulanan */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Ringkasan Evaluasi &amp; Motivasi Coach
                    </label>
                    <textarea
                      rows={3}
                      value={coachNotes}
                      onChange={(e) => setCoachNotes(e.target.value)}
                      placeholder="Tuliskan perkembangan sikap, keberanian, dan teknik anak selama bulan ini..."
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Target &amp; Rekomendasi Bulan Berikutnya
                    </label>
                    <input
                      type="text"
                      value={nextRecommendation}
                      onChange={(e) => setNextRecommendation(e.target.value)}
                      placeholder="Contoh: Memantapkan T-Stop dan mulai pengenalan Cross Over"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm"
                    />
                  </div>
                </div>

                {/* Tombol Simpan Draft & Publish */}
                <div className="pt-2 flex flex-col sm:flex-row gap-3">
                  <button
                    type="button"
                    disabled={saving}
                    onClick={() => handleSaveReport("draft")}
                    className="flex-1 py-3.5 px-5 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-900 font-extrabold text-sm transition-colors disabled:opacity-60"
                  >
                    {saving ? "Memproses..." : "Simpan sebagai Draft"}
                  </button>

                  {isAdmin && (
                    <button
                      type="button"
                      disabled={saving}
                      onClick={() => handleSaveReport("published")}
                      className="flex-1 py-3.5 px-5 rounded-xl bg-lime-400 hover:bg-lime-300 text-slate-950 font-black text-sm shadow-sm transition-colors disabled:opacity-60"
                    >
                      {saving
                        ? "Menerbitkan..."
                        : "Terbitkan ke Portal Wali (Publish)"}
                    </button>
                  )}
                </div>

                {!isAdmin && (
                  <p className="text-xs text-slate-500">
                    * Draft rapor yang Anda simpan akan ditinjau dan diterbitkan
                    oleh Admin ke akun orang tua.
                  </p>
                )}
              </div>

              {/* Daftar Status Rapor Bulan Ini */}
              {monthReports.length > 0 && (
                <div className="p-5 rounded-2xl bg-white border border-slate-200 space-y-3">
                  <h3 className="text-sm font-extrabold text-slate-900">
                    Daftar Rapor Bulan {MONTH_NAMES[month - 1]} {year} (
                    {monthReports.length})
                  </h3>
                  <div className="divide-y divide-slate-100">
                    {monthReports.map((rep) => (
                      <div
                        key={rep.id}
                        className="py-3 flex items-center justify-between gap-2 text-sm"
                      >
                        <div>
                          <p className="font-bold text-slate-900">
                            {rep.studentName}
                          </p>
                          <p className="text-xs text-slate-500">
                            Hadir: {rep.presentCount}/{rep.totalSessions} sesi
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => setSelectedStudentId(rep.studentId)}
                          className={`text-xs font-extrabold px-3 py-1 rounded-full ${
                            rep.status === "published"
                              ? "bg-lime-100 text-slate-950"
                              : "bg-amber-100 text-amber-900"
                          }`}
                        >
                          {rep.status === "published" ? "TERBIT" : "DRAFT"} •
                          Buka
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </RoleGuard>
  );
}
