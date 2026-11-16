"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

export default function DashboardPage() {
  const router = useRouter();
  const { firebaseUser, userProfile, loading, logout } = useAuth();

  useEffect(() => {
    if (!loading && !firebaseUser) {
      router.replace("/login");
    }
  }, [firebaseUser, loading, router]);

  if (loading || !firebaseUser) {
    return (
      <div className="min-h-[75vh] flex flex-col items-center justify-center bg-slate-50 px-4">
        <div className="w-10 h-10 border-4 border-slate-900 border-t-lime-400 rounded-full animate-spin" />
        <p className="text-sm text-slate-600 mt-4 font-medium">
          Memuat data akun TREX Skate School...
        </p>
      </div>
    );
  }

  const role = userProfile?.role || "parent";

  const roleBadge = {
    admin: {
      title: "ADMIN KLUB",
      desc: "Akses penuh manajemen murid, coach, jadwal, rapor, dan verifikasi pembayaran.",
      style: "bg-slate-900 text-lime-400",
    },
    coach: {
      title: "COACH PEMBINA",
      desc: "Akses absensi latihan Sabtu, pencatatan evaluasi skill anak, dan draft rapor.",
      style: "bg-blue-900 text-white",
    },
    parent: {
      title: "ORANG TUA / WALI",
      desc: "Akses privat profil anak, jadwal latihan, rapor PDF, dan konfirmasi pembayaran.",
      style: "bg-lime-400 text-slate-950",
    },
  }[role];

  const handleLogout = async () => {
    await logout();
    router.replace("/login");
  };

  return (
    <div className="min-h-[80vh] bg-slate-50 py-10 px-4 sm:px-6">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Kartu Profil & Role */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <span
              className={`px-3 py-1 rounded-full text-xs font-extrabold tracking-wider ${roleBadge.style}`}
            >
              {roleBadge.title}
            </span>
            <button
              type="button"
              onClick={handleLogout}
              className="px-3.5 py-1.5 rounded-lg border border-red-200 bg-red-50 text-red-700 hover:bg-red-100 text-xs font-bold transition-colors"
            >
              Keluar Akun
            </button>
          </div>

          <h1 className="text-2xl font-black text-slate-900">
            Halo, {userProfile?.name || firebaseUser.displayName || "Anggota TREX"}
          </h1>
          <p className="text-sm text-slate-600 mt-1">{roleBadge.desc}</p>

          <div className="mt-6 space-y-2.5 text-sm">
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200/80">
              <span className="text-slate-500">Email Terdaftar</span>
              <span className="font-semibold text-slate-900">
                {userProfile?.email || firebaseUser.email}
              </span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200/80">
              <span className="text-slate-500">WhatsApp</span>
              <span className="font-semibold text-slate-900">
                {userProfile?.whatsapp || "Belum diisi"}
              </span>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 p-3 rounded-xl bg-slate-50 border border-slate-200/80">
              <span className="text-slate-500">User ID (UID)</span>
              <span className="font-mono text-xs text-slate-700 break-all">
                {firebaseUser.uid}
              </span>
            </div>
          </div>
        </div>

        {/* Panduan Aktivasi Admin Pertama */}
        {role === "parent" && (
          <div className="bg-amber-50 border border-amber-300 rounded-2xl p-5 text-xs sm:text-sm text-amber-950 space-y-2">
            <p className="font-extrabold">
              Catatan Khusus Pemilik Klub (Aktivasi Akun Admin Pertama):
            </p>
            <p className="leading-relaxed">
              Demi keamanan, setiap akun baru otomatis dibuat dengan role{" "}
              <code className="font-mono font-bold">parent</code>. Untuk
              menjadikan akun Anda sebagai <strong>Admin Utama</strong>, buka{" "}
              <strong>Firebase Console → Firestore Database → koleksi users</strong>
              , pilih dokumen dengan UID Anda di atas, lalu ubah nilai kolom{" "}
              <code className="font-mono font-bold">role</code> menjadi{" "}
              <code className="font-mono font-bold">admin</code> dan muat ulang
              halaman ini.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
