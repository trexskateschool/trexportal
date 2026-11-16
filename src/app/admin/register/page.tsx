"use client";

import { useState, FormEvent } from "react";
import Link from "next/link";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import RoleGuard from "@/components/RoleGuard";

export default function AdminRegisterUserPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"admin" | "coach" | "parent">("coach");

  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const handleRegisterUser = async (e: FormEvent) => {
    e.preventDefault();
    setSuccessMsg("");
    setErrorMsg("");

    const cleanName = name.trim();
    const cleanEmail = email.trim().toLowerCase();

    if (!cleanName || !cleanEmail || password.length < 6) {
      setErrorMsg("Mohon lengkapi nama, email, dan password minimal 6 karakter.");
      return;
    }

    setSubmitting(true);

    try {
      // 1. Buat akun di Firebase Auth
      const cred = await createUserWithEmailAndPassword(auth, cleanEmail, password);
      const uid = cred.user.uid;
      await updateProfile(cred.user, { displayName: cleanName });

      // 2. Simpan profil lengkap ke koleksi 'users' dengan role pilihan admin
      await setDoc(doc(db, "users", uid), {
        uid,
        name: cleanName,
        email: cleanEmail,
        role,
        createdAt: serverTimestamp(),
      });

      setSuccessMsg(
        `Berhasil! Akun baru untuk ${cleanName} (${role.toUpperCase}) berhasil didaftarkan.`
      );
      setName("");
      setEmail("");
      setPassword("");
      setRole("coach");
    } catch (error: unknown) {
      console.error("Gagal mendaftarkan akun:", error);
      const code = (error as { code?: string })?.code;
      if (code === "auth/email-already-in-use") {
        setErrorMsg("Email tersebut sudah terdaftar di sistem.");
      } else {
        setErrorMsg("Gagal membuat akun baru. Periksa koneksi atau input data.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <RoleGuard allowedRoles={["admin"]}>
      <div className="min-h-[85vh] bg-slate-50 pb-16">
        {/* Header */}
        <div className="bg-slate-900 text-white border-b border-slate-800">
          <div className="max-w-2xl mx-auto px-4 sm:px-6 py-7">
            <Link
              href="/admin"
              className="text-xs font-bold text-lime-400 hover:underline"
            >
              ← Kembali ke Dashboard Admin
            </Link>
            <h1 className="text-2xl sm:text-3xl font-black mt-3">
              Pendaftaran Akun Baru (Admin Panel)
            </h1>
            <p className="text-sm text-slate-300 mt-1">
              Buat akun baru secara manual untuk Pelatih (Coach), Admin tambahan, atau Orang Tua dari panel khusus pengurus klub.
            </p>
          </div>
        </div>

        <div className="max-w-2xl mx-auto px-4 sm:px-6 mt-6">
          <form
            onSubmit={handleRegisterUser}
            className="p-6 sm:p-8 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-5"
          >
            {errorMsg && (
              <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-xs sm:text-sm text-red-800 font-medium">
                {errorMsg}
              </div>
            )}

            {successMsg && (
              <div className="p-4 rounded-xl bg-lime-100 border border-lime-400 text-slate-950 text-sm font-bold">
                ✓ {successMsg}
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Nama Lengkap / Panggilan *
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Contoh: Coach Rian / Ibu Siska"
                className="w-full px-3.5 py-3 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-lime-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Hak Akses (Role) *
              </label>
              <select
                value={role}
                onChange={(e) =>
                  setRole(e.target.value as "admin" | "coach" | "parent")
                }
                className="w-full px-3.5 py-3 rounded-xl border border-slate-300 text-sm bg-white font-bold"
              >
                <option value="coach">Coach (Pelatih Lapangan)</option>
                <option value="admin">Admin (Pengurus Klub)</option>
                <option value="parent">Parent (Orang Tua / Wali Murid)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Email Pengguna *
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="nama@email.com"
                className="w-full px-3.5 py-3 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-lime-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Password Sementara *
              </label>
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Minimal 6 karakter"
                className="w-full px-3.5 py-3 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-lime-500"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-4 px-6 rounded-2xl bg-slate-900 hover:bg-slate-800 text-lime-400 font-black text-sm transition-colors disabled:opacity-60"
            >
              {submitting ? "Membuat Akun..." : "Buat & Daftarkan Akun Baru"}
            </button>
          </form>
        </div>
      </div>
    </RoleGuard>
  );
}
