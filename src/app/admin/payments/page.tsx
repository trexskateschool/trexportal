"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  collection,
  doc,
  getDocs,
  updateDoc,
  orderBy,
  query,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import RoleGuard from "@/components/RoleGuard";

interface AdminPaymentRecord {
  id: string;
  studentId: string;
  studentName: string;
  parentName: string;
  paymentType: "registration" | "monthly_fee";
  periodLabel: string;
  amount: number;
  transferDate: string;
  senderName: string;
  proofNote?: string;
  status: "pending_verification" | "verified" | "rejected";
}

export default function AdminPaymentsPage() {
  const [payments, setPayments] = useState<AdminPaymentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);

  const loadPayments = async () => {
    setLoading(true);
    try {
      const snap = await getDocs(
        query(collection(db, "payments"), orderBy("transferDate", "desc"))
      );
      const list: AdminPaymentRecord[] = [];
      snap.forEach((d) => {
        list.push({
          id: d.id,
          ...(d.data() as Omit<AdminPaymentRecord, "id">),
        });
      });
      setPayments(list);
    } catch (error) {
      console.error("Gagal memuat daftar pembayaran:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPayments();
  }, []);

  const handleVerifyPayment = async (
    item: AdminPaymentRecord,
    newStatus: "verified" | "rejected"
  ) => {
    setProcessingId(item.id);
    try {
      await updateDoc(doc(db, "payments", item.id), {
        status: newStatus,
        verifiedAt: serverTimestamp(),
      });

      // Jika disetujui, otomatis aktifkan status keanggotaan murid
      if (newStatus === "verified" && item.studentId) {
        await updateDoc(doc(db, "students", item.studentId), {
          status: "active",
          updatedAt: serverTimestamp(),
        });
      }

      setPayments((prev) =>
        prev.map((p) => (p.id === item.id ? { ...p, status: newStatus } : p))
      );
    } catch (error) {
      console.error("Gagal memverifikasi pembayaran:", error);
      alert("Gagal memperbarui status pembayaran.");
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <RoleGuard allowedRoles={["admin"]}>
      <div className="min-h-[85vh] bg-slate-50 pb-16">
        <div className="bg-slate-900 text-white border-b border-slate-800">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 py-7">
            <Link
              href="/admin"
              className="text-xs font-bold text-lime-400 hover:underline"
            >
              ← Kembali ke Dashboard Admin
            </Link>
            <h1 className="text-2xl sm:text-3xl font-black mt-3">
              Verifikasi Pembayaran &amp; Aktivasi
            </h1>
            <p className="text-sm text-slate-300 mt-1">
              Setujui transfer pendaftaran atau iuran bulanan untuk mengaktifkan
              status murid secara otomatis.
            </p>
          </div>
        </div>

        <div className="max-w-5xl mx-auto px-4 sm:px-6 mt-6 space-y-4">
          {loading ? (
            <div className="p-8 rounded-2xl bg-white border border-slate-200 text-center text-sm text-slate-500">
              Memuat data pembayaran masuk...
            </div>
          ) : payments.length === 0 ? (
            <div className="p-8 rounded-2xl bg-white border border-slate-200 text-center space-y-1">
              <p className="font-bold text-slate-900">
                Belum ada konfirmasi pembayaran masuk
              </p>
              <p className="text-xs text-slate-500">
                Konfirmasi transfer yang dikirim wali murid akan tampil di
                halaman ini.
              </p>
            </div>
          ) : (
            payments.map((item) => (
              <div
                key={item.id}
                className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                      {item.transferDate}
                    </span>
                    <span
                      className={`text-[11px] font-extrabold px-2.5 py-0.5 rounded-full ${
                        item.status === "verified"
                          ? "bg-lime-200 text-slate-950"
                          : item.status === "rejected"
                          ? "bg-red-100 text-red-800"
                          : "bg-amber-100 text-amber-900"
                      }`}
                    >
                      {item.status === "verified"
                        ? "TERVERIFIKASI"
                        : item.status === "rejected"
                        ? "DITOLAK"
                        : "MENUNGGU VERIFIKASI"}
                    </span>
                  </div>

                  <h3 className="text-lg font-black text-slate-900">
                    {item.studentName} — Rp{" "}
                    {Number(item.amount).toLocaleString("id-ID")}
                  </h3>
                  <p className="text-xs text-slate-600">
                    {item.periodLabel} • Pengirim:{" "}
                    <strong>{item.senderName}</strong> (Wali: {item.parentName}
                    )
                  </p>
                  {item.proofNote && (
                    <p className="text-xs text-slate-500">
                      Catatan: {item.proofNote}
                    </p>
                  )}
                </div>

                {item.status === "pending_verification" && (
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      disabled={processingId === item.id}
                      onClick={() => handleVerifyPayment(item, "verified")}
                      className="px-4 py-2.5 rounded-xl bg-lime-400 hover:bg-lime-300 text-slate-950 font-extrabold text-xs transition-colors disabled:opacity-50"
                    >
                      Setujui &amp; Aktifkan
                    </button>
                    <button
                      type="button"
                      disabled={processingId === item.id}
                      onClick={() => handleVerifyPayment(item, "rejected")}
                      className="px-3.5 py-2.5 rounded-xl bg-red-50 hover:bg-red-100 text-red-700 font-bold text-xs transition-colors disabled:opacity-50"
                    >
                      Tolak
                    </button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </RoleGuard>
  );
}
