"use client";

import { useEffect, useState, FormEvent } from "react";
import Link from "next/link";
import {
  collection,
  getDocs,
  doc,
  setDoc,
  deleteDoc,
  orderBy,
  query,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import RoleGuard from "@/components/RoleGuard";
import { DEFAULT_SKILLS, REGULAR_TRAINING } from "@/lib/constants";
import { ScheduleStatus, TrainingSchedule } from "@/types/database";

function getNextSaturdayDate(): string {
  const today = new Date();
  const day = today.getDay(); // 6 = Sabtu
  const diff = (6 - day + 7) % 7;
  const nextSat = new Date(today);
  nextSat.setDate(today.getDate() + diff);
  return nextSat.toISOString().split("T")[0];
}

export default function AdminSchedulesPage() {
  const [schedules, setSchedules] = useState<TrainingSchedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [syncingSkills, setSyncingSkills] = useState(false);
  const [skillSyncDone, setSkillSyncDone] = useState(false);

  const [date, setDate] = useState(getNextSaturdayDate());
  const [startTime, setStartTime] = useState(REGULAR_TRAINING.startTime);
  const [endTime, setEndTime] = useState(REGULAR_TRAINING.endTime);
  const [location, setLocation] = useState("Area Latihan TREX Skate School");
  const [topic, setTopic] = useState(
    "Latihan Rutin Sabtu: Keseimbangan, Stopping & Turning"
  );
  const [status, setStatus] = useState<ScheduleStatus>("scheduled");
  const [notes, setNotes] = useState("");

  const loadSchedules = async () => {
    setLoading(true);
    try {
      const snap = await getDocs(
        query(collection(db, "schedules"), orderBy("date", "desc"))
      );
      const list: TrainingSchedule[] = [];
      snap.forEach((d) => {
        list.push({
          id: d.id,
          ...(d.data() as Omit<TrainingSchedule, "id">),
        });
      });
      setSchedules(list);
    } catch (error) {
      console.error("Gagal memuat jadwal:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSchedules();
  }, []);

  const handleCreateSchedule = async (e: FormEvent) => {
    e.preventDefault();
    if (!date) return;
    setSaving(true);

    try {
      const schedRef = doc(collection(db, "schedules"));
      await setDoc(schedRef, {
        date,
        startTime,
        endTime,
        location: location.trim(),
        topic: topic.trim(),
        status,
        notes: notes.trim(),
        createdAt: serverTimestamp(),
      });
      setNotes("");
      await loadSchedules();
    } catch (error) {
      console.error("Gagal membuat jadwal:", error);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteSchedule = async (id: string) => {
    if (!window.confirm("Hapus jadwal latihan ini?")) return;
    try {
      await deleteDoc(doc(db, "schedules", id));
      setSchedules((prev) => prev.filter((item) => item.id !== id));
    } catch (error) {
      console.error("Gagal menghapus jadwal:", error);
    }
  };

  const handleSyncDefaultSkills = async () => {
    setSyncingSkills(true);
    try {
      await Promise.all(
        DEFAULT_SKILLS.map((skill) =>
          setDoc(
            doc(db, "skills", skill.id),
            {
              order: skill.order,
              name: skill.name,
              description: skill.description,
            },
            { merge: true }
          )
        )
      );
      setSkillSyncDone(true);
    } catch (error) {
      console.error("Gagal menyinkronkan kurikulum:", error);
    } finally {
      setSyncingSkills(false);
    }
  };

  return (
    <RoleGuard allowedRoles={["admin"]}>
      <div className="min-h-[85vh] bg-slate-50 pb-14">
        <div className="bg-slate-900 text-white border-b border-slate-800">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 py-7">
            <Link
              href="/admin"
              className="text-xs font-bold text-lime-400 hover:underline"
            >
              ← Kembali ke Dashboard Admin
            </Link>
            <h1 className="text-2xl sm:text-3xl font-black mt-3">
              Jadwal Latihan Sabtu &amp; Kurikulum
            </h1>
            <p className="text-sm text-slate-300 mt-1">
              Atur sesi latihan mingguan (Sabtu 16.00 – 18.00 WIB) dan standar
              kurikulum klub.
            </p>
          </div>
        </div>

        <div className="max-w-5xl mx-auto px-4 sm:px-6 mt-6 space-y-6">
          {/* Sinkronisasi 8 Kurikulum Dasar */}
          <div className="p-5 rounded-2xl bg-slate-900 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-lime-400">
                Standar Penilaian Coach
              </span>
              <h2 className="text-base font-extrabold mt-1">
                Inisialisasi 8 Materi Kurikulum TREX ke Database
              </h2>
              <p className="text-xs text-slate-300 mt-0.5">
                Memastikan daftar skill (Basic Standing hingga Advanced Skating)
                tersedia di Firestore.
              </p>
            </div>
            <button
              type="button"
              onClick={handleSyncDefaultSkills}
              disabled={syncingSkills}
              className="px-4 py-2.5 rounded-xl bg-lime-400 hover:bg-lime-300 text-slate-950 font-extrabold text-xs sm:text-sm shrink-0"
            >
              {syncingSkills
                ? "Menyinkronkan..."
                : skillSyncDone
                ? "✓ 8 Kurikulum Tersimpan"
                : "Sinkronkan Kurikulum"}
            </button>
          </div>

          {/* Form Tambah Jadwal Latihan */}
          <form
            onSubmit={handleCreateSchedule}
            className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 sm:p-6 space-y-4"
          >
            <h2 className="text-lg font-black text-slate-900">
              Buat Sesi Latihan Baru
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Tanggal Latihan (Sabtu) *
                </label>
                <input
                  type="date"
                  required
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Jam Mulai
                </label>
                <input
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Jam Selesai
                </label>
                <input
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Materi / Topik Latihan
                </label>
                <input
                  type="text"
                  required
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Status Sesi
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as ScheduleStatus)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm bg-white"
                >
                  <option value="scheduled">Terjadwal (Normal)</option>
                  <option value="holiday">Libur / Ditiadakan</option>
                  <option value="rescheduled">Jadwal Pengganti</option>
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Lokasi Lapangan
                </label>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Catatan Tambahan
                </label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Opsional..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-lime-400 text-sm font-extrabold disabled:opacity-60"
            >
              {saving ? "Menyimpan..." : "+ Publikasikan Jadwal"}
            </button>
          </form>

          {/* Daftar Jadwal */}
          <div className="space-y-3">
            <h2 className="text-base font-extrabold text-slate-900">
              Daftar Sesi Latihan ({schedules.length})
            </h2>

            {loading ? (
              <p className="text-sm text-slate-500">Memuat jadwal...</p>
            ) : schedules.length === 0 ? (
              <div className="p-6 rounded-2xl bg-white border border-slate-200 text-sm text-slate-500">
                Belum ada sesi latihan tersimpan. Buat jadwal Sabtu terdekat di
                atas.
              </div>
            ) : (
              schedules.map((item) => (
                <div
                  key={item.id}
                  className="p-5 rounded-2xl bg-white border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs font-extrabold px-2.5 py-0.5 rounded-md bg-slate-900 text-lime-400">
                        {item.date}
                      </span>
                      <span className="text-xs font-bold text-slate-700">
                        {item.startTime} – {item.endTime} WIB
                      </span>
                      <span
                        className={`text-[11px] font-extrabold px-2 py-0.5 rounded-full ${
                          item.status === "scheduled"
                            ? "bg-lime-100 text-slate-950"
                            : item.status === "holiday"
                            ? "bg-red-100 text-red-800"
                            : "bg-amber-100 text-amber-900"
                        }`}
                      >
                        {item.status === "scheduled"
                          ? "TERJADWAL"
                          : item.status === "holiday"
                          ? "LIBUR"
                          : "PENGGANTI"}
                      </span>
                    </div>
                    <h3 className="text-base font-black text-slate-900 mt-2">
                      {item.topic}
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Lokasi: {item.location}
                      {item.notes ? ` • Catatan: ${item.notes}` : ""}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleDeleteSchedule(item.id)}
                    className="px-3.5 py-1.5 rounded-lg bg-red-50 text-red-700 text-xs font-bold hover:bg-red-100 self-start sm:self-center shrink-0"
                  >
                    Hapus
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </RoleGuard>
  );
}
