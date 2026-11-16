"use client";

import { useEffect, useState, FormEvent } from "react";
import Link from "next/link";
import {
  collection,
  getDocs,
  doc,
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
  ProgressRecord,
  StudentProfile,
} from "@/types/database";

export default function CoachProgressPage() {
  const { firebaseUser, userProfile } = useAuth();
  const [students, setStudents] = useState<StudentProfile[]>([]);
  const [selectedStudentId, setSelectedStudentId] = useState("");
  const [evaluationDate, setEvaluationDate] = useState(
    new Date().toISOString().split("T")[0]
  );

  // Skor level 1-4 untuk setiap skillId
  const [skillLevels, setSkillLevels] = useState<Record<string, MasteryLevel>>(
    {}
  );
  const [sessionNotes, setSessionNotes] = useState("");
  const [nextRecommendation, setNextRecommendation] = useState("");
  const [history, setHistory] = useState<ProgressRecord[]>([]);

  const [loadingInit, setLoadingInit] = useState(true);
  const [loadingStudentData, setLoadingStudentData] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

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
        console.error("Gagal memuat daftar murid:", error);
      } finally {
        setLoadingInit(false);
      }
    }

    loadStudents();
  }, []);

  // Muat riwayat evaluasi murid terpilih
  const fetchStudentProgress = async (studentId: string) => {
    if (!studentId) return;
    setLoadingStudentData(true);
    setSavedSuccess(false);

    try {
      const q = query(
        collection(db, "progressRecords"),
        where("studentId", "==", studentId)
      );
      const snap = await getDocs(q);

      const records: ProgressRecord[] = [];
      snap.forEach((d) => {
        records.push({
          id: d.id,
          ...(d.data() as Omit<ProgressRecord, "id">),
        });
      });

      // Urutkan dari tanggal terbaru
      records.sort((a, b) => b.date.localeCompare(a.date));
      setHistory(records);

      // Isi skor awal tiap skill dari catatan terbaru (default 1 = Belum dipelajari)
      const latestMap: Record<string, MasteryLevel> = {};
      DEFAULT_SKILLS.forEach((skill) => {
        const found = records.find((r) => r.skillId === skill.id);
        latestMap[skill.id] = found ? found.masteryLevel : 1;
      });
      setSkillLevels(latestMap);

      if (records.length > 0) {
        setSessionNotes(records[0].notes || "");
        setNextRecommendation(records[0].nextRecommendation || "");
      } else {
        setSessionNotes("");
        setNextRecommendation("");
      }
    } catch (error) {
      console.error("Gagal memuat progres murid:", error);
    } finally {
      setLoadingStudentData(false);
    }
  };

  useEffect(() => {
    if (selectedStudentId) {
      fetchStudentProgress(selectedStudentId);
    }
  }, [selectedStudentId]);

  const handleSelectMastery = (skillId: string, level: MasteryLevel) => {
    setSavedSuccess(false);
    setSkillLevels((prev) => ({
      ...prev,
      [skillId]: level,
    }));
  };

  const handleSaveEvaluation = async (e: FormEvent) => {
    e.preventDefault();
    const student = students.find((s) => s.id === selectedStudentId);
    if (!student || !firebaseUser) return;

    setSaving(true);
    setSavedSuccess(false);

    try {
      const coachDisplayName = userProfile?.name || "Coach TREX";

      await Promise.all(
        DEFAULT_SKILLS.map((skill) => {
          const level = skillLevels[skill.id] || 1;
          const docId = `${evaluationDate}_${student.id}_${skill.id}`;
          return setDoc(
            doc(db, "progressRecords", docId),
            {
              studentId: student.id,
              studentName: student.fullName,
              coachId: firebaseUser.uid,
              coachName: coachDisplayName,
              date: evaluationDate,
              skillId: skill.id,
              skillName: skill.name,
              masteryLevel: level,
              notes: sessionNotes.trim(),
              nextRecommendation: nextRecommendation.trim(),
              createdAt: serverTimestamp(),
            },
            { merge: true }
          );
        })
      );

      setSavedSuccess(true);
      await fetchStudentProgress(student.id);
    } catch (error) {
      console.error("Gagal menyimpan evaluasi:", error);
      alert("Gagal menyimpan evaluasi murid. Periksa koneksi internet Anda.");
    } finally {
      setSaving(false);
    }
  };

  const selectedStudent = students.find((s) => s.id === selectedStudentId);

  return (
    <RoleGuard allowedRoles={["coach", "admin"]}>
      <div className="min-h-[85vh] bg-slate-50 pb-16">
        {/* Header */}
        <div className="bg-slate-900 text-white border-b border-slate-800">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 py-7">
            <Link
              href="/coach"
              className="text-xs font-bold text-lime-400 hover:underline"
            >
              ← Kembali ke Panel Coach
            </Link>
            <h1 className="text-2xl sm:text-3xl font-black mt-3">
              Evaluasi Perkembangan Skill
            </h1>
            <p className="text-sm text-slate-300 mt-1">
              Nilai tingkat penguasaan 8 materi teknik dan tulis catatan latihan
              anak.
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
              Belum ada murid terdaftar. Minta Admin menambahkan data murid
              terlebih dahulu.
            </div>
          ) : (
            <form onSubmit={handleSaveEvaluation} className="space-y-6">
              {/* Pilih Murid & Tanggal */}
              <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-500 mb-1.5">
                    Pilih Nama Murid
                  </label>
                  <select
                    value={selectedStudentId}
                    onChange={(e) => setSelectedStudentId(e.target.value)}
                    className="w-full px-3.5 py-3 rounded-xl border border-slate-300 text-sm font-bold text-slate-900 bg-white"
                  >
                    {students.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.fullName} ({s.studentCode} • {s.level})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-500 mb-1.5">
                    Tanggal Evaluasi
                  </label>
                  <input
                    type="date"
                    required
                    value={evaluationDate}
                    onChange={(e) => setEvaluationDate(e.target.value)}
                    className="w-full px-3.5 py-3 rounded-xl border border-slate-300 text-sm font-bold text-slate-900"
                  />
                </div>
              </div>

              {savedSuccess && (
                <div className="p-4 rounded-xl bg-lime-100 border border-lime-400 text-slate-950 text-sm font-bold">
                  ✓ Evaluasi perkembangan ananda {selectedStudent?.fullName}{" "}
                  berhasil disimpan!
                </div>
              )}

              {/* Penilaian 8 Materi Skill */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h2 className="text-base font-extrabold text-slate-900">
                    Tingkat Penguasaan Materi (1 – 4)
                  </h2>
                  {loadingStudentData && (
                    <span className="text-xs text-slate-500">
                      Memuat skor...
                    </span>
                  )}
                </div>

                {DEFAULT_SKILLS.map((skill) => {
                  const activeLevel = skillLevels[skill.id] || 1;
                  return (
                    <div
                      key={skill.id}
                      className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-3"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] font-black px-2 py-0.5 rounded bg-slate-900 text-lime-400">
                            0{skill.order}
                          </span>
                          <h3 className="text-base font-black text-slate-900">
                            {skill.name}
                          </h3>
                        </div>
                        <p className="text-xs text-slate-500 mt-1">
                          {skill.description}
                        </p>
                      </div>

                      {/* 4 Tombol Pilihan Level */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        {([1, 2, 3, 4] as MasteryLevel[]).map((lvl) => {
                          const info = MASTERY_LABELS[lvl];
                          const isSelected = activeLevel === lvl;
                          return (
                            <button
                              key={lvl}
                              type="button"
                              onClick={() => handleSelectMastery(skill.id, lvl)}
                              className={`py-2.5 px-3 rounded-xl border text-left transition-all ${
                                isSelected
                                  ? "bg-slate-900 border-slate-900 text-white ring-2 ring-lime-400"
                                  : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"
                              }`}
                            >
                              <span
                                className={`block text-[10px] font-black ${
                                  isSelected
                                    ? "text-lime-400"
                                    : "text-slate-400"
                                }`}
                              >
                                LEVEL {lvl}
                              </span>
                              <span className="block text-xs font-bold mt-0.5">
                                {info.label}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Catatan & Rekomendasi Coach */}
              <div className="p-5 sm:p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-4">
                <h2 className="text-base font-extrabold text-slate-900">
                  Catatan Coach untuk Orang Tua
                </h2>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Catatan Perkembangan Latihan
                  </label>
                  <textarea
                    rows={3}
                    value={sessionNotes}
                    onChange={(e) => setSessionNotes(e.target.value)}
                    placeholder="Contoh: Keseimbangan meluncur lurus sudah jauh lebih berani, lutut mulai tertekuk dengan baik..."
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-lime-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Rekomendasi Latihan Berikutnya
                  </label>
                  <input
                    type="text"
                    value={nextRecommendation}
                    onChange={(e) => setNextRecommendation(e.target.value)}
                    placeholder="Contoh: Fokus latihan pengereman Heel Brake & belok A-Frame"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-lime-500"
                  />
                </div>

                <button
                  type="submit"
                  disabled={saving}
                  className="w-full py-4 px-6 rounded-2xl bg-lime-400 hover:bg-lime-300 text-slate-950 font-black text-sm sm:text-base shadow-sm transition-colors disabled:opacity-60"
                >
                  {saving
                    ? "Menyimpan Evaluasi..."
                    : "Simpan Evaluasi Perkembangan"}
                </button>
              </div>
            </form>
          )}

          {/* Ringkasan Riwayat Terakhir */}
          {history.length > 0 && (
            <div className="p-5 rounded-2xl bg-white border border-slate-200 space-y-3">
              <h3 className="text-sm font-extrabold text-slate-900">
                Riwayat Evaluasi Tersimpan ({history[0].date})
              </h3>
              <p className="text-xs text-slate-600">
                Terakhir diperbarui oleh <strong>{history[0].coachName}</strong>
                {history[0].notes ? ` — "${history[0].notes}"` : ""}
              </p>
            </div>
          )}
        </div>
      </div>
    </RoleGuard>
  );
}
