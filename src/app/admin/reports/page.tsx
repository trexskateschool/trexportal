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

const MONTHS = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember",
];

type AttStatus = "present" | "sick" | "excused";

interface StudentItem {
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
  skillId: string;
  masteryLevel: MasteryLevel;
  date: string;
  notes: string;
  nextRecommendation: string;
}

interface AttendanceItem {
  id: string;
  studentId: string;
  studentName: string;
  date: string;
  status: AttStatus;
  notes: string;
}

export default function AdminReportsPage() {
  const [tab, setTab] = useState<"rapor" | "evaluasi" | "absensi">("rapor");
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState("");

  const [students, setStudents] = useState<StudentItem[]>([]);
  const [reports, setReports] = useState<ReportItem[]>([]);
  const [progress, setProgress] = useState<ProgressItem[]>([]);
  const [attendance, setAttendance] = useState<AttendanceItem[]>([]);

  // Tab Rapor
  const now = new Date();
  const [repStudent, setRepStudent] = useState("");
  const [repMonth, setRepMonth] = useState(now.getMonth() + 1);
  const [repYear, setRepYear] = useState(now.getFullYear());
  const [repStatus, setRepStatus] = useState<"published" | "draft">("published");
  const [repNotes, setRepNotes] = useState("");
  const [repRec, setRepRec] = useState("");
  const [savingRep, setSavingRep] = useState(false);
  const [preview, setPreview] = useState<ReportItem | null>(null);

  // Tab Evaluasi 8 Skill
  const [evalStudent, setEvalStudent] = useState("");
  const [editEval, setEditEval] = useState(false);
  const [evalDate, setEvalDate] = useState(now.toISOString().split("T")[0]);
  const [evalScores, setEvalScores] = useState<Record<string, MasteryLevel>>({});
  const [evalNote, setEvalNote] = useState("");
  const [evalRec, setEvalRec] = useState("");
  const [savingEval, setSavingEval] = useState(false);

  // Tab Absensi Latihan
  const [attDate, setAttDate] = useState(now.toISOString().split("T")[0]);
  const [attMap, setAttMap] = useState<Record<string, AttStatus>>({});
  const [attNotes, setAttNotes] = useState<Record<string, string>>({});
  const [savingAtt, setSavingAtt] = useState(false);
  const [filterAttStudent, setFilterAttStudent] = useState("ALL");

  const loadData = async () => {
    setLoading(true);
    try {
      const [sSnap, rSnap, pSnap, aSnap] = await Promise.all([
        getDocs(collection(db, "students")),
        getDocs(collection(db, "monthlyReports")),
        getDocs(collection(db, "progressRecords")),
        getDocs(collection(db, "attendance")),
      ]);

      const sMap: Record<string, StudentItem> = {};
      const sList: StudentItem[] = [];
      sSnap.forEach((d) => {
        const v = d.data();
        const item: StudentItem = {
          id: d.id,
          fullName: v.fullName || "Tanpa Nama",
          studentCode: v.studentCode || "-",
          level: v.level || "Beginner",
          coachName: v.coachName || "Tim Coach TREX",
        };
        sMap[d.id] = item;
        sList.push(item);
      });
      sList.sort((a, b) => a.fullName.localeCompare(b.fullName));

      const rList: ReportItem[] = [];
      rSnap.forEach((d) => {
        const v = d.data();
        const st = sMap[v.studentId];
        rList.push({
          id: d.id,
          studentId: v.studentId,
          studentName: v.studentName || st?.fullName || "Murid",
          studentCode: v.studentCode || st?.studentCode || "-",
          level: v.level || st?.level || "Beginner",
          coachName: v.coachName || st?.coachName || "Tim Coach TREX",
          month: Number(v.month) || 1,
          year: Number(v.year) || now.getFullYear(),
          status: v.status === "published" ? "published" : "draft",
          presentCount: Number(v.presentCount) || 0,
          totalSessions: Number(v.totalSessions) || 0,
          skills: (v.skills as Record<string, number>) || {},
          masteredSkills: Array.isArray(v.masteredSkills) ? v.masteredSkills : [],
          developingSkills: Array.isArray(v.developingSkills) ? v.developingSkills : [],
          notes: v.notes || v.coachNotes || v.summary || "",
          nextRecommendation: v.nextRecommendation || "",
        });
      });
      rList.sort((a, b) => (b.year !== a.year ? b.year - a.year : b.month - a.month));

      const pList: ProgressItem[] = [];
      pSnap.forEach((d) => {
        const v = d.data();
        pList.push({
          id: d.id,
          studentId: v.studentId,
          skillId: v.skillId,
          masteryLevel: ([1, 2, 3, 4].includes(v.masteryLevel) ? v.masteryLevel : 1) as MasteryLevel,
          date: v.date || "",
          notes: v.notes || "",
          nextRecommendation: v.nextRecommendation || "",
        });
      });
      pList.sort((a, b) => b.date.localeCompare(a.date));

      const aList: AttendanceItem[] = [];
      aSnap.forEach((d) => {
        const v = d.data();
        const st: AttStatus = v.status === "sick" ? "sick" : v.status === "excused" || v.status === "absent" ? "excused" : "present";
        aList.push({
          id: d.id,
          studentId: v.studentId,
          studentName: v.studentName || sMap[v.studentId]?.fullName || "Murid",
          date: v.date || "",
          status: st,
          notes: v.notes || "",
        });
      });
      aList.sort((a, b) => b.date.localeCompare(a.date));

      setStudents(sList);
      setReports(rList);
      setProgress(pList);
      setAttendance(aList);
      if (sList.length > 0) {
        if (!repStudent) setRepStudent(sList[0].id);
        if (!evalStudent) setEvalStudent(sList[0].id);
      }
    } catch (err) {
      console.error("Gagal memuat data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const map: Record<string, AttStatus> = {};
    const notes: Record<string, string> = {};
    students.forEach((s) => {
      const found = attendance.find((a) => a.studentId === s.id && a.date === attDate);
      map[s.id] = found ? found.status : "present";
      notes[s.id] = found?.notes || "";
    });
    setAttMap(map);
    setAttNotes(notes);
  }, [attDate, students, attendance]);

  const getLatestSkills = (studentId: string) => {
    const sp = progress.filter((p) => p.studentId === studentId);
    return DEFAULT_SKILLS.map((sk) => {
      const f = sp.find((p) => p.skillId === sk.id);
      return { ...sk, masteryLevel: (f ? f.masteryLevel : 1) as MasteryLevel };
    });
  };

  const handleCreateReport = async (e: FormEvent) => {
    e.preventDefault();
    const st = students.find((s) => s.id === repStudent);
    if (!st) return;
    setSavingRep(true);
    setMsg("");
    try {
      const prefix = `${repYear}-${String(repMonth).padStart(2, "0")}`;
      const mAtt = attendance.filter((a) => a.studentId === st.id && a.date.startsWith(prefix));
      const presentCount = mAtt.filter((a) => a.status === "present").length;
      const latestSk = getLatestSkills(st.id);
      const skillsMap: Record<string, number> = {};
      const mastered: string[] = [];
      const developing: string[] = [];
      latestSk.forEach((sk) => {
        skillsMap[sk.id] = sk.masteryLevel;
        if (sk.masteryLevel >= 4) mastered.push(sk.name);
        else developing.push(sk.name);
      });
      const lastNote = progress.find((p) => p.studentId === st.id && p.notes);
      const finalNote = repNotes.trim() || lastNote?.notes || "Semangat latihannya.";
      const finalRec = repRec.trim() || lastNote?.nextRecommendation || "Latihan keseimbangan dan kelancaran dasar.";

      await setDoc(doc(collection(db, "monthlyReports")), {
        studentId: st.id,
        studentName: st.fullName,
        studentCode: st.studentCode,
        level: st.level,
        coachName: st.coachName,
        month: repMonth,
        year: repYear,
        status: repStatus,
        presentCount,
        totalSessions: mAtt.length,
        skills: skillsMap,
        masteredSkills: mastered,
        developingSkills: developing,
        notes: finalNote,
        coachNotes: finalNote,
        summary: finalNote,
        nextRecommendation: finalRec,
        createdAt: serverTimestamp(),
      });
      setRepNotes("");
      setRepRec("");
      setMsg(`Rapor ${MONTHS[repMonth - 1]} ${repYear} untuk ${st.fullName} berhasil disimpan.`);
      await loadData();
    } catch (err) {
      console.error(err);
      alert("Gagal membuat rapor.");
    } finally {
      setSavingRep(false);
    }
  };

  const handleSaveEval = async (e: FormEvent) => {
    e.preventDefault();
    const st = students.find((s) => s.id === evalStudent);
    if (!st) return;
    setSavingEval(true);
    setMsg("");
    try {
      await Promise.all(
        DEFAULT_SKILLS.map((sk) =>
          setDoc(doc(db, "progressRecords", `${st.id}_${sk.id}_${evalDate}`), {
            studentId: st.id,
            studentName: st.fullName,
            skillId: sk.id,
            masteryLevel: evalScores[sk.id] || 1,
            date: evalDate,
            notes: evalNote.trim(),
            nextRecommendation: evalRec.trim(),
            updatedAt: serverTimestamp(),
          })
        )
      );
      setEditEval(false);
      setMsg(`Evaluasi 8 skill ${st.fullName} berhasil diperbarui.`);
      await loadData();
    } catch (err) {
      console.error(err);
      alert("Gagal menyimpan evaluasi.");
    } finally {
      setSavingEval(false);
    }
  };

  const handleSaveAttendance = async (e: FormEvent) => {
    e.preventDefault();
    if (!attDate || students.length === 0) return;
    setSavingAtt(true);
    setMsg("");
    try {
      await Promise.all(
        students.map((st) =>
          setDoc(doc(db, "attendance", `${st.id}_${attDate}`), {
            studentId: st.id,
            studentName: st.fullName,
            date: attDate,
            status: attMap[st.id] || "present",
            notes: (attNotes[st.id] || "").trim(),
            updatedAt: serverTimestamp(),
          })
        )
      );
      setMsg(`Absensi latihan ${attDate} berhasil disimpan.`);
      await loadData();
    } catch (err) {
      console.error(err);
      alert("Gagal menyimpan absensi.");
    } finally {
      setSavingAtt(false);
    }
  };

  const activeEvalSkills = evalStudent ? getLatestSkills(evalStudent) : [];
  const activeEvalLastNote = progress.find((p) => p.studentId === evalStudent);
  const shownAtt = filterAttStudent === "ALL" ? attendance : attendance.filter((a) => a.studentId === filterAttStudent);

  return (
    <RoleGuard allowedRoles={["admin"]}>
      <div className="min-h-[85vh] bg-slate-50 pb-16">
        <div className="bg-slate-900 text-white border-b border-slate-800">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 py-7">
            <Link href="/admin" className="text-xs font-bold text-lime-400 hover:underline">
              ← Kembali ke Dashboard Admin
            </Link>
            <h1 className="text-2xl sm:text-3xl font-black mt-3">
              Evaluasi, Absensi &amp; Rapor Bulanan
            </h1>
          </div>
        </div>

        <div className="max-w-5xl mx-auto px-4 sm:px-6 mt-6 space-y-6">
          {msg && (
            <div className="p-4 rounded-xl bg-lime-100 border border-lime-400 text-slate-950 text-sm font-bold">
              ✓ {msg}
            </div>
          )}

          {/* Tab Menu */}
          <div className="grid grid-cols-3 gap-2 bg-slate-200/70 p-1.5 rounded-2xl">
            {(["rapor", "evaluasi", "absensi"] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => { setTab(t); setMsg(""); }}
                className={`py-2.5 px-3 rounded-xl text-xs sm:text-sm font-extrabold transition-colors ${
                  tab === t ? "bg-white text-slate-950 shadow-xs" : "text-slate-600"
                }`}
              >
                {t === "rapor" ? `Rapor (${reports.length})` : t === "evaluasi" ? "Evaluasi 8 Skill" : "Absensi Latihan"}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="p-8 rounded-2xl bg-white border text-center text-sm text-slate-500">Memuat data...</div>
          ) : tab === "rapor" ? (
            <div className="space-y-6">
              {/* Pratinjau Dokumen Rapor Resmi */}
              {preview && (
                <div className="rounded-3xl bg-white border-2 border-slate-900 shadow-lg overflow-hidden">
                  <div className="bg-slate-900 text-white px-6 py-5 border-b-4 border-lime-400 flex justify-between items-start gap-4">
                    <div>
                      <h2 className="text-lg font-black">TREX SKATE SCHOOL</h2>
                      <p className="text-[11px] font-extrabold text-lime-400">LAPORAN EVALUASI PERKEMBANGAN MURID</p>
                      <span className="inline-block mt-1 px-2.5 py-0.5 rounded bg-slate-800 text-[10px] font-extrabold text-lime-300">
                        PERIODE: {MONTHS[preview.month - 1].toUpperCase()} {preview.year}
                      </span>
                    </div>
                    <button type="button" onClick={() => setPreview(null)} className="px-3 py-1.5 rounded-lg bg-slate-800 text-xs font-bold">
                      Tutup ✕
                    </button>
                  </div>

                  <div className="p-6 space-y-5">
                    <div className="p-4 rounded-2xl bg-slate-50 border grid grid-cols-2 gap-3 text-xs">
                      <div className="col-span-2">
                        <p className="text-[10px] font-bold text-slate-400">NAMA LENGKAP MURID</p>
                        <p className="text-lg font-black text-slate-900">{preview.studentName}</p>
                      </div>
                      <div><p className="text-[10px] font-bold text-slate-400">ID ANGGOTA</p><p className="font-bold">{preview.studentCode}</p></div>
                      <div><p className="text-[10px] font-bold text-slate-400">LEVEL / KELAS</p><p className="font-bold">{preview.level}</p></div>
                      <div><p className="text-[10px] font-bold text-slate-400">COACH PEMBINA</p><p className="font-bold">{preview.coachName}</p></div>
                      <div><p className="text-[10px] font-bold text-slate-400">KEHADIRAN</p><p className="font-bold text-blue-900">Hadir {preview.presentCount} dari {preview.totalSessions} Sesi</p></div>
                    </div>

                    <div className="rounded-2xl border overflow-hidden">
                      <div className="bg-slate-900 text-white px-4 py-2.5 grid grid-cols-12 text-[11px] font-extrabold">
                        <span className="col-span-2">NO</span>
                        <span className="col-span-5">MATERI</span>
                        <span className="col-span-5 text-right">PENGUASAAN</span>
                      </div>
                      <div className="divide-y">
                        {DEFAULT_SKILLS.map((sk) => {
                          const lvl = (preview.skills?.[sk.id] || getLatestSkills(preview.studentId).find((s) => s.id === sk.id)?.masteryLevel || 1) as MasteryLevel;
                          const b = MASTERY_LABELS[lvl];
                          return (
                            <div key={sk.id} className="px-4 py-2.5 grid grid-cols-12 items-center text-xs">
                              <span className="col-span-2 font-bold text-slate-500">{sk.order}</span>
                              <span className="col-span-5 font-black text-slate-900">{sk.name}</span>
                              <div className="col-span-5 text-right">
                                <span className={`inline-block text-[10px] font-extrabold px-2 py-0.5 rounded-full border ${b.colorClass}`}>
                                  {lvl}/4 • {b.label}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    <div className="p-4 rounded-2xl bg-slate-50 border text-xs space-y-1">
                      <p className="font-black text-slate-900">CATATAN &amp; REKOMENDASI PELATIH</p>
                      <p className="text-slate-700">{preview.notes}</p>
                      {preview.nextRecommendation && <p className="text-slate-600 pt-1"><strong>Rekomendasi:</strong> {preview.nextRecommendation}</p>}
                    </div>
                  </div>
                </div>
              )}

              {/* Form Buat Rapor */}
              <form onSubmit={handleCreateReport} className="p-5 rounded-2xl bg-white border space-y-4">
                <h2 className="text-base font-black text-slate-900">Buat &amp; Terbitkan Rapor Bulanan</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <select value={repStudent} onChange={(e) => setRepStudent(e.target.value)} className="px-3.5 py-2.5 rounded-xl border text-sm font-bold bg-white">
                    {students.map((s) => <option key={s.id} value={s.id}>{s.fullName} ({s.level})</option>)}
                  </select>
                  <div className="grid grid-cols-2 gap-2">
                    <select value={repMonth} onChange={(e) => setRepMonth(Number(e.target.value))} className="px-3 py-2.5 rounded-xl border text-sm font-bold bg-white">
                      {MONTHS.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
                    </select>
                    <input type="number" value={repYear} onChange={(e) => setRepYear(Number(e.target.value))} className="px-3 py-2.5 rounded-xl border text-sm font-bold" />
                  </div>
                  <input type="text" value={repNotes} onChange={(e) => setRepNotes(e.target.value)} placeholder="Catatan evaluasi pelatih (opsional)" className="px-3.5 py-2.5 rounded-xl border text-sm" />
                  <input type="text" value={repRec} onChange={(e) => setRepRec(e.target.value)} placeholder="Rekomendasi bulan berikutnya (opsional)" className="px-3.5 py-2.5 rounded-xl border text-sm" />
                  <select value={repStatus} onChange={(e) => setRepStatus(e.target.value as "published" | "draft")} className="px-3.5 py-2.5 rounded-xl border text-sm font-bold bg-white">
                    <option value="published">Terbitkan Langsung</option>
                    <option value="draft">Simpan Draft</option>
                  </select>
                </div>
                <button type="submit" disabled={savingRep} className="px-5 py-2.5 rounded-xl bg-lime-400 text-slate-950 font-extrabold text-sm">
                  {savingRep ? "Menyimpan..." : "+ Buat Rapor Bulanan"}
                </button>
              </form>

              {/* Daftar Rapor */}
              <div className="space-y-3">
                {reports.map((r) => (
                  <div key={r.id} className="p-4 rounded-2xl bg-white border flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded ${r.status === "published" ? "bg-lime-200 text-slate-950" : "bg-amber-100 text-amber-900"}`}>
                        {r.status === "published" ? "TERBIT" : "DRAFT"} • {MONTHS[r.month - 1]} {r.year}
                      </span>
                      <h3 className="text-base font-black text-slate-900 mt-1">{r.studentName}</h3>
                      <p className="text-xs text-slate-500">Hadir {r.presentCount}/{r.totalSessions} sesi</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <button type="button" onClick={() => { setPreview(r); window.scrollTo({ top: 0, behavior: "smooth" }); }} className="px-3 py-1.5 rounded-lg bg-slate-900 text-lime-400 text-xs font-extrabold">
                        Buka Rapor
                      </button>
                      <button type="button" onClick={async () => {
                        const next = r.status === "published" ? "draft" : "published";
                        await updateDoc(doc(db, "monthlyReports", r.id), { status: next });
                        setReports((prev) => prev.map((x) => (x.id === r.id ? { ...x, status: next } : x)));
                      }} className="px-3 py-1.5 rounded-lg bg-slate-100 text-xs font-bold">
                        {r.status === "published" ? "Draft" : "Terbitkan"}
                      </button>
                      <button type="button" onClick={async () => {
                        if (!window.confirm("Hapus rapor ini?")) return;
                        await deleteDoc(doc(db, "monthlyReports", r.id));
                        setReports((prev) => prev.filter((x) => x.id !== r.id));
                      }} className="px-3 py-1.5 rounded-lg bg-red-50 text-red-700 text-xs font-bold">
                        Hapus
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : tab === "evaluasi" ? (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-white border flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <select value={evalStudent} onChange={(e) => { setEvalStudent(e.target.value); setEditEval(false); }} className="px-3.5 py-2.5 rounded-xl border text-sm font-black bg-white">
                  {students.map((s) => <option key={s.id} value={s.id}>{s.fullName} ({s.level})</option>)}
                </select>
                {!editEval && (
                  <button type="button" onClick={() => {
                    const m: Record<string, MasteryLevel> = {};
                    activeEvalSkills.forEach((sk) => { m[sk.id] = sk.masteryLevel; });
                    setEvalScores(m);
                    setEvalNote(activeEvalLastNote?.notes || "");
                    setEvalRec(activeEvalLastNote?.nextRecommendation || "");
                    setEditEval(true);
                  }} className="px-4 py-2.5 rounded-xl bg-slate-900 text-lime-400 text-xs font-extrabold">
                    Edit / Isi Nilai 8 Skill
                  </button>
                )}
              </div>

              {editEval ? (
                <form onSubmit={handleSaveEval} className="p-5 rounded-2xl bg-white border-2 border-lime-400 space-y-4">
                  <div className="flex justify-between items-center">
                    <h2 className="text-base font-black">Update Evaluasi 8 Skill</h2>
                    <button type="button" onClick={() => setEditEval(false)} className="text-xs font-bold text-slate-500 underline">Batal</button>
                  </div>
                  <input type="date" value={evalDate} onChange={(e) => setEvalDate(e.target.value)} className="px-3 py-2 rounded-xl border text-sm font-bold" />
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {DEFAULT_SKILLS.map((sk) => (
                      <div key={sk.id} className="p-3 rounded-xl bg-slate-50 border flex items-center justify-between gap-2">
                        <div>
                          <span className="text-[10px] font-bold text-slate-400">MATERI 0{sk.order}</span>
                          <p className="text-sm font-black">{sk.name}</p>
                        </div>
                        <select value={evalScores[sk.id] || 1} onChange={(e) => setEvalScores((p) => ({ ...p, [sk.id]: Number(e.target.value) as MasteryLevel }))} className="px-2 py-1.5 rounded-lg border text-xs font-bold bg-white">
                          <option value={1}>1/4 • Belum bisa</option>
                          <option value={2}>2/4 • Sedang belajar</option>
                          <option value={3}>3/4 • Mulai berkembang</option>
                          <option value={4}>4/4 • Sudah lancar</option>
                        </select>
                      </div>
                    ))}
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <input type="text" value={evalNote} onChange={(e) => setEvalNote(e.target.value)} placeholder="Catatan evaluasi pelatih" className="px-3.5 py-2.5 rounded-xl border text-sm" />
                    <input type="text" value={evalRec} onChange={(e) => setEvalRec(e.target.value)} placeholder="Fokus latihan berikutnya" className="px-3.5 py-2.5 rounded-xl border text-sm" />
                  </div>
                  <button type="submit" disabled={savingEval} className="px-5 py-2.5 rounded-xl bg-lime-400 text-slate-950 font-extrabold text-sm">
                    {savingEval ? "Menyimpan..." : "Simpan Evaluasi"}
                  </button>
                </form>
              ) : (
                <div className="space-y-4">
                  {activeEvalLastNote && (
                    <div className="p-5 rounded-2xl bg-slate-900 text-white space-y-1.5">
                      <span className="text-[11px] font-extrabold text-lime-400 uppercase">
                        CATATAN EVALUASI TERAKHIR ({activeEvalLastNote.date})
                      </span>
                      <p className="text-sm text-slate-200">&ldquo;{activeEvalLastNote.notes || "Semangat latihannya"}&rdquo;</p>
                      {activeEvalLastNote.nextRecommendation && (
                        <p className="text-xs text-lime-300">Fokus Berikutnya: {activeEvalLastNote.nextRecommendation}</p>
                      )}
                    </div>
                  )}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {activeEvalSkills.map((sk) => {
                      const b = MASTERY_LABELS[sk.masteryLevel];
                      return (
                        <div key={sk.id} className="p-4 rounded-2xl bg-white border flex items-center justify-between gap-2">
                          <div>
                            <span className="text-[11px] font-bold text-slate-400">MATERI 0{sk.order}</span>
                            <h3 className="text-sm font-black text-slate-900">{sk.name}</h3>
                          </div>
                          <span className={`text-xs font-extrabold px-3 py-1 rounded-full border shrink-0 ${b.colorClass}`}>
                            {sk.masteryLevel}/4 • {b.label}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-6">
              {/* Form Absensi Per Sesi Latihan */}
              <form onSubmit={handleSaveAttendance} className="p-5 rounded-2xl bg-white border space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b pb-3">
                  <div>
                    <h2 className="text-base font-black text-slate-900">Isi Absensi Latihan</h2>
                    <p className="text-xs text-slate-500">Pilih status Hadir, Sakit, atau Izin untuk setiap murid.</p>
                  </div>
                  <input type="date" required value={attDate} onChange={(e) => setAttDate(e.target.value)} className="px-3.5 py-2 rounded-xl border text-sm font-extrabold" />
                </div>

                <div className="space-y-2.5">
                  {students.map((st, i) => {
                    const cur = attMap[st.id] || "present";
                    return (
                      <div key={st.id} className="p-3.5 rounded-xl bg-slate-50 border flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                        <p className="text-sm font-black text-slate-900">{i + 1}. {st.fullName}</p>
                        <div className="flex flex-wrap items-center gap-1.5">
                          <button type="button" onClick={() => setAttMap((p) => ({ ...p, [st.id]: "present" }))} className={`px-3 py-1.5 rounded-lg text-xs font-extrabold border ${cur === "present" ? "bg-lime-400 border-lime-500 text-slate-950" : "bg-white text-slate-600"}`}>
                            Hadir
                          </button>
                          <button type="button" onClick={() => setAttMap((p) => ({ ...p, [st.id]: "sick" }))} className={`px-3 py-1.5 rounded-lg text-xs font-extrabold border ${cur === "sick" ? "bg-amber-400 border-amber-500 text-slate-950" : "bg-white text-slate-600"}`}>
                            Sakit
                          </button>
                          <button type="button" onClick={() => setAttMap((p) => ({ ...p, [st.id]: "excused" }))} className={`px-3 py-1.5 rounded-lg text-xs font-extrabold border ${cur === "excused" ? "bg-blue-600 border-blue-700 text-white" : "bg-white text-slate-600"}`}>
                            Izin
                          </button>
                          <input type="text" value={attNotes[st.id] || ""} onChange={(e) => setAttNotes((p) => ({ ...p, [st.id]: e.target.value }))} placeholder="Catatan" className="w-32 sm:w-40 px-2.5 py-1.5 rounded-lg border bg-white text-xs" />
                        </div>
                      </div>
                    );
                  })}
                </div>

                <button type="submit" disabled={savingAtt} className="px-5 py-2.5 rounded-xl bg-slate-900 text-lime-400 font-extrabold text-sm">
                  {savingAtt ? "Menyimpan..." : `Simpan Absensi (${attDate})`}
                </button>
              </form>

              {/* Riwayat Absensi */}
              <div className="space-y-2.5">
                <div className="p-4 rounded-2xl bg-white border flex justify-between items-center gap-2">
                  <h3 className="text-sm font-black">Riwayat Absensi ({shownAtt.length})</h3>
                  <select value={filterAttStudent} onChange={(e) => setFilterAttStudent(e.target.value)} className="px-3 py-1.5 rounded-xl border text-xs font-bold bg-white">
                    <option value="ALL">Semua Murid</option>
                    {students.map((s) => <option key={s.id} value={s.id}>{s.fullName}</option>)}
                  </select>
                </div>

                {shownAtt.map((a) => (
                  <div key={a.id} className="p-4 rounded-2xl bg-white border flex items-center justify-between gap-2">
                    <div>
                      <p className="text-[11px] font-bold text-slate-400">{a.date}</p>
                      <p className="text-sm font-black text-slate-900">{a.studentName}</p>
                      {a.notes && <p className="text-xs text-slate-500">{a.notes}</p>}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs font-extrabold px-2.5 py-1 rounded-full ${a.status === "present" ? "bg-lime-100 text-slate-950" : a.status === "sick" ? "bg-amber-100 text-amber-900" : "bg-blue-100 text-blue-900"}`}>
                        {a.status === "present" ? "HADIR" : a.status === "sick" ? "SAKIT" : "IZIN"}
                      </span>
                      <button type="button" onClick={async () => {
                        if (!window.confirm("Hapus absensi ini?")) return;
                        await deleteDoc(doc(db, "attendance", a.id));
                        setAttendance((prev) => prev.filter((x) => x.id !== a.id));
                      }} className="px-2.5 py-1 rounded-lg bg-red-50 text-red-700 text-xs font-bold">
                        Hapus
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </RoleGuard>
  );
}
