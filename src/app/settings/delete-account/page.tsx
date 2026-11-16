"use client";

import { useState, FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { 
  EmailAuthProvider, 
  reauthenticateWithCredential, 
  deleteUser 
} from "firebase/auth";
import { doc, deleteDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import RoleGuard from "@/components/RoleGuard";

export default function DeleteAccountPage() {
  const router = useRouter();
  const { firebaseUser } = useAuth();
  
  const [password, setPassword] = useState("");
  const [confirmationText, setConfirmationText] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleDeleteAccount = async (e: FormEvent) => {
    e.preventDefault();
    if (!firebaseUser) return;

    if (confirmationText !== "HAPUS AKUN SAYA") {
      setErrorMsg('Harap ketik "HAPUS AKUN SAYA" dengan benar pada kolom konfirmasi.');
      return;
    }

    if (!password) {
      setErrorMsg("Masukkan password Anda saat ini untuk verifikasi keamanan.");
      return;
    }

    setDeleting(true);
    setErrorMsg("");

    try {
      // 1. Re-autentikasi pengguna demi keamanan sebelum hapus akun
      const credential = EmailAuthProvider.credential(firebaseUser.email || "", password);
      await reauthenticateWithCredential(firebaseUser, credential);

      // 2. Hapus dokumen profil pengguna dari koleksi 'users' di Firestore
      await deleteDoc(doc(db, "users", firebaseUser.uid));

      // 3. Hapus akun dari Firebase Authentication
      await deleteUser(firebaseUser);

      // Arahkan ke halaman utama setelah berhasil
      router.replace("/");
    } catch (error: unknown) {
      console.error("Gagal menghapus akun:", error);
      const code = (error as { code?: string })?.code;
      if (code === "auth/wrong-password" || code === "auth/invalid-credential") {
        setErrorMsg("Password yang Anda masukkan salah.");
      } else {
        setErrorMsg("Gagal menghapus akun. Silakan login ulang lalu coba lagi.");
      }
      setDeleting(false);
    }
  };

  return (
    <RoleGuard allowedRoles={["admin", "coach", "parent"]}>
      <div className="min-h-[85vh] bg-slate-50 pb-16">
        {/* Header */}
        <div className="bg-red-950 text-white border-b border-red-900">
          <div className="max-w-xl mx-auto px-4 sm:px-6 py-7">
            <Link
              href="/"
              className="text-xs font-bold text-red-300 hover:underline"
            >
              ← Kembali ke Beranda
            </Link>
            <h1 className="text-2xl sm:text-3xl font-black mt-3">
              Hapus Akun Permanen
            </h1>
            <p className="text-sm text-red-200 mt-1">
              Tindakan ini bersifat permanen dan tidak dapat dibatalkan. Seluruh data profil akun Anda akan dihapus dari sistem.
            </p>
          </div>
        </div>

        <div className="max-w-xl mx-auto px-4 sm:px-6 mt-6">
          <form
            onSubmit={handleDeleteAccount}
            className="p-6 sm:p-8 rounded-2xl bg-white border border-red-200 shadow-xs space-y-5"
          >
            {errorMsg && (
              <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-xs sm:text-sm text-red-800 font-medium">
                {errorMsg}
              </div>
            )}

            <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 leading-relaxed">
              <strong>Peringatan:</strong> Menghapus akun akan memutuskan akses Anda ke portal klub. Pastikan Anda sudah yakin sebelum melanjutkan.
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Ketik <span className="text-red-600 font-mono font-black">&quot;HAPUS AKUN SAYA&quot;</span> *
              </label>
              <input
                type="text"
                required
                value={confirmationText}
                onChange={(e) => setConfirmationText(e.target.value)}
                placeholder="Ketik di sini..."
                className="w-full px-3.5 py-3 rounded-xl border border-slate-300 text-sm font-bold uppercase focus:outline-none focus:ring-2 focus:ring-red-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Masukkan Password Akun Anda *
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password saat ini"
                className="w-full px-3.5 py-3 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
              />
            </div>

            <div className="pt-2 flex flex-col sm:flex-row gap-3">
              <button
                type="submit"
                disabled={deleting}
                className="flex-1 py-3.5 px-6 rounded-2xl bg-red-600 hover:bg-red-700 text-white font-black text-sm transition-colors disabled:opacity-60"
              >
                {deleting ? "Menghapus Akun..." : "Ya, Hapus Akun Saya Permanen"}
              </button>
              <Link
                href="/"
                className="py-3.5 px-6 rounded-2xl border border-slate-300 text-slate-700 font-bold text-sm text-center hover:bg-slate-100 transition-colors"
              >
                Batal
              </Link>
            </div>
          </form>
        </div>
      </div>
    </RoleGuard>
  );
}
