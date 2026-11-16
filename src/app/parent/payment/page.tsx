"use client";

import { useEffect, useState, FormEvent } from "react";
import Link from "next/link";
import {
  collection,
  doc,
  getDocs,
  setDoc,
  query,
  where,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import RoleGuard from "@/components/RoleGuard";
import { StudentProfile } from "@/types/database";

interface PaymentItem {
  id: string;
  studentId: string;
  studentName: string;
  parentUid: string;
  parentName: string;
  paymentType: "registration" | "monthly_fee";
  periodLabel: string;
  amount: number;
  transferDate: string;
  senderName: string;
  proofNote: string;
  status: "pending_verification" | "verified" | "rejected";
}

export default function ParentPaymentPage() {
  const { firebaseUser, userProfile } = useAuth();
  const [children, setChildren] = useState<StudentProfile[]>([]);
  const [payments, setPayments] = useState<PaymentItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Form states
  const [selectedStudentId, setSelectedStudentId] = useState("");
  const [paymentType, setPaymentType] = useState<
    "registration" | "monthly_fee"
  >("registration");
  const [periodLabel, setPeriodLabel] = useState("Pendaftaran Anggota Baru");
  const [amount, setAmount] = useState("250000");
  const [transferDate, setTransferDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [senderName, setSenderName] = useState(userProfile?.name || "");
  const [proofNote, setProofNote] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");

  const loadData = async () => {
    if (!firebaseUser) return;
    setLoading(true);

    try {
      const [studSnap, paySnap] = await Promise.all([
        getDocs(
          query(
            collection(db, "students"),
            where("parentUids", "array-contains", firebaseUser.uid)
          )
        ),
        getDocs(
          query(
            collection(db, "payments"),
            where("parentUid", "==", firebaseUser.uid)
          )
        ),
      ]);

      const childList: StudentProfile[] = [];
      studSnap.forEach((d) => {
        childList.push({
          id: d.id,
          ...(d.data() as Omit<StudentProfile, "id">),
        });
      });

      const payList: PaymentItem[] = [];
      paySnap.forEach((d) => {
        payList.push({
          id: d.id,
          ...(d.data() as Omit<PaymentItem, "id">),
        });
      });
      payList.sort((a, b) => b.transferDate.localeCompare(a.transferDate));

      setChildren(childList);
      setPayments(payList);
      if (childList.length > 0 && !selectedStudentId) {
        setSelectedStudentId(childList[0].id);
      }
    } catch (error) {
      console.error("Gagal memuat data pembayaran:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [firebaseUser]);

  const handleTypeChange = (type: "registration" | "monthly_fee") => {
    setPaymentType(type);
    if (type === "registration") {
      setPeriodLabel("Pendaftaran Anggota Baru");
    } else {
      const now = new Date();
      const monthYear = now.toLocaleDateString("id-ID", {
        month: "long",
        year: "numeric",
      });
      setPeriodLabel(`Iuran Bulanan - ${monthYear}`);
    }
  };

  const handleSubmitPayment = async (e: FormEvent) => {
    e.preventDefault();
    if (!firebaseUser || !selectedStudentId) return;

    const student = children.find((c) => c.id === selectedStudentId);
    if (!student) return;

    setSubmitting(true);
    setSuccessMsg("");

    try {
      const payRef = doc(collection(db, "payments"));
      await setDoc(payRef, {
        studentId: student.id,
        studentName: student.fullName,
        parentUid: firebaseUser.uid,
        parentName: userProfile?.name || senderName.trim(),
        paymentType,
        periodLabel: periodLabel.trim(),
        amount: Number(amount) || 0,
        transferDate,
        senderName: senderName.trim(),
        proofNote: proofNote.trim(),
        status: "pending_verification",
        createdAt: serverTimestamp(),
      });

      setProofNote("");
      setSuccessMsg(
        `Konfirmasi pembayaran untuk ${student.fullName} berhasil dikirim dan menunggu verifikasi Admin.`
      );
      await loadData();
    } catch (error) {
      console.error("Gagal mengirim konfirmasi pembayaran:", error);
      alert("Gagal mengirim konfirmasi pembayaran. Periksa koneksi Anda.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <RoleGuard allowedRoles={["parent"]}>
      <div className="min-h-[85vh] bg-slate-50 pb-16">
        <div className="bg-slate-900 text-white border-b border-slate-800">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 py-7">
            <Link
              href="/parent"
              className="text-xs font-bold text-lime-400 hover:underline"
            >
              ← Kembali ke Portal Orang Tua
            </Link>
            <h1 className="text-2xl sm:text-3xl font-black mt-3">
              Konfirmasi Pembayaran &amp; Daftar Ulang
            </h1>
            <p className="text-sm text-slate-300 mt-1">
              Kirim bukti konfirmasi transfer pendaftaran atau iuran latihan
              rutin Sabtu.
            </p>
          </div>
        </div>

        <div className="max-w-3xl mx-auto px-4 sm:px-6 mt-6 space-y-6">
          {successMsg && (
            <div className="p-4 rounded-xl bg-lime-100 border border-lime-400 text-slate-950 text-sm font-bold">
              ✓ {successMsg}
            </div>
          )}

          {loading ? (
            <div className="p-8 rounded-2xl bg-white border border-slate-200 text-center text-sm text-slate-500">
              Memuat data...
            </div>
          ) : children.length === 0 ? (
            <div className="p-6 rounded-2xl bg-white border border-slate-200 space-y-3">
              <p className="font-bold text-slate-900">
                Belum ada profil anak yang terhubung
              </p>
              <Link
                href="/daftar"
                className="inline-block px-4 py-2.5 rounded-xl bg-lime-400 text-slate-950 text-xs font-extrabold"
              >
                + Daftarkan Anak Sekarang
              </Link>
            </div>
          ) : (
            <form
              onSubmit={handleSubmitPayment}
              className="p-5 sm:p-7 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-4"
            >
              <h2 className="text-lg font-black text-slate-900">
                Formulir Konfirmasi Transfer
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Nama Anak *
                  </label>
                  <select
                    value={selectedStudentId}
                    onChange={(e) => setSelectedStudentId(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-bold bg-white"
                  >
                    {children.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.fullName} ({c.studentCode})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Jenis Pembayaran *
                  </label>
                  <select
                    value={paymentType}
                    onChange={(e) =>
                      handleTypeChange(
                        e.target.value as "registration" | "monthly_fee"
                      )
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-bold bg-white"
                  >
                    <option value="registration">Pendaftaran Baru</option>
                    <option value="monthly_fee">
                      Iuran Bulanan / Daftar Ulang
                    </option>
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Keterangan Periode
                  </label>
                  <input
                    type="text"
                    required
                    value={periodLabel}
                    onChange={(e) => setPeriodLabel(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Nominal Transfer (Rp) *
                  </label>
                  <input
                    type="number"
                    required
                    min={1000}
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Tanggal Transfer *
                  </label>
                  <input
                    type="date"
                    required
                    value={transferDate}
                    onChange={(e) => setTransferDate(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Nama Pengirim Rekening *
                  </label>
                  <input
                    type="text"
                    required
                    value={senderName}
                    onChange={(e) => setSenderName(e.target.value)}
                    placeholder="Contoh: BCA a.n. Rina"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Catatan / Link Bukti (Opsional)
                  </label>
                  <input
                    type="text"
                    value={proofNote}
                    onChange={(e) => setProofNote(e.target.value)}
                    placeholder="No. referensi atau catatan transfer"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3.5 px-6 rounded-xl bg-slate-900 hover:bg-slate-800 text-lime-400 font-extrabold text-sm transition-colors disabled:opacity-60"
              >
                {submitting
                  ? "Mengirim Konfirmasi..."
                  : "Kirim Konfirmasi Pembayaran"}
              </button>
            </form>
          )}

          {/* Riwayat Pembayaran */}
          {payments.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-base font-extrabold text-slate-900">
                Riwayat Konfirmasi Pembayaran ({payments.length})
              </h2>

              {payments.map((item) => (
                <div
                  key={item.id}
                  className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div>
                    <p className="text-xs text-slate-500">
                      {item.transferDate} • {item.studentName}
                    </p>
                    <h3 className="text-sm font-black text-slate-900 mt-0.5">
                      {item.periodLabel} — Rp{" "}
                      {Number(item.amount).toLocaleString("id-ID")}
                    </h3>
                    <p className="text-xs text-slate-600 mt-0.5">
                      Pengirim: {item.senderName}
                      {item.proofNote ? ` (${item.proofNote})` : ""}
                    </p>
                  </div>

                  <span
                    className={`self-start sm:self-center text-xs font-extrabold px-3 py-1 rounded-full ${
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
                      : "MENUNGGU CEK ADMIN"}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </RoleGuard>
  );
}
