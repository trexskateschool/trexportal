"use client";

import { useEffect, useState } from "react";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import RoleGuard from "@/components/RoleGuard";
import { StudentProfile } from "@/types/database";

export default function ParentPortalPage() {
  const { firebaseUser, userProfile } = useAuth();
  const [children, setChildren] = useState<StudentProfile[]>([]);
  const [loadingChildren, setLoadingChildren] = useState(true);

  useEffect(() => {
    async function fetchMyChildren() {
      if (!firebaseUser) return;
      try {
        const q = query(
          collection(db, "students"),
          where("parentUids", "array-contains", firebaseUser.uid)
        );
        const snap = await getDocs(q);
        const list: StudentProfile[] = [];
        snap.forEach((docSnap) => {
          list.push({
            id: docSnap.id,
            ...(docSnap.data() as Omit<StudentProfile, "id">),
          });
        });
        setChildren(list);
      } catch (error) {
        console.error("Gagal memuat profil anak:", error);
      } finally {
        setLoadingChildren(false);
      }
    }

    fetchMyChildren();
  }, [firebaseUser]);

  return (
    <RoleGuard allowedRoles={["parent"]}>
      <div className="min-h-[85vh] bg-slate-50 pb-14">
        {/* Header Portal Orang Tua */}
        <div className="bg-slate-900 text-white border-b border-slate-800">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
            <span className="inline-block px-3 py-1 rounded-full bg-lime-400 text-slate-950 text-xs font-extrabold uppercase tracking-wider">
              Portal Privat Orang Tua / Wali
            </span>
            <h1 className="text-2xl sm:text-3xl font-black mt-3">
              Halo, {userProfile?.name || "Wali Murid"}
            </h1>
            <p className="text-sm text-slate-300 mt-1">
              Pantau perkembangan latihan sepatu roda, kehadiran Sabtu, rapor
              bulanan, dan status administrasi anak Anda.
            </p>
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-4 sm:px-6 mt-8 space-y-6">
          {loadingChildren ? (
            <div className="p-8 rounded-2xl bg-white border border-slate-200 text-center text-sm text-slate-600">
              Memuat profil anak yang terhubung...
            </div>
          ) : children.length === 0 ? (
            /* Tampilan Jika Belum Ada Profil Anak yang Tertaut */
            <div className="p-6 sm:p-8 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-4">
              <div className="inline-block px-3 py-1 rounded-lg bg-amber-100 text-amber-900 text-xs font-extrabold">
                BELUM ADA PROFIL ANAK TERTAUT
              </div>
              <h2 className="text-xl font-black text-slate-900">
                Hubungkan Akun Anda dengan Profil Murid
              </h2>
              <p className="text-sm text-slate-600 leading-relaxed">
                Demi privasi data, setiap orang tua hanya dapat melihat rapor
                anak sendiri menggunakan <strong>Kode Klaim Murid</strong> (6
                karakter) yang dibagikan oleh Admin TREX Skate School. Fitur
                penautan kode akan diaktifkan pada <strong>Fase 6</strong>.
              </p>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 space-y-1">
                <p className="font-bold text-slate-800">
                  Info Akun Anda Saat Ini:
                </p>
                <p>Email: {userProfile?.email}</p>
                <p className="font-mono break-all">UID: {firebaseUser?.uid}</p>
              </div>
            </div>
          ) : (
            /* Daftar Kartu Anak yang Terhubung */
            <div className="space-y-4">
              <h2 className="text-lg font-extrabold text-slate-900">
                Profil Murid Terhubung ({children.length})
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {children.map((child) => (
                  <div
                    key={child.id}
                    className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs"
                  >
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-md bg-slate-100 text-slate-700">
                        {child.studentCode}
                      </span>
                      <span
                        className={`text-xs font-extrabold px-2.5 py-1 rounded-full ${
                          child.status === "active"
                            ? "bg-lime-200 text-slate-950"
                            : "bg-amber-100 text-amber-900"
                        }`}
                      >
                        {child.status === "active" ? "AKTIF" : "MENUNGGU AKTIVASI"}
                      </span>
                    </div>

                    <h3 className="text-xl font-black text-slate-900">
                      {child.fullName}
                    </h3>
                    <p className="text-sm text-slate-600 mt-1">
                      Level: <strong>{child.level}</strong> • Coach:{" "}
                      <strong>{child.coachName || "-"}</strong>
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </RoleGuard>
  );
}
