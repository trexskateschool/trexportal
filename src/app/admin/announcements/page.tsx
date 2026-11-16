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
import { useAuth } from "@/context/AuthContext";
import RoleGuard from "@/components/RoleGuard";

export interface ClubAnnouncement {
  id: string;
  title: string;
  category: "training" | "competition" | "general";
  eventDate: string;
  content: string;
  authorName: string;
}

export default function AdminAnnouncementsPage() {
  const { userProfile } = useAuth();
  const [items, setItems] = useState<ClubAnnouncement[]>([]);
  const [loading, setLoading] = useState(true);

  // Form states
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<
    "training" | "competition" | "general"
  >("training");
  const [eventDate, setEventDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [content, setContent] = useState("");
  const [saving, setSaving] = useState(false);

  const loadAnnouncements = async () => {
    setLoading(true);
    try {
      const snap = await getDocs(
        query(collection(db, "announcements"), orderBy("eventDate", "desc"))
      );
      const list: ClubAnnouncement[] = [];
      snap.forEach((d) => {
        list.push({
          id: d.id,
          ...(d.data() as Omit<ClubAnnouncement, "id">),
        });
      });
      setItems(list);
    } catch (error) {
      console.error("Gagal memuat pengumuman:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAnnouncements();
  }, []);

  const handlePublish = async (e: FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;
    setSaving(true);

    try {
      const newRef = doc(collection(db, "announcements"));
      await setDoc(newRef, {
        title: title.trim(),
        category,
        eventDate,
        content: content.trim(),
        authorName: userProfile?.name || "Admin TREX",
        createdAt: serverTimestamp(),
      });

      setTitle("");
      setContent("");
      await loadAnnouncements();
    } catch (error) {
      console.error("Gagal menerbitkan pengumuman:", error);
      alert("Gagal menyimpan pengumuman. Periksa koneksi Anda.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string, itemTitle: string) => {
    if (!window.confirm(`Hapus pengumuman "${itemTitle}"?`)) return;
    try {
      await deleteDoc(doc(db, "announcements", id));
      setItems((prev) => prev.filter((item) => item.id !== id));
    } catch (error) {
      console.error("Gagal menghapus pengumuman:", error);
    }
  };

  const categoryBadge = (cat: ClubAnnouncement["category"]) => {
    if (cat === "competition") {
      return {
        label: "KOMPETISI / LOMBA",
        cls: "bg-blue-100 text-blue-900",
      };
    }
    if (cat === "training") {
      return {
        label: "INFO LATIHAN",
        cls: "bg-lime-200 text-slate-950",
      };
    }
    return {
      label: "PENGUMUMAN KLUB",
      cls: "bg-slate-200 text-slate-800",
    };
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
              Pengumuman &amp; Agenda Kompetisi
            </h1>
            <p className="text-sm text-slate-300 mt-1">
              Publikasikan informasi latihan Sabtu atau jadwal kejuaraan yang
              langsung tampil di portal wali murid.
            </p>
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-4 sm:px-6 mt-6 space-y-6">
          {/* Form Buat Pengumuman */}
          <form
            onSubmit={handlePublish}
            className="p-5 sm:p-7 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-4"
          >
            <h2 className="text-lg font-black text-slate-900">
              Buat Pengumuman Baru
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Judul Pengumuman / Lomba *
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Contoh: Kejuaraan Sepatu Roda Pemula & Latihan Tambahan"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Kategori
                </label>
                <select
                  value={category}
                  onChange={(e) =>
                    setCategory(
                      e.target.value as "training" | "competition" | "general"
                    )
                  }
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm bg-white"
                >
                  <option value="training">Info Latihan</option>
                  <option value="competition">Kompetisi / Lomba</option>
                  <option value="general">Pengumuman Umum</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Tanggal Acara / Berlaku
                </label>
                <input
                  type="date"
                  required
                  value={eventDate}
                  onChange={(e) => setEventDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Isi Pengumuman *
                </label>
                <textarea
                  rows={3}
                  required
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Tulis detail waktu, perlengkapan wajib (helm, protector, air minum), atau info pendaftaran lomba..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={saving}
              className="px-6 py-3 rounded-xl bg-lime-400 hover:bg-lime-300 text-slate-950 font-extrabold text-sm transition-colors disabled:opacity-60"
            >
              {saving ? "Menerbitkan..." : "+ Publikasikan Pengumuman"}
            </button>
          </form>

          {/* Daftar Pengumuman Terbit */}
          <div className="space-y-3">
            <h2 className="text-base font-extrabold text-slate-900">
              Pengumuman Aktif ({items.length})
            </h2>

            {loading ? (
              <p className="text-sm text-slate-500">Memuat pengumuman...</p>
            ) : items.length === 0 ? (
              <div className="p-6 rounded-2xl bg-white border border-slate-200 text-sm text-slate-500">
                Belum ada pengumuman yang diterbitkan.
              </div>
            ) : (
              items.map((item) => {
                const badge = categoryBadge(item.category);
                return (
                  <div
                    key={item.id}
                    className="p-5 rounded-2xl bg-white border border-slate-200 flex flex-col sm:flex-row sm:items-start justify-between gap-4"
                  >
                    <div className="space-y-1.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={`text-[11px] font-extrabold px-2.5 py-0.5 rounded-md ${badge.cls}`}
                        >
                          {badge.label}
                        </span>
                        <span className="text-xs font-bold text-slate-500">
                          {item.eventDate}
                        </span>
                      </div>
                      <h3 className="text-base font-black text-slate-900">
                        {item.title}
                      </h3>
                      <p className="text-sm text-slate-600 leading-relaxed">
                        {item.content}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleDelete(item.id, item.title)}
                      className="px-3.5 py-1.5 rounded-lg bg-red-50 text-red-700 text-xs font-bold hover:bg-red-100 self-start shrink-0"
                    >
                      Hapus
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </RoleGuard>
  );
}
