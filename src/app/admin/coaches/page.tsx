"use client";

import { useEffect, useState, FormEvent } from "react";
import Link from "next/link";
import {
  collection,
  getDocs,
  doc,
  setDoc,
  deleteDoc,
  updateDoc,
  query,
  where,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import RoleGuard from "@/components/RoleGuard";
import { CoachProfile, UserRole } from "@/types/database";

export default function AdminCoachesPage() {
  const [coaches, setCoaches] = useState<CoachProfile[]>([]);
  const [loading, setLoading] = useState(true);

  // Form Profil Coach
  const [name, setName] = useState("");
  const [specialization, setSpecialization] = useState("");
  const [experience, setExperience] = useState("");
  const [bio, setBio] = useState("");
  const [savingCoach, setSavingCoach] = useState(false);

  // Form Atur Hak Akses Akun (Role User)
  const [targetEmail, setTargetEmail] = useState("");
  const [targetRole, setTargetRole] = useState<UserRole>("coach");
  const [updatingRole, setUpdatingRole] = useState(false);
  const [roleFeedback, setRoleFeedback] = useState<{
    type: "ok" | "err";
    text: string;
  } | null>(null);

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
    if (!name.trim()) return;
    setSavingCoach(true);

    try {
      const coachRef = doc(collection(db, "coaches"));
      await setDoc(coachRef, {
        name: name.trim(),
        specialization: specialization.trim() || "Fundamental & Youth Skating",
        experience: experience.trim() || "Pelatih Resmi TREX Skate School",
        bio: bio.trim(),
        isActive: true,
        createdAt: serverTimestamp(),
      });

      setName("");
      setSpecialization("");
      setExperience("");
      setBio("");
      await loadCoaches();
    } catch (error) {
      console.error("Gagal menambah coach:", error);
    } finally {
      setSavingCoach(false);
    }
  };

  const handleDeleteCoach = async (id: string, coachName: string) => {
    if (!window.confirm(`Hapus profil Coach ${coachName}?`)) return;
    try {
      await deleteDoc(doc(db, "coaches", id));
      setCoaches((prev) => prev.filter((c) => c.id !== id));
    } catch (error) {
      console.error("Gagal menghapus coach:", error);
    }
  };

  const handleAssignUserRole = async (e: FormEvent) => {
    e.preventDefault();
    if (!targetEmail.trim()) return;
    setUpdatingRole(true);
    setRoleFeedback(null);

    try {
      const q = query(
        collection(db, "users"),
        where("email", "==", targetEmail.trim())
      );
      const snap = await getDocs(q);

      if (snap.empty) {
        setRoleFeedback({
          type: "err",
          text: "Email belum ditemukan. Minta coach login/daftar dulu di halaman /login.",
        });
      } else {
        const userDoc = snap.docs[0];
        await updateDoc(doc(db, "users", userDoc.id), {
          role: targetRole,
          updatedAt: serverTimestamp(),
        });
        setRoleFeedback({
          type: "ok",
          text: `Berhasil! Akun ${targetEmail.trim()} kini memiliki hak akses "${targetRole.toUpperCase()}".`,
        });
        setTargetEmail("");
      }
    } catch (error) {
      console.error("Gagal mengubah role akun:", error);
      setRoleFeedback({
        type: "err",
        text: "Terjadi kesalahan saat mengubah hak akses akun.",
      });
    } finally {
      setUpdatingRole(false);
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
              Tim Coach &amp; Hak Akses Akun
            </h1>
            <p className="text-sm text-slate-300 mt-1">
              Kelola daftar pelatih klub dan berikan akses panel coach ke akun
              pelatih.
            </p>
          </div>
        </div>

        <div className="max-w-5xl mx-auto px-4 sm:px-6 mt-6 space-y-6">
          {/* Bagian 1: Berikan Hak Akses Coach / Admin ke Akun Terdaftar */}
          <form
            onSubmit={handleAssignUserRole}
            className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 sm:p-6 space-y-4"
          >
            <div>
              <span className="text-[11px] font-extrabold px-2.5 py-0.5 rounded-md bg-blue-100 text-blue-900">
                IZIN LOGIN PELATIH
              </span>
              <h2 className="text-lg font-black text-slate-900 mt-2">
                Atur Hak Akses Akun (Coach / Admin)
              </h2>
              <p className="text-xs sm:text-sm text-slate-600">
                Masukkan email pelatih yang sudah pernah login ke portal agar
                bisa membuka halaman absensi dan evaluasi murid.
              </p>
            </div>

            {roleFeedback && (
              <div
                className={`p-3.5 rounded-xl text-xs sm:text-sm font-medium border ${
                  roleFeedback.type === "ok"
                    ? "bg-lime-50 border-lime-400 text-slate-900"
                    : "bg-red-50 border-red-200 text-red-800"
                }`}
              >
                {roleFeedback.text}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <input
                type="email"
                required
                value={targetEmail}
                onChange={(e) => setTargetEmail(e.target.value)}
                placeholder="Email akun pelatih..."
                className="sm:col-span-2 px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm"
              />
              <select
                value={targetRole}
                onChange={(e) => setTargetRole(e.target.value as UserRole)}
                className="px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm bg-white font-bold"
              >
                <option value="coach">Jadikan COACH</option>
                <option value="admin">Jadikan ADMIN</option>
                <option value="parent">Kembalikan ke PARENT</option>
              </select>
            </div>

            <button
              type="submit"
              disabled={updatingRole}
              className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-lime-400 text-sm font-extrabold disabled:opacity-60"
            >
              {updatingRole ? "Memperbarui..." : "Simpan Hak Akses"}
            </button>
          </form>

          {/* Bagian 2: Tambah Profil Coach */}
          <form
            onSubmit={handleAddCoach}
            className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 sm:p-6 space-y-4"
          >
            <h2 className="text-lg font-black text-slate-900">
              Tambah Profil Pelatih ke Database
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nama Lengkap Coach *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Contoh: Coach Dimas"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Spesialisasi
                </label>
                <input
                  type="text"
                  value={specialization}
                  onChange={(e) => setSpecialization(e.target.value)}
                  placeholder="Contoh: Fundamental & Balance Anak"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Pengalaman / Deskripsi Singkat
                </label>
                <input
                  type="text"
                  value={experience}
                  onChange={(e) => setExperience(e.target.value)}
                  placeholder="Contoh: 5 tahun melatih sepatu roda usia dini dan pemula."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={savingCoach}
              className="px-5 py-2.5 rounded-xl bg-lime-400 hover:bg-lime-300 text-slate-950 text-sm font-extrabold disabled:opacity-60"
            >
              {savingCoach ? "Menyimpan..." : "+ Simpan Profil Coach"}
            </button>
          </form>

          {/* Daftar Coach Terdaftar */}
          <div>
            <h2 className="text-base font-extrabold text-slate-900 mb-3">
              Daftar Coach Aktif ({coaches.length})
            </h2>
            {loading ? (
              <p className="text-sm text-slate-500">Memuat daftar coach...</p>
            ) : coaches.length === 0 ? (
              <div className="p-6 rounded-2xl bg-white border border-slate-200 text-sm text-slate-500">
                Belum ada profil coach di database. Tambahkan melalui form di
                atas.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {coaches.map((c) => (
                  <div
                    key={c.id}
                    className="p-5 rounded-2xl bg-white border border-slate-200 flex items-start justify-between gap-4"
                  >
                    <div>
                      <h3 className="text-base font-black text-slate-900">
                        {c.name}
                      </h3>
                      <p className="text-xs font-bold text-blue-900 uppercase mt-0.5">
                        {c.specialization}
                      </p>
                      <p className="text-xs text-slate-600 mt-2">
                        {c.experience}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleDeleteCoach(c.id, c.name)}
                      className="px-3 py-1.5 rounded-lg bg-red-50 text-red-700 text-xs font-bold hover:bg-red-100 shrink-0"
                    >
                      Hapus
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </RoleGuard>
  );
}
