"use client";

import { useEffect, useState, FormEvent } from "react";
import Link from "next/link";
import {
  collection,
  doc,
  getDocs,
  setDoc,
  deleteDoc,
  orderBy,
  query,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import RoleGuard from "@/components/RoleGuard";

interface ClaimCodeItem {
  id: string;
  code: string;
  studentId: string;
  studentName: string;
  isClaimed: boolean;
  claimedBy?: string;
}

interface StudentOption {
  id: string;
  fullName: string;
  studentCode: string;
}

function generateClaimCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let result = "";
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export default function AdminClaimsPage() {
  const [claims, setClaims] = useState<ClaimCodeItem[]>([]);
  const [students, setStudents] = useState<StudentOption[]>([]);
  const [loading, setLoading] = useState(true);

  // Form state
  const [selectedStudentId, setSelectedStudentId] = useState("");
  const [customCode, setCustomCode] = useState("");
  const [generating, setGenerating] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");

  const loadData = async () => {
    setLoading(true);
    try {
      const [claimSnap, studentSnap] = await Promise.all([
        getDocs(query(collection(db, "claimCodes"), orderBy("code", "asc"))),
        getDocs(collection(db, "students")),
      ]);

      const claimList: ClaimCodeItem[] = [];
      claimSnap.forEach((d) => {
        claimList.push({
          id: d.id,
          ...(d.data() as Omit<ClaimCodeItem, "id">),
        });
      });

      const studentList: StudentOption[] = [];
      studentSnap.forEach((d) => {
        const data = d.data();
        studentList.push({
          id: d.id,
          fullName: data.fullName,
          studentCode: data.studentCode,
        });
      });

      setClaims(claimList);
      setStudents(studentList);
      if (studentList.length > 0 && !selectedStudentId) {
        setSelectedStudentId(studentList[0].id);
      }
    } catch (error) {
      console.error("Gagal memuat data klaim:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateCode = async (e: FormEvent) => {
    e.preventDefault();
    if (!selectedStudentId) return;

    const student = students.find((s) => s.id === selectedStudentId);
    if (!student) return;

    setGenerating(true);
    setSuccessMsg("");

    try {
      const code = customCode.trim().toUpperCase() || generateClaimCode();

      await setDoc(doc(db, "claimCodes", code), {
        code,
        studentId: student.id,
        studentName: student.fullName,
        isClaimed: false,
        createdAt: serverTimestamp(),
      });

      setCustomCode("");
      setSuccessMsg(`Berhasil membuat Kode Klaim "${code}" untuk ${student.fullName}`);
      await loadData();
    } catch (error) {
      console.error("Gagal membuat kode klaim:", error);
      alert("Gagal membuat kode klaim. Pastikan kode belum digunakan.");
    } finally {
      setGenerating(false);
    }
  };

  const handleDeleteCode = async (code: string) => {
    if (!window.confirm(`Hapus kode klaim "${code}"?`)) return;
    try {
      await deleteDoc(doc(db, "claimCodes", code));
      setClaims((prev) => prev.filter((c) => c.code !== code));
    } catch (error) {
      console.error("Gagal menghapus kode:", error);
    }
  };

  return (
    <RoleGuard allowedRoles={["admin"]}>
      <div className="min-h-[85vh] bg-slate-50 pb-16">
        <div className="bg-slate-900 text-white border-b border-slate-800">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 py-7">
            <Link
              href="/admin"
              className="text-xs font-bold text-lime-400 hover:underline"
            >
              ← Kembali ke Dashboard Admin
            </Link>
            <h1 className="text-2xl sm:text-3xl font-black mt-3">
              Manajemen Kode Klaim Wali Murid
            </h1>
            <p className="text-sm text-slate-300 mt-1">
              Buat dan pantau kode klaim manual untuk menghubungkan akun orang tua dengan data murid.
            </p>
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-4 sm:px-6 mt-6 space-y-6">
          {successMsg && (
            <div className="p-4 rounded-xl bg-lime-100 border border-lime-400 text-slate-950 text-sm font-bold">
              ✓ {successMsg}
            </div>
          )}

          {/* Form Buat Kode Klaim */}
          <form
            onSubmit={handleCreateCode}
            className="p-5 sm:p-7 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-4"
          >
            <h2 className="text-lg font-black text-slate-900">
              Generate Kode Klaim Baru
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Pilih Nama Anak / Murid *
                </label>
                <select
                  value={selectedStudentId}
                  onChange={(e) => setSelectedStudentId(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-bold bg-white"
                >
                  {students.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.fullName} ({s.studentCode})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Kode Kustom (Opsional)
                </label>
                <input
                  type="text"
                  maxLength={8}
                  value={customCode}
                  onChange={(e) => setCustomCode(e.target.value.toUpperCase())}
                  placeholder="Kosongkan untuk otomatis"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-mono uppercase font-bold"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={generating || students.length === 0}
              className="px-6 py-3 rounded-xl bg-lime-400 hover:bg-lime-300 text-slate-950 font-extrabold text-sm transition-colors disabled:opacity-60"
            >
              {generating ? "Membuat Kode..." : "+ Buat Kode Klaim"}
            </button>
          </form>

          {/* Daftar Kode Klaim */}
          <div className="space-y-3">
            <h2 className="text-base font-extrabold text-slate-900">
              Daftar Kode Klaim Aktif ({claims.length})
            </h2>

            {loading ? (
              <p className="text-sm text-slate-500">Memuat daftar kode...</p>
            ) : claims.length === 0 ? (
              <div className="p-6 rounded-2xl bg-white border border-slate-200 text-sm text-slate-500">
                Belum ada kode klaim yang dibuat.
              </div>
            ) : (
              claims.map((item) => (
                <div
                  key={item.id}
                  className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-base font-black text-slate-900 bg-slate-100 px-3 py-1 rounded-lg border border-slate-200">
                        {item.code}
                      </span>
                      <span
                        className={`text-xs font-extrabold px-3 py-1 rounded-full ${
                          item.isClaimed
                            ? "bg-lime-200 text-slate-950"
                            : "bg-amber-100 text-amber-900"
                        }`}
                      >
                        {item.isClaimed ? "SUDAH DIKLAIM" : "BELUM DIKLAIM"}
                      </span>
                    </div>
                    <p className="text-sm font-bold text-slate-800 mt-2">
                      Murid: {item.studentName}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleDeleteCode(item.code)}
                    className="px-3.5 py-2 rounded-lg bg-red-50 text-red-700 text-xs font-bold hover:bg-red-100 self-start sm:self-center"
                  >
                    Hapus
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </RoleGuard>
  );
}
