"use client";

import { useState, useEffect, FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
  updateProfile,
} from "firebase/auth";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";

function mapAuthError(code?: string): string {
  switch (code) {
    case "auth/invalid-credential":
    case "auth/user-not-found":
    case "auth/wrong-password":
      return "Email atau kata sandi tidak cocok. Silakan periksa kembali.";
    case "auth/email-already-in-use":
      return "Email ini sudah terdaftar. Silakan pindah ke tab Masuk.";
    case "auth/weak-password":
      return "Kata sandi minimal terdiri dari 6 karakter.";
    case "auth/invalid-email":
      return "Format alamat email tidak valid.";
    case "auth/popup-closed-by-user":
      return "Jendela login Google ditutup sebelum proses selesai.";
    case "auth/unauthorized-domain":
      return "Domain website ini belum terdaftar di Authorized Domains Firebase.";
    default:
      return "Terjadi kendala saat memproses akun. Silakan coba lagi.";
  }
}

export default function LoginPage() {
  const router = useRouter();
  const { firebaseUser, loading, refreshProfile } = useAuth();

  const [mode, setMode] = useState<"login" | "register">("login");
  const [name, setName] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    if (!loading && firebaseUser) {
      router.replace("/dashboard");
    }
  }, [firebaseUser, loading, router]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setSubmitting(true);

    try {
      if (mode === "login") {
        await signInWithEmailAndPassword(auth, email.trim(), password);
        router.replace("/dashboard");
      } else {
        if (!name.trim()) {
          setErrorMsg("Nama lengkap orang tua/wali wajib diisi.");
          setSubmitting(false);
          return;
        }

        const cred = await createUserWithEmailAndPassword(
          auth,
          email.trim(),
          password
        );

        await updateProfile(cred.user, { displayName: name.trim() });

        await setDoc(
          doc(db, "users", cred.user.uid),
          {
            uid: cred.user.uid,
            name: name.trim(),
            email: email.trim(),
            whatsapp: whatsapp.trim(),
            role: "parent",
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          },
          { merge: true }
        );

        await refreshProfile();
        router.replace("/dashboard");
      }
    } catch (err: unknown) {
      const firebaseErr = err as { code?: string };
      setErrorMsg(mapAuthError(firebaseErr.code));
    } finally {
      setSubmitting(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setErrorMsg("");
    setSubmitting(true);

    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
      router.replace("/dashboard");
    } catch (err: unknown) {
      const firebaseErr = err as { code?: string };
      setErrorMsg(mapAuthError(firebaseErr.code));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-[85vh] bg-slate-900 px-4 py-10 flex items-center justify-center">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
        {/* Header Kartu */}
        <div className="bg-slate-950 px-6 py-6 text-white">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-extrabold uppercase tracking-widest text-lime-400">
              TREX SKATE SCHOOL
            </span>
            <Link
              href="/"
              className="text-xs text-slate-400 hover:text-white transition-colors"
            >
              ← Beranda
            </Link>
          </div>
          <h1 className="text-2xl font-black mt-2">
            {mode === "login" ? "Masuk ke Portal" : "Daftar Akun Wali"}
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            {mode === "login"
              ? "Akses rapor perkembangan anak, absensi, dan administrasi klub."
              : "Buat akun orang tua untuk menautkan profil murid TREX."}
          </p>
        </div>

        {/* Switch Tab Masuk / Daftar */}
        <div className="grid grid-cols-2 border-b border-slate-200 bg-slate-50 text-sm font-bold">
          <button
            type="button"
            onClick={() => {
              setMode("login");
              setErrorMsg("");
            }}
            className={`py-3.5 text-center transition-colors ${
              mode === "login"
                ? "bg-white text-slate-950 border-b-2 border-lime-500"
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            Masuk Akun
          </button>
          <button
            type="button"
            onClick={() => {
              setMode("register");
              setErrorMsg("");
            }}
            className={`py-3.5 text-center transition-colors ${
              mode === "register"
                ? "bg-white text-slate-950 border-b-2 border-lime-500"
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            Daftar Baru
          </button>
        </div>

        <div className="p-6">
          {errorMsg && (
            <div className="mb-4 p-3.5 rounded-xl bg-red-50 border border-red-200 text-xs sm:text-sm text-red-800 font-medium">
              {errorMsg}
            </div>
          )}

          {/* Tombol Google */}
          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={submitting}
            className="w-full py-3 px-4 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-800 font-bold text-sm flex items-center justify-center gap-3 transition-colors disabled:opacity-60"
          >
            <svg viewBox="0 0 24 24" className="w-5 h-5 shrink-0">
              <path
                fill="#EA4335"
                d="M12 5c1.6 0 3 .6 4.1 1.6l3.1-3.1C17.3 1.7 14.8 1 12 1 7.4 1 3.5 3.6 1.6 7.4l3.6 2.8C6.1 7.2 8.8 5 12 5z"
              />
              <path
                fill="#4285F4"
                d="M23.5 12.3c0-.8-.1-1.7-.2-2.5H12v4.8h6.5c-.3 1.5-1.1 2.8-2.4 3.6l3.7 2.9c2.2-2 3.7-5 3.7-8.8z"
              />
              <path
                fill="#FBBC05"
                d="M5.2 14.8c-.2-.8-.4-1.6-.4-2.5s.2-1.7.4-2.5L1.6 7C.6 9 0 11.2 0 13.5s.6 4.5 1.6 6.5l3.6-2.8z"
              />
              <path
                fill="#34A853"
                d="M12 24c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3.2 0-5.9-2.2-6.8-5.1l-3.6 2.8C3.5 21.4 7.4 24 12 24z"
              />
            </svg>
            Lanjutkan dengan Google
          </button>

          <div className="relative my-5 flex items-center justify-center">
            <div className="border-t border-slate-200 w-full" />
            <span className="bg-white px-3 text-xs text-slate-400 uppercase font-semibold">
              atau email
            </span>
            <div className="border-t border-slate-200 w-full" />
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === "register" && (
              <>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Nama Lengkap Wali Murid
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Contoh: Budi Santoso"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-lime-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Nomor WhatsApp Aktif
                  </label>
                  <input
                    type="tel"
                    value={whatsapp}
                    onChange={(e) => setWhatsapp(e.target.value)}
                    placeholder="Contoh: 081234567890"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-lime-500"
                  />
                </div>
              </>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Alamat Email
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="nama@email.com"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-lime-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Kata Sandi
              </label>
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Minimal 6 karakter"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-lime-500"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3.5 px-4 rounded-xl bg-lime-400 hover:bg-lime-300 text-slate-950 font-extrabold text-sm transition-colors shadow-sm disabled:opacity-60"
            >
              {submitting
                ? "Memproses..."
                : mode === "login"
                ? "Masuk Sekarang"
                : "Buat Akun Orang Tua"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
