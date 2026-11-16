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

interface CompetitionItem {
  id: string;
  title: string;
  eventDate: string;
  location: string;
  status: "open" | "upcoming" | "completed";
  description: string;
}

export default function AdminCompetitionsPage() {
  const [competitions, setCompetitions] = useState<CompetitionItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Form state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [location, setLocation] = useState("");
  const [status, setStatus] = useState<"open" | "upcoming" | "completed">("upcoming");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");

  const loadCompetitions = async () => {
    setLoading(true);
    try {
      const snap = await getDocs(collection(db, "competitions"));
      const list: CompetitionItem[] = [];
      snap.forEach((d) => {
        list.push({
          id: d.id,
          ...(d.data() as Omit<CompetitionItem, "id">),
        });
      });
      list.sort((a, b) => b.eventDate.localeCompare(a.eventDate));
      setCompetitions(list);
    } catch (error) {
      console.error("Gagal memuat kompetisi:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCompetitions();
  }, []);

  const resetForm = () => {
    setEditingId(null);
    setTitle("");
    setEventDate("");
    setLocation("");
    setStatus("upcoming");
    setDescription("");
  };

  const handleEditClick = (item: CompetitionItem) => {
    setEditingId(item.id);
    setTitle(item.title || "");
    setEventDate(item.eventDate || "");
    setLocation(item.location || "");
    setStatus(item.status || "upcoming");
    setDescription(item.description || "");
    setSuccessMsg("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !eventDate.trim()) return;
    setSaving(true);
    setSuccessMsg("");

    try {
      const payload = {
        title: title.trim(),
        eventDate: eventDate.trim(),
        location: location.trim() || "Venue Menyusul",
        status,
        description: description.trim(),
        updatedAt: serverTimestamp(),
      };

      if (editingId) {
        await updateDoc(doc(db, "competitions", editingId), payload);
        setSuccessMsg(`Agenda "${title.trim()}" berhasil diperbarui.`);
      } else {
        const newRef = doc(collection(db, "competitions"));
        await setDoc(newRef, {
          ...payload,
          createdAt: serverTimestamp(),
        });
        setSuccessMsg(`Agenda "${title.trim()}" berhasil ditambahkan.`);
      }

      resetForm();
      await loadCompetitions();
    } catch (error) {
      console.error("Gagal menyimpan agenda kompetisi:", error);
      alert("Gagal menyimpan agenda kompetisi. Periksa Firestore Rules Anda.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string, compTitle: string) => {
    if (!window.confirm(`Hapus agenda "${compTitle}"?`)) return;
    try {
      await deleteDoc(doc(db, "competitions", id));
      if (editingId === id) resetForm();
      setCompetitions((prev) => prev.filter((c) => c.id !== id));
    } catch (error) {
      console.error("Gagal menghapus agenda:", error);
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
              Kelola Agenda Kompetisi
            </h1>
            <p className="text-sm text-slate-300 mt-1">
              Tambah atau edit jadwal kejuaraan dan festival yang tampil di menu Agenda Kompetisi.
            </p>
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-4 sm:px-6 mt-6 space-y-6">
          {successMsg && (
            <div className="p-4 rounded-xl bg-lime-100 border border-lime-400 text-slate-950 text-sm font-bold">
              ✓ {successMsg}
            </div>
          )}

          {/* Form Tambah / Edit Kompetisi */}
          <form
            onSubmit={handleSubmit}
            className="p-5 sm:p-7 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-4"
          >
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-black text-slate-900">
                {editingId ? "Edit Agenda Kompetisi" : "Tambah Agenda Kompetisi Baru"}
              </h2>
              {editingId && (
                <button
                  type="button"
                  onClick={resetForm}
                  className="text-xs font-bold text-slate-500 hover:text-slate-800 underline"
                >
                  Batal Edit
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nama Kompetisi / Kejuaraan *
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Contoh: TREX Internal Cup & Fun Slalom"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Tanggal Pelaksanaan *
                </label>
                <input
                  type="date"
                  required
                  value={eventDate}
                  onChange={(e) => setEventDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Lokasi / Venue *
                </label>
                <input
                  type="text"
                  required
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="Contoh: Arena Sepatu Roda Jakarta"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Status Pendaftaran
                </label>
                <select
                  value={status}
                  onChange={(e) =>
                    setStatus(e.target.value as "open" | "upcoming" | "completed")
                  }
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-bold bg-white"
                >
                  <option value="upcoming">Agenda Mendatang</option>
                  <option value="open">Pendaftaran Dibuka</option>
                  <option value="completed">Selesai</option>
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Keterangan / Kategori Lomba
                </label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Contoh: Terbuka untuk kategori Pemula, Standar, dan Speed. Pendaftaran melalui wali murid."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={saving}
              className="px-6 py-3 rounded-xl bg-lime-400 hover:bg-lime-300 text-slate-950 font-extrabold text-sm transition-colors disabled:opacity-60"
            >
              {saving
                ? "Menyimpan..."
                : editingId
                ? "Simpan Perubahan"
                : "+ Tambah Agenda Kompetisi"}
            </button>
          </form>

          {/* Daftar Kompetisi */}
          <div className="space-y-3">
            <h2 className="text-base font-extrabold text-slate-900">
              Daftar Agenda Kompetisi ({competitions.length})
            </h2>

            {loading ? (
              <p className="text-sm text-slate-500">Memuat agenda...</p>
            ) : competitions.length === 0 ? (
              <div className="p-6 rounded-2xl bg-white border border-slate-200 text-sm text-slate-500">
                Belum ada agenda kompetisi. Isi form di atas untuk menampilkan jadwal lomba di website.
              </div>
            ) : (
              competitions.map((comp) => (
                <div
                  key={comp.id}
                  className="p-5 rounded-2xl bg-white border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="space-y-1">
                    <span className="text-[11px] font-extrabold px-2 py-0.5 rounded bg-blue-100 text-blue-900">
                      {comp.eventDate} • {comp.location}
                    </span>
                    <h3 className="text-base font-black text-slate-900 mt-1">
                      {comp.title}
                    </h3>
                    {comp.description && (
                      <p className="text-xs text-slate-600 leading-relaxed">
                        {comp.description}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-2 self-start sm:self-center shrink-0">
                    <button
                      type="button"
                      onClick={() => handleEditClick(comp)}
                      className="px-3.5 py-1.5 rounded-lg bg-slate-900 text-lime-400 text-xs font-bold hover:bg-slate-800"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(comp.id, comp.title)}
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
      </div>
    </RoleGuard>
  );
}
