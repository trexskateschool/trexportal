"use client";

import { useEffect, useState, FormEvent } from "react";
import Link from "next/link";
import {
  collection,
  doc,
  getDocs,
  setDoc,
  deleteDoc,
  orderBy,
  query,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import RoleGuard from "@/components/RoleGuard";
import { DEFAULT_SKILLS } from "@/lib/constants";

interface ScheduleItem {
  id: string;
  title: string;
  date: string;
  time: string;
  location: string;
  notes: string;
}

export default function AdminSchedulesPage() {
  const [schedules, setSchedules] = useState<ScheduleItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Form state
  const [title, setTitle] = useState("Latihan Rutin Sabtu");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [time, setTime] = useState("16:00 - 18:00 WIB");
  const [location, setLocation] = useState("Lapangan Utama TREX");
  const [notes, setNotes] = useState("Fokus pemanasan dan evaluasi 8 materi skill dasar.");
  const [saving, setSaving] = useState(false);

  const loadSchedules = async () => {
    setLoading(true);
    try {
      const snap = await getDocs(
        query(collection(db, "schedules"), orderBy("date", "desc"))
      );
      const list: ScheduleItem[] = [];
      snap.forEach((d) => {
        list.push({
          id: d.id,
          ...(d.data() as Omit<ScheduleItem, "id">),
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
    if (!title.trim() || !date) return;
    setSaving(true);

    try {
      const newRef = doc(collection(db, "schedules"));
      await setDoc(newRef, {
        title: title.trim(),
        date,
        time,
        location,
        notes,
        createdAt: serverTimestamp(),
      });

      setTitle("Latihan Rutin Sabtu");
      setNotes("");
      await loadSchedules();
    } catch (error) {
      console.error("Gagal menyimpan jadwal:", error);
      alert("Gagal menyimpan jadwal latihan.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Hapus jadwal ini?")) return;
    try {
      await deleteDoc(doc(db, "schedules", id));
      setSchedules((prev) => prev.filter((s) => s.id !== id));
    } catch (error) {
      console.error("Gagal menghapus jadwal:", error);
    }
  };

  return (
    <RoleGuard allowedRoles={["admin"]}>
      <div className="min-h-[85vh] bg-slate-50 pb-16">
        <div className="bg-slate-900 text-white border-b border-slate-800">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 py-7">
            <Link
              href="/admin"
              className="text-xs font-bold text-lime-400 hover:underline"
            >
              ← Kembali ke Dashboard Admin
            </Link>
            <h1 className="text-2xl sm:text-3xl font-black mt-3">
              Jadwal Latihan Sabtu &amp; Kurikulum 8 Skill
            </h1>
            <p className="text-sm text-slate-300 mt-1">
              Atur agenda sesi latihan mingguan dan tinjau standar materi kurikulum akademi.
            </p>
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-4 sm:px-6 mt-6 space-y-6">
          {/* Form Buat Jadwal */}
          <form
            onSubmit={handleCreateSchedule}
            className="p-5 sm:p-7 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-4"
          >
            <h2 className="text-lg font-black text-slate-900">
              Buat Sesi Latihan Baru
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Judul Sesi *
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Tanggal *
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
                  Waktu
                </label>
                <input
                  type="text"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Lokasi
                </label>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Catatan / Fokus Latihan
                </label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={saving}
              className="px-6 py-3 rounded-xl bg-lime-400 hover:bg-lime-300 text-slate-950 font-extrabold text-sm transition-colors disabled:opacity-60"
            >
              {saving ? "Menyimpan..." : "+ Tambah Jadwal Latihan"}
            </button>
          </form>

          {/* Daftar Jadwal */}
          <div className="space-y-3">
            <h2 className="text-base font-extrabold text-slate-900">
              Agenda Jadwal Tersimpan ({schedules.length})
            </h2>

            {loading ? (
              <p className="text-sm text-slate-500">Memuat jadwal...</p>
            ) : schedules.length === 0 ? (
              <div className="p-6 rounded-2xl bg-white border border-slate-200 text-sm text-slate-600 space-y-2">
                <p className="font-bold text-slate-900">Belum ada jadwal kustom yang dibuat.</p>
                <p className="text-xs text-slate-500">
                  Secara default, akademi rutin berlatih setiap hari <strong>Sabtu pukul 16.00 – 18.00 WIB</strong>. Anda dapat menambahkan jadwal khusus di atas.
                </p>
              </div>
            ) : (
              schedules.map((sch) => (
                <div
                  key={sch.id}
                  className="p-5 rounded-2xl bg-white border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="space-y-1">
                    <span className="text-[11px] font-extrabold px-2 py-0.5 rounded bg-lime-100 text-slate-950">
                      {sch.date} • {sch.time}
                    </span>
                    <h3 className="text-base font-black text-slate-900 mt-1">{sch.title}</h3>
                    <p className="text-xs text-slate-600">Lokasi: {sch.location}</p>
                    {sch.notes && <p className="text-xs text-slate-500">Catatan: {sch.notes}</p>}
                  </div>

                  <button
                    type="button"
                    onClick={() => handleDelete(sch.id)}
                    className="px-3.5 py-1.5 rounded-lg bg-red-50 text-red-700 text-xs font-bold hover:bg-red-100 self-start shrink-0"
                  >
                    Hapus
                  </button>
                </div>
              ))
            )}
          </div>

          {/* Kurikulum 8 Skill Dasar */}
          <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-4 mt-8">
            <div>
              <span className="text-[11px] font-extrabold px-2.5 py-0.5 rounded bg-blue-100 text-blue-900">
                KURIKULUM AKADEMI
              </span>
              <h2 className="text-lg font-black text-slate-900 mt-2">
                Standar 8 Materi Skill Sepatu Roda
              </h2>
              <p className="text-xs text-slate-600 mt-0.5">
                Materi penilaian yang digunakan coach saat evaluasi lapangan setiap hari Sabtu.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {DEFAULT_SKILLS.map((skill) => (
                <div key={skill.id} className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-start gap-3">
                  <span className="w-7 h-7 rounded-lg bg-slate-900 text-lime-400 font-black text-xs flex items-center justify-center shrink-0">
                    {skill.order}
                  </span>
                  <div>
                    <h3 className="text-sm font-black text-slate-900">{skill.name}</h3>
                    <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{skill.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </RoleGuard>
  );
}
