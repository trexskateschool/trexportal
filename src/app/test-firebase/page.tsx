"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  collection,
  doc,
  setDoc,
  getDoc,
  serverTimestamp,
} from "firebase/firestore";
import { db, auth, checkFirebaseEnv } from "@/lib/firebase";

export default function TestFirebasePage() {
  const [status, setStatus] = useState<"loading" | "success" | "error">(
    "loading"
  );
  const [message, setMessage] = useState(
    "Menguji koneksi ke server Firebase..."
  );
  const [details, setDetails] = useState<{
    projectId: string;
    authReady: boolean;
    firestoreWrite: boolean;
    missingVars: string[];
  }>({
    projectId: "-",
    authReady: false,
    firestoreWrite: false,
    missingVars: [],
  });

  useEffect(() => {
    async function runConnectionTest() {
      const envCheck = checkFirebaseEnv();

      if (!envCheck.isValid) {
        setStatus("error");
        setMessage(
          "Environment Variables Firebase di Vercel belum lengkap."
        );
        setDetails({
          projectId: envCheck.projectId,
          authReady: false,
          firestoreWrite: false,
          missingVars: envCheck.missing,
        });
        return;
      }

      try {
        const authReady = Boolean(auth && auth.app);

        const testDocRef = doc(collection(db, "_systemCheck"), "ping");
        await setDoc(testDocRef, {
          status: "connected",
          club: "TREX Skate School",
          checkedAt: serverTimestamp(),
        });

        const snap = await getDoc(testDocRef);

        if (snap.exists()) {
          setStatus("success");
          setMessage(
            "Koneksi Next.js, Authentication, dan Cloud Firestore berhasil!"
          );
          setDetails({
            projectId: envCheck.projectId,
            authReady,
            firestoreWrite: true,
            missingVars: [],
          });
        } else {
          throw new Error("Dokumen uji tidak ditemukan setelah ditulis.");
        }
      } catch (err: unknown) {
        const errorMessage =
          err instanceof Error
            ? err.message
            : "Gagal terhubung ke Firestore.";
        setStatus("error");
        setMessage(errorMessage);
        setDetails({
          projectId: envCheck.projectId,
          authReady: Boolean(auth),
          firestoreWrite: false,
          missingVars: [],
        });
      }
    }

    runConnectionTest();
  }, []);

  return (
    <div className="min-h-[80vh] bg-slate-50 px-4 py-12 flex items-center justify-center">
      <div className="w-full max-w-lg bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8">
        <div className="flex items-center justify-between mb-6">
          <span className="text-xs font-extrabold uppercase tracking-wider px-3 py-1 rounded-full bg-slate-900 text-lime-400">
            Diagnostik Fase 2
          </span>
          <Link
            href="/"
            className="text-xs font-semibold text-slate-500 hover:text-slate-900"
          >
            ← Kembali ke Beranda
          </Link>
        </div>

        <h1 className="text-xl sm:text-2xl font-black text-slate-900">
          Uji Koneksi Firebase
        </h1>
        <p className="text-sm text-slate-600 mt-1">
          Memastikan aplikasi TREX Skate School terhubung ke database Firestore
          dan layanan autentikasi.
        </p>

        {/* Status Banner */}
        <div
          className={`mt-6 p-4 rounded-xl border text-sm font-medium ${
            status === "loading"
              ? "bg-blue-50 border-blue-200 text-blue-900"
              : status === "success"
              ? "bg-lime-50 border-lime-400 text-slate-900"
              : "bg-red-50 border-red-300 text-red-900"
          }`}
        >
          <p className="font-bold">
            {status === "loading" && "Memeriksa Koneksi..."}
            {status === "success" && "TERHUBUNG (ONLINE)"}
            {status === "error" && "KONEKSI GAGAL"}
          </p>
          <p className="mt-1 text-xs sm:text-sm leading-relaxed">{message}</p>
        </div>

        {/* Checklist Teknis */}
        <div className="mt-6 space-y-3 text-sm">
          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200/80">
            <span className="text-slate-600">Firebase Project ID</span>
            <span className="font-mono font-bold text-slate-900 text-xs sm:text-sm">
              {details.projectId}
            </span>
          </div>

          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200/80">
            <span className="text-slate-600">Firebase Authentication</span>
            <span
              className={`text-xs font-extrabold px-2.5 py-1 rounded-md ${
                details.authReady
                  ? "bg-lime-200 text-slate-950"
                  : "bg-slate-200 text-slate-600"
              }`}
            >
              {details.authReady ? "AKTIF" : "BELUM SIAP"}
            </span>
          </div>

          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200/80">
            <span className="text-slate-600">Cloud Firestore (Baca/Tulis)</span>
            <span
              className={`text-xs font-extrabold px-2.5 py-1 rounded-md ${
                details.firestoreWrite
                  ? "bg-lime-200 text-slate-950"
                  : "bg-slate-200 text-slate-600"
              }`}
            >
              {details.firestoreWrite ? "BERHASIL" : "GAGAL"}
            </span>
          </div>
        </div>

        {/* Daftar Env yang Kurang */}
        {details.missingVars.length > 0 && (
          <div className="mt-5 p-4 rounded-xl bg-amber-50 border border-amber-300 text-xs text-amber-950">
            <p className="font-bold mb-1">
              Variabel berikut belum dimasukkan di Vercel Settings:
            </p>
            <ul className="list-disc pl-4 space-y-1 font-mono">
              {details.missingVars.map((v) => (
                <li key={v}>{v}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
