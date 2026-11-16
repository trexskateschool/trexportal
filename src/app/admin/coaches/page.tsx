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

interface CoachProfile {
  id: string;
  name: string;
  email: string;
  phone: string;
  specialty: string;
}

export default function AdminCoachesPage() {
  const [coaches, setCoaches] = useState<CoachProfile[]>([]);
  const [loading, setLoading] = useState(true);

  // Form state
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [specialty, setSpecialty] = useState("Speed & Slalom Dasar");
  const [saving, setSaving] = useState(false);

  const loadCoaches = async () => {
    setLoading(true);
    try {
      const snap = await getDocs(
        query(collection(db, "coaches"), orderBy("name", "asc"))
      );
      const list: CoachProfile[] = [];
      snap.forEach((d) => {
        list.push({
          id: d.id,
          ...(d.data() as Omit<CoachProfile, "id">),
        });
      });
      setCoaches(list);
    } catch (error) {
      console.error("Gagal memuat tim coach:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCoaches();
  }, []);

  const handleAddCoach = async (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) return;
    setSaving(true);

    try {
      const newRef = doc(collection(db, "coaches"));
      await setDoc(newRef, {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        phone: phone.trim(),
        specialty,
        createdAt: serverTimestamp(),
      });

      setName("");
      setEmail("");
      setPhone("");
      await loadCoaches();
    } catch (error) {
      console.error("Gagal menyimpan data coach:", error);
      alert("Gagal menambahkan pelatih.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string, coachName: string) => {
    if (!window.confirm(`Hapus pelatih ${coachName}?`)) return;
    try {
      await deleteDoc(doc(db, "coaches", id));
      setCoaches((prev) => prev.filter((c) => c.id !== id));
    } catch (error) {
      console.error("Gagal menghapus coach:", error);
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
              Tim Coach &amp; Hak Akses Lapangan
            </h1>
            <p className="text-sm text-slate-300 mt-1">
              Kelola daftar pelatih aktif yang bertugas mengisi absensi dan evaluasi skill hari Sabtu.
            </p>
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-4 sm:px-6 mt-6 space-y-6">
          {/* Form Tambah Coach */}
          <form
            onSubmit={handleAddCoach}
            className="p-5 sm:p-7 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-4"
          >
            <h2 className="text-lg font-black text-slate-900">
              Tambah Profil Coach Baru
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nama Lengkap &amp; Gelar *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Contoh: Coach Rian Pratama"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Email Akun Login *
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="coach@email.com"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nomor WhatsApp
                </label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="08123456789"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Spesialisasi Latihan
                </label>
                <input
                  type="text"
                  value={specialty}
                  onChange={(e) => setSpecialty(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={saving}
              className="px-6 py-3 rounded-xl bg-lime-400 hover:bg-lime-300 text-slate-950 font-extrabold text-sm transition-colors disabled:opacity-60"
            >
              {saving ? "Menyimpan..." : "+ Tambah Tim Pelatih"}
            </button>
          </form>

          {/* Daftar Coach */}
          <div className="space-y-3">
            <h2 className="text-base font-extrabold text-slate-900">
              Daftar Coach Aktif ({coaches.length})
            </h2>

            {loading ? (
              <p className="text-sm text-slate-500">Memuat data pelatih...</p>
            ) : coaches.length === 0 ? (
              <div className="p-6 rounded-2xl bg-white border border-slate-200 text-sm text-slate-600 space-y-1">
                <p className="font-bold text-slate-900">Belum ada profil pelatih yang ditambahkan.</p>
                <p className="text-xs text-slate-500">
                  Tambahkan email coach ke dalam form di atas agar mereka dapat login dan mengakses menu absensi lapangan.
                </p>
              </div>
            ) : (
              coaches.map((c) => (
                <div
                  key={c.id}
                  className="p-5 rounded-2xl bg-white border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-black text-slate-900">{c.name}</h3>
                      <span className="text-[10px] font-extrabold px-2 py-0.5 rounded bg-lime-200 text-slate-950 uppercase">
                        {c.specialty}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600">Email: <strong className="font-mono">{c.email}</strong></p>
                    {c.phone && <p className="text-xs text-slate-500">WhatsApp: {c.phone}</p>}
                  </div>

                  <button
                    type="button"
                    onClick={() => handleDelete(c.id, c.name)}
                    className="px-3.5 py-1.5 rounded-lg bg-red-50 text-red-700 text-xs font-bold hover:bg-red-100 self-start shrink-0"
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
