"use client";

import { useEffect, useState } from "react";
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
import {
  AttendanceStatus,
  StudentProfile,
  TrainingSchedule,
} from "@/types/database";

interface StudentAttendanceDraft {
  status: AttendanceStatus;
  notes: string;
  alreadySaved: boolean;
}

export default function CoachAttendancePage() {
  const { firebaseUser } = useAuth();
  const [schedules, setSchedules] = useState<TrainingSchedule[]>([]);
  const [students, setStudents] = useState<StudentProfile[]>([]);
  const [selectedScheduleId, setSelectedScheduleId] = useState("");
  const [attendanceMap, setAttendanceMap] = useState<
    Record<string, StudentAttendanceDraft>
  >({});

  const [loadingInit, setLoadingInit] = useState(true);
  const [loadingRecords, setLoadingRecords] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savedBanner, setSavedBanner] = useState(false);

  // Muat daftar jadwal & murid
  useEffect(() => {
    async function loadInitialData() {
      try {
        const [schedSnap, studSnap] = await Promise.all([
          getDocs(query(collection(db, "schedules"), orderBy("date", "desc"))),
          getDocs(query(collection(db, "students"), orderBy("fullName", "asc"))),
        ]);

        const schedList: TrainingSchedule[] = [];
        schedSnap.forEach((d) => {
          schedList.push({
            id: d.id,
            ...(d.data() as Omit<TrainingSchedule, "id">),
          });
        });

        const studList: StudentProfile[] = [];
        studSnap.forEach((d) => {
          const data = d.data() as Omit<StudentProfile, "id">;
          if (data.status === "active" || data.status === "pending") {
            studList.push({ id: d.id, ...data });
          }
        });

        setSchedules(schedList);
        setStudents(studList);
        if (schedList.length > 0) {
          setSelectedScheduleId(schedList[0].id);
        }
      } catch (error) {
        console.error("Gagal memuat data absensi:", error);
      } finally {
        setLoadingInit(false);
      }
    }

    loadInitialData();
  }, []);

  // Muat absensi yang sudah tersimpan saat jadwal dipilih
  useEffect(() => {
    async function loadScheduleAttendance() {
      if (!selectedScheduleId || students.length === 0) return;
      setLoadingRecords(true);
      setSavedBanner(false);

      try {
        const q = query(
          collection(db, "attendance"),
          where("scheduleId", "==", selectedScheduleId)
        );
        const snap = await getDocs(q);

        const existingMap: Record<
          string,
          { status: AttendanceStatus; notes: string }
        > = {};
        snap.forEach((d) => {
          const data = d.data();
          existingMap[data.studentId] = {
            status: data.status as AttendanceStatus,
            notes: data.notes || "",
          };
        });

        const nextDraft: Record<string, StudentAttendanceDraft> = {};
        students.forEach((s) => {
          if (existingMap[s.id]) {
            nextDraft[s.id] = {
              status: existingMap[s.id].status,
              notes: existingMap[s.id].notes,
              alreadySaved: true,
            };
          } else {
            nextDraft[s.id] = {
              status: "present",
              notes: "",
              alreadySaved: false,
            };
          }
        });

        setAttendanceMap(nextDraft);
      } catch (error) {
        console.error("Gagal memuat catatan kehadiran:", error);
      } finally {
        setLoadingRecords(false);
      }
    }

    loadScheduleAttendance();
  }, [selectedScheduleId, students]);

  const handleStatusChange = (studentId: string, status: AttendanceStatus) => {
    setSavedBanner(false);
    setAttendanceMap((prev) => ({
      ...prev,
      [studentId]: {
        status,
        notes: prev[studentId]?.notes || "",
        alreadySaved: prev[studentId]?.alreadySaved || false,
      },
    }));
  };

  const handleNotesChange = (studentId: string, notes: string) => {
    setSavedBanner(false);
    setAttendanceMap((prev) => ({
      ...prev,
      [studentId]: {
        status: prev[studentId]?.status || "present",
        notes,
        alreadySaved: prev[studentId]?.alreadySaved || false,
      },
    }));
  };

  const handleSaveAll = async () => {
    const selectedSchedule = schedules.find((s) => s.id === selectedScheduleId);
    if (!selectedSchedule || !firebaseUser) return;

    setSaving(true);
    setSavedBanner(false);

    try {
      await Promise.all(
        students.map((student) => {
          const entry = attendanceMap[student.id] || {
            status: "present" as AttendanceStatus,
            notes: "",
          };
          const docId = `${selectedSchedule.id}_${student.id}`;
          return setDoc(
            doc(db, "attendance", docId),
            {
              scheduleId: selectedSchedule.id,
              date: selectedSchedule.date,
              studentId: student.id,
              studentName: student.fullName,
              coachId: firebaseUser.uid,
              status: entry.status,
              notes: entry.notes.trim(),
              updatedAt: serverTimestamp(),
            },
            { merge: true }
          );
        })
      );

      setAttendanceMap((prev) => {
        const updated = { ...prev };
        Object.keys(updated).forEach((id) => {
          updated[id] = { ...updated[id], alreadySaved: true };
        });
        return updated;
      });
      setSavedBanner(true);
    } catch (error) {
      console.error("Gagal menyimpan absensi:", error);
      alert("Gagal menyimpan absensi. Periksa koneksi internet Anda.");
    } finally {
      setSaving(false);
    }
  };

  const selectedSchedule = schedules.find((s) => s.id === selectedScheduleId);
  const presentTotal = Object.values(attendanceMap).filter(
    (v) => v.status === "present"
  ).length;
  const excusedTotal = Object.values(attendanceMap).filter(
    (v) => v.status === "excused"
  ).length;
  const absentTotal = Object.values(attendanceMap).filter(
    (v) => v.status === "absent"
  ).length;

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
              Absensi Latihan Sabtu
            </h1>
            <p className="text-sm text-slate-300 mt-1">
              Ketuk status kehadiran masing-masing murid lalu simpan rekap sesi.
            </p>
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-4 sm:px-6 mt-6 space-y-5">
          {loadingInit ? (
            <div className="p-8 rounded-2xl bg-white border border-slate-200 text-center text-sm text-slate-500">
              Memuat jadwal dan daftar murid...
            </div>
          ) : schedules.length === 0 ? (
            <div className="p-6 rounded-2xl bg-white border border-slate-200 space-y-2">
              <p className="font-bold text-slate-900">
                Belum ada jadwal latihan tersedia
              </p>
              <p className="text-sm text-slate-600">
                Minta Admin membuat jadwal latihan Sabtu terlebih dahulu di menu{" "}
                <strong>Admin → Jadwal Sabtu &amp; Kurikulum</strong>.
              </p>
            </div>
          ) : (
            <>
              {/* Pilih Sesi Jadwal */}
              <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-3">
                <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-500">
                  Pilih Sesi Tanggal Latihan
                </label>
                <select
                  value={selectedScheduleId}
                  onChange={(e) => setSelectedScheduleId(e.target.value)}
                  className="w-full px-3.5 py-3 rounded-xl border border-slate-300 text-sm font-bold text-slate-900 bg-white"
                >
                  {schedules.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.date} ({s.startTime}–{s.endTime}) • {s.topic}
                    </option>
                  ))}
                </select>

                {selectedSchedule && (
                  <div className="flex flex-wrap items-center justify-between gap-2 pt-2 text-xs text-slate-600">
                    <span>Lokasi: {selectedSchedule.location}</span>
                    <div className="flex items-center gap-3 font-bold">
                      <span className="text-lime-700">
                        Hadir: {presentTotal}
                      </span>
                      <span className="text-amber-700">
                        Izin: {excusedTotal}
                      </span>
                      <span className="text-red-700">Alpa: {absentTotal}</span>
                    </div>
                  </div>
                )}
              </div>

              {savedBanner && (
                <div className="p-4 rounded-xl bg-lime-100 border border-lime-400 text-slate-950 text-sm font-bold">
                  ✓ Data absensi sesi {selectedSchedule?.date} berhasil disimpan!
                </div>
              )}

              {/* Daftar Murid */}
              {students.length === 0 ? (
                <div className="p-6 rounded-2xl bg-white border border-slate-200 text-sm text-slate-500">
                  Belum ada murid aktif terdaftar di sistem.
                </div>
              ) : loadingRecords ? (
                <div className="p-6 rounded-2xl bg-white border border-slate-200 text-sm text-slate-500 text-center">
                  Memuat status kehadiran murid...
                </div>
              ) : (
                <div className="space-y-3">
                  {students.map((student, idx) => {
                    const current = attendanceMap[student.id] || {
                      status: "present" as AttendanceStatus,
                      notes: "",
                      alreadySaved: false,
                    };

                    return (
                      <div
                        key={student.id}
                        className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-3"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-black text-slate-400">
                                #{idx + 1}
                              </span>
                              <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                                {student.studentCode}
                              </span>
                              {current.alreadySaved && (
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-lime-100 text-slate-900">
                                  Tersimpan
                                </span>
                              )}
                            </div>
                            <h3 className="text-base font-black text-slate-900 mt-1">
                              {student.fullName}
                            </h3>
                            <p className="text-xs text-slate-500">
                              Level: {student.level}
                            </p>
                          </div>

                          {/* Tombol Status 1-Tap */}
                          <div className="grid grid-cols-3 gap-2 sm:w-64 shrink-0">
                            <button
                              type="button"
                              onClick={() =>
                                handleStatusChange(student.id, "present")
                              }
                              className={`py-2.5 px-2 rounded-xl text-xs font-extrabold border transition-colors ${
                                current.status === "present"
                                  ? "bg-lime-400 border-lime-500 text-slate-950 shadow-xs"
                                  : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                              }`}
                            >
                              Hadir
                            </button>

                            <button
                              type="button"
                              onClick={() =>
                                handleStatusChange(student.id, "excused")
                              }
                              className={`py-2.5 px-2 rounded-xl text-xs font-extrabold border transition-colors ${
                                current.status === "excused"
                                  ? "bg-amber-400 border-amber-500 text-slate-950 shadow-xs"
                                  : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                              }`}
                            >
                              Izin
                            </button>

                            <button
                              type="button"
                              onClick={() =>
                                handleStatusChange(student.id, "absent")
                              }
                              className={`py-2.5 px-2 rounded-xl text-xs font-extrabold border transition-colors ${
                                current.status === "absent"
                                  ? "bg-red-500 border-red-600 text-white shadow-xs"
                                  : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                              }`}
                            >
                              Alpa
                            </button>
                          </div>
                        </div>

                        <input
                          type="text"
                          value={current.notes}
                          onChange={(e) =>
                            handleNotesChange(student.id, e.target.value)
                          }
                          placeholder="Catatan singkat (opsional, misal: datang telat / izin acara keluarga)..."
                          className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-lime-500"
                        />
                      </div>
                    );
                  })}

                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={handleSaveAll}
                      disabled={saving}
                      className="w-full py-4 px-6 rounded-2xl bg-slate-900 hover:bg-slate-800 text-lime-400 font-black text-sm sm:text-base shadow-md transition-colors disabled:opacity-60"
                    >
                      {saving
                        ? "Menyimpan Rekap Absensi..."
                        : `Simpan Absensi Sesi (${students.length} Murid)`}
                    </button>
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
