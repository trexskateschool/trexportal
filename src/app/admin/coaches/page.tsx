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

interface CoachProfile {
  id: string;
  name: string;
  email: string;
  phone: string;
  specialty: string;
  bio: string;
}

export default function AdminCoachesPage() {
  const [coaches, setCoaches] = useState<CoachProfile[]>([]);
  const [loading, setLoading] = useState(true);

  // Form state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [specialty, setSpecialty] = useState("Speed & Slalom Dasar");
  const [bio, setBio] = useState("");
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");

  const loadCoaches = async () => {
    setLoading(true);
    try {
      const snap = await getDocs(collection(db, "coaches"));
      const list: CoachProfile[] = [];
      snap.forEach((d) => {
        list.push({
          id: d.id,
          ...(d.data() as Omit<CoachProfile, "id">),
        });
      });
      list.sort((a, b) => a.name.localeCompare(b.name));
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

  const resetForm = () => {
    setEditingId(null);
    setName("");
    setEmail("");
    setPhone("");
    setSpecialty("Speed & Slalom Dasar");
    setBio("");
  };

  const handleEditClick = (coach: CoachProfile) => {
    setEditingId(coach.id);
    setName(coach.name || "");
    setEmail(coach.email || "");
    setPhone(coach.phone || "");
    setSpecialty(coach.specialty || "");
    setBio(coach.bio || "");
    setSuccessMsg("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    setSuccessMsg("");

    try {
      const payload = {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        phone: phone.trim(),
        specialty: specialty.trim(),
        bio: bio.trim(),
        updatedAt: serverTimestamp(),
      };

      if (editingId) {
        await updateDoc(doc(db, "coaches", editingId), payload);
        setSuccessMsg(`Profil ${name.trim()} berhasil diperbarui.`);
      } else {
        const newRef = doc(collection(db, "coaches"));
        await setDoc(newRef, {
          ...payload,
          createdAt: serverTimestamp(),
        });
        setSuccessMsg(`Pelatih ${name.trim()} berhasil ditambahkan.`);
      }

      resetForm();
      await loadCoaches();
    } catch (error) {
      console.error("Gagal menyimpan data coach:", error);
      alert("Gagal menyimpan profil pelatih. Periksa Firestore Rules Anda.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string, coachName: string) => {
    if (!window.confirm(`Hapus profil pelatih ${coachName}?`)) return;
    try {
      await deleteDoc(doc(db, "coaches", id));
      if (editingId === id) resetForm();
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
              Kelola Profil Tim Coach
            </h1>
            <p className="text-sm text-slate-300 mt-1">
              Tambah atau edit profil pelatih yang ditampilkan pada halaman publik Tim Coach.
            </p>
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-4 sm:px-6 mt-6 space-y-6">
          {successMsg && (
            <div className="p-4 rounded-xl bg-lime-100 border border-lime-400 text-slate-950 text-sm font-bold">
              ✓ {successMsg}
            </div>
          )}

          {/* Form Tambah / Edit Coach */}
          <form
            onSubmit={handleSubmit}
            className="p-5 sm:p-7 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-4"
          >
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-black text-slate-900">
                {editingId ? "Edit Profil Coach" : "Tambah Profil Coach Baru"}
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
                  Spesialisasi / Jabatan *
                </label>
                <input
                  type="text"
                  required
                  value={specialty}
                  onChange={(e) => setSpecialty(e.target.value)}
                  placeholder="Contoh: Head Coach - Speed & Slalom"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Email Akun Login (Opsional)
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="coach@email.com"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nomor WhatsApp (Opsional)
                </label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="08123456789"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Deskripsi / Pengalaman Melatih (Tampil di Halaman Publik)
                </label>
                <textarea
                  rows={3}
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Contoh: Berpengalaman melatih atlet junior dan pembinaan teknik dasar keseimbangan anak."
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
                : "+ Tambah Profil Coach"}
            </button>
          </form>

          {/* Daftar Coach */}
          <div className="space-y-3">
            <h2 className="text-base font-extrabold text-slate-900">
              Daftar Profil Coach ({coaches.length})
            </h2>

            {loading ? (
              <p className="text-sm text-slate-500">Memuat data pelatih...</p>
            ) : coaches.length === 0 ? (
              <div className="p-6 rounded-2xl bg-white border border-slate-200 text-sm text-slate-500">
                Belum ada profil pelatih. Isi form di atas untuk menampilkan profil pelatih di website.
              </div>
            ) : (
              coaches.map((c) => (
                <div
                  key={c.id}
                  className="p-5 rounded-2xl bg-white border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-base font-black text-slate-900">
                        {c.name}
                      </h3>
                      <span className="text-[10px] font-extrabold px-2 py-0.5 rounded bg-lime-200 text-slate-950 uppercase">
                        {c.specialty}
                      </span>
                    </div>
                    {c.bio && (
                      <p className="text-xs text-slate-600 leading-relaxed">
                        {c.bio}
                      </p>
                    )}
                    {c.email && (
                      <p className="text-[11px] text-slate-400 font-mono">
                        Email: {c.email}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-2 self-start sm:self-center shrink-0">
                    <button
                      type="button"
                      onClick={() => handleEditClick(c)}
                      className="px-3.5 py-1.5 rounded-lg bg-slate-900 text-lime-400 text-xs font-bold hover:bg-slate-800"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(c.id, c.name)}
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
