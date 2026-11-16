"use client";

import { useState, FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
} from "firebase/auth";
import { collection, doc, setDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import { SkillLevelCategory, StudentProfile } from "@/types/database";

function generateClaimCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let result = "";
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

function generateStudentCode(): string {
  const year = new Date().getFullYear();
  const rand = Math.floor(1000 + Math.random() * 8999);
  return `TRX-${year}-${rand}`;
}

export default function PublicRegistrationPage() {
  const router = useRouter();
  const { firebaseUser, userProfile } = useAuth();

  // Data Anak
  const [fullName, setFullName] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [gender, setGender] = useState<"L" | "P">("L");
  const [level, setLevel] = useState<SkillLevelCategory>("Beginner");

  // Data & Akun Orang Tua
  const [parentName, setParentName] = useState(userProfile?.name || "");
  const [parentWhatsapp, setParentWhatsapp] = useState("");
  const [email, setEmail] = useState(firebaseUser?.email || "");
  const [password, setPassword] = useState("");
  const [notes, setNotes] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleRegister = async (e: FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    const cleanChildName = fullName.trim();
    const cleanParentName = (parentName || userProfile?.name || "").trim();
    const cleanWhatsapp = parentWhatsapp.trim();
    const cleanEmail = email.trim().toLowerCase();

    if (!cleanChildName || !cleanParentName || !cleanWhatsapp) {
      setErrorMsg("Mohon lengkapi nama anak, nama orang tua, dan nomor WhatsApp.");
      return;
    }

    if (!firebaseUser && (!cleanEmail || password.length < 6)) {
      setErrorMsg(
        "Masukkan email aktif dan password minimal 6 karakter untuk akun Portal Orang Tua."
      );
      return;
    }

    setSubmitting(true);

    try {
      let parentUid = firebaseUser?.uid || "";

      // 1. Buat akun orang tua otomatis jika belum login
      if (!parentUid) {
        try {
          const cred = await createUserWithEmailAndPassword(
            auth,
            cleanEmail,
            password
          );
          parentUid = cred.user.uid;
          await updateProfile(cred.user, { displayName: cleanParentName });

          await setDoc(doc(db, "users", parentUid), {
            uid: parentUid,
            name: cleanParentName,
            email: cleanEmail,
            role: "parent",
            createdAt: serverTimestamp(),
          });
        } catch (authErr: unknown) {
          const code = (authErr as { code?: string })?.code;
          if (code === "auth/email-already-in-use") {
            // Jika email sudah pernah terdaftar, coba login otomatis dengan password yang diisi
            try {
              const loginCred = await signInWithEmailAndPassword(
                auth,
                cleanEmail,
                password
              );
              parentUid = loginCred.user.uid;
            } catch {
              setErrorMsg(
                "Email ini sudah terdaftar. Masukkan password akun Anda yang benar atau login terlebih dahulu."
              );
              setSubmitting(false);
              return;
            }
          } else if (code === "auth/invalid-email") {
            setErrorMsg("Format alamat email tidak valid.");
            setSubmitting(false);
            return;
          } else {
            throw authErr;
          }
        }
      }

      // 2. Simpan data murid dan langsung tautkan ke parentUid
      const studentCode = generateStudentCode();
      const claimCode = generateClaimCode();
      const todayStr = new Date().toISOString().split("T")[0];
      const studentRef = doc(collection(db, "students"));

      const newStudent: Omit<StudentProfile, "id"> = {
        studentCode,
        claimCode,
        fullName: cleanChildName,
        birthDate: birthDate || "2018-01-01",
        gender,
        level,
        coachId: "",
        coachName: "Tim Coach TREX",
        parentName: cleanParentName,
        parentWhatsapp: cleanWhatsapp,
        parentUids: [parentUid],
        status: "pending",
        registeredAt: todayStr,
      };

      await setDoc(studentRef, {
        ...newStudent,
        parentEmail: cleanEmail || firebaseUser?.email || "",
        registrationNotes: notes.trim(),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      // Simpan kode klaim sebagai arsip (sudah berstatus tertaut)
      await setDoc(doc(db, "claimCodes", claimCode), {
        code: claimCode,
        studentId: studentRef.id,
        studentName: cleanChildName,
        isClaimed: true,
        claimedBy: parentUid,
        createdAt: serverTimestamp(),
      });

      // 3. Langsung arahkan ke Portal Orang Tua (data anak sudah otomatis tampil)
      router.replace("/parent");
    } catch (error) {
      console.error("Gagal memproses pendaftaran:", error);
      setErrorMsg(
        "Pendaftaran gagal dikirim. Periksa koneksi internet Anda lalu coba lagi."
      );
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-[88vh] bg-slate-50 pb-16">
      {/* Header */}
      <div className="bg-slate-950 text-white border-b border-slate-800">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8">
          <Link
            href="/"
            className="text-xs font-bold text-lime-400 hover:underline"
          >
            ← Kembali ke Halaman Utama
          </Link>
          <span className="block mt-4 text-[11px] font-extrabold uppercase tracking-widest text-lime-400">
            Pendaftaran Anggota Baru
          </span>
          <h1 className="text-2xl sm:text-3xl font-black mt-1">
            Formulir Murid TREX Skate School
          </h1>
          <p className="text-sm text-slate-300 mt-1.5">
            Latihan rutin setiap <strong>Sabtu pukul 16.00 – 18.00 WIB</strong>.
            Data anak otomatis terhubung ke Portal Orang Tua setelah mendaftar.
          </p>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 sm:px-6 mt-6">
        <form
          onSubmit={handleRegister}
          className="p-6 sm:p-8 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-5"
        >
          {errorMsg && (
            <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-xs sm:text-sm text-red-800 font-medium">
              {errorMsg}
            </div>
          )}

          {/* BAGIAN 1: DATA ANAK */}
          <div>
            <h2 className="text-lg font-black text-slate-900">
              1. Data Anak (Calon Murid)
            </h2>
            <p className="text-xs text-slate-500">
              Isi identitas anak yang akan mengikuti latihan.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Nama Lengkap Anak *
              </label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Contoh: Arka Pratama"
                className="w-full px-3.5 py-3 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-lime-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Tanggal Lahir *
              </label>
              <input
                type="date"
                required
                value={birthDate}
                onChange={(e) => setBirthDate(e.target.value)}
                className="w-full px-3.5 py-3 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-lime-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Jenis Kelamin
              </label>
              <select
                value={gender}
                onChange={(e) => setGender(e.target.value as "L" | "P")}
                className="w-full px-3.5 py-3 rounded-xl border border-slate-300 text-sm bg-white"
              >
                <option value="L">Laki-laki</option>
                <option value="P">Perempuan</option>
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Pengalaman Sepatu Roda Saat Ini
              </label>
              <select
                value={level}
                onChange={(e) =>
                  setLevel(e.target.value as SkillLevelCategory)
                }
                className="w-full px-3.5 py-3 rounded-xl border border-slate-300 text-sm bg-white"
              >
                <option value="Beginner">
                  Beginner — Baru mulai / belum pernah belajar
                </option>
                <option value="Intermediate">
                  Intermediate — Sudah bisa meluncur &amp; mengerem dasar
                </option>
                <option value="Advanced">
                  Advanced — Sudah mahir &amp; siap latihan lanjutan
                </option>
              </select>
            </div>
          </div>

          {/* BAGIAN 2: AKUN & DATA ORANG TUA */}
          <div className="pt-3 border-t border-slate-100">
            <h2 className="text-lg font-black text-slate-900">
              2. Data &amp; Akun Portal Orang Tua
            </h2>
            <p className="text-xs text-slate-500">
              {firebaseUser
                ? `Terhubung dengan akun ${firebaseUser.email}`
                : "Email & password ini dipakai untuk masuk ke Portal Orang Tua."}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Nama Orang Tua / Wali *
              </label>
              <input
                type="text"
                required
                value={parentName}
                onChange={(e) => setParentName(e.target.value)}
                placeholder="Contoh: Ibu Rina / Bapak Budi"
                className="w-full px-3.5 py-3 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-lime-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Nomor WhatsApp Aktif *
              </label>
              <input
                type="tel"
                required
                value={parentWhatsapp}
                onChange={(e) => setParentWhatsapp(e.target.value)}
                placeholder="Contoh: 081234567890"
                className="w-full px-3.5 py-3 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-lime-500"
              />
            </div>

            {!firebaseUser && (
              <>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Email Orang Tua (Untuk Login) *
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
                    Buat Password Portal *
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
              </>
            )}

            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Catatan Tambahan (Opsional)
              </label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Misal: Sudah punya sepatu roda sendiri / ukuran sepatu 32"
                className="w-full px-3.5 py-3 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-lime-500"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-4 px-6 rounded-2xl bg-lime-400 hover:bg-lime-300 text-slate-950 font-black text-sm sm:text-base shadow-sm transition-colors disabled:opacity-60"
          >
            {submitting
              ? "Membuat Akun & Menyimpan Data..."
              : "Daftar & Langsung Masuk Portal Orang Tua →"}
          </button>
        </form>
      </div>
    </div>
  );
}
