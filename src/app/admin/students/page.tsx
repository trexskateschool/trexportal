"use client";

import { useEffect, useState, FormEvent } from "react";
import Link from "next/link";
import {
  collection,
  getDocs,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  orderBy,
  query,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import RoleGuard from "@/components/RoleGuard";
import {
  CoachProfile,
  SkillLevelCategory,
  StudentProfile,
  StudentStatus,
} from "@/types/database";

function generateClaimCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let result = "";
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

function generateStudentCode(existingCount: number): string {
  const year = new Date().getFullYear();
  const num = String(existingCount + 1).padStart(3, "0");
  const rand = Math.floor(10 + Math.random() * 89);
  return `TRX-${year}-${num}${rand}`;
}

export default function AdminStudentsPage() {
  const [students, setStudents] = useState<StudentProfile[]>([]);
  const [coaches, setCoaches] = useState<CoachProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Form states
  const [fullName, setFullName] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [gender, setGender] = useState<"L" | "P">("L");
  const [level, setLevel] = useState<SkillLevelCategory>("Beginner");
  const [coachId, setCoachId] = useState("");
  const [parentName, setParentName] = useState("");
  const [parentWhatsapp, setParentWhatsapp] = useState("");
  const [status, setStatus] = useState<StudentStatus>("active");

  const loadData = async () => {
    setLoading(true);
    try {
      const [studentsSnap, coachesSnap] = await Promise.all([
        getDocs(query(collection(db, "students"), orderBy("fullName", "asc"))),
        getDocs(collection(db, "coaches")),
      ]);

      const studentList: StudentProfile[] = [];
      studentsSnap.forEach((d) => {
        studentList.push({
          id: d.id,
          ...(d.data() as Omit<StudentProfile, "id">),
        });
      });

      const coachList: CoachProfile[] = [];
      coachesSnap.forEach((d) => {
        coachList.push({
          id: d.id,
          ...(d.data() as Omit<CoachProfile, "id">),
        });
      });

      setStudents(studentList);
      setCoaches(coachList);
      if (coachList.length > 0 && !coachId) {
        setCoachId(coachList[0].id);
      }
    } catch (error) {
      console.error("Gagal memuat data murid:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleAddStudent = async (e: FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) return;
    setSubmitting(true);

    try {
      const studentRef = doc(collection(db, "students"));
      const studentCode = generateStudentCode(students.length);
      const claimCode = generateClaimCode();
      const selectedCoach = coaches.find((c) => c.id === coachId);
      const todayStr = new Date().toISOString().split("T")[0];

      const newStudent: Omit<StudentProfile, "id"> = {
        studentCode,
        claimCode,
        fullName: fullName.trim(),
        birthDate: birthDate || "2018-01-01",
        gender,
        level,
        coachId: selectedCoach?.id || "",
        coachName: selectedCoach?.name || "Tim Coach TREX",
        parentName: parentName.trim(),
        parentWhatsapp: parentWhatsapp.trim(),
        parentUids: [],
        status,
        registeredAt: todayStr,
      };

      await setDoc(studentRef, {
        ...newStudent,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      // Simpan juga ke koleksi claimCodes untuk verifikasi aman orang tua
      await setDoc(doc(db, "claimCodes", claimCode), {
        code: claimCode,
        studentId: studentRef.id,
        studentName: fullName.trim(),
        isClaimed: false,
        createdAt: serverTimestamp(),
      });

      // Reset form
      setFullName("");
      setBirthDate("");
      setParentName("");
      setParentWhatsapp("");
      setShowForm(false);
      await loadData();
    } catch (error) {
      console.error("Gagal menambah murid:", error);
      alert("Gagal menyimpan data murid. Periksa koneksi Anda.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleStatusChange = async (
    studentId: string,
    newStatus: StudentStatus
  ) => {
    try {
      await updateDoc(doc(db, "students", studentId), {
        status: newStatus,
        updatedAt: serverTimestamp(),
      });
      setStudents((prev) =>
        prev.map((s) => (s.id === studentId ? { ...s, status: newStatus } : s))
      );
    } catch (error) {
      console.error("Gagal mengubah status murid:", error);
    }
  };

  const handleDeleteStudent = async (student: StudentProfile) => {
    const confirmed = window.confirm(
      `Hapus data murid "${student.fullName}" (${student.studentCode})?`
    );
    if (!confirmed) return;

    try {
      await deleteDoc(doc(db, "students", student.id));
      if (student.claimCode) {
        await deleteDoc(doc(db, "claimCodes", student.claimCode));
      }
      setStudents((prev) => prev.filter((s) => s.id !== student.id));
    } catch (error) {
      console.error("Gagal menghapus murid:", error);
    }
  };

  const handleCopyClaimInfo = (student: StudentProfile) => {
    const message = `Halo Bapak/Ibu ${
      student.parentName || "Wali Murid"
    }, berikut Kode Klaim akun TREX Skate School untuk ananda *${
      student.fullName
    }*:\n\nKode Klaim: *${student.claimCode}*\n\nSilakan daftar/masuk di portal web TREX Skate School lalu masukkan kode tersebut untuk melihat jadwal & rapor latihan anak.`;

    navigator.clipboard.writeText(message);
    setCopiedCode(student.id);
    setTimeout(() => setCopiedCode(null), 2500);
  };

  const filteredStudents = students.filter(
    (s) =>
      s.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.studentCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.claimCode.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <RoleGuard allowedRoles={["admin"]}>
      <div className="min-h-[85vh] bg-slate-50 pb-14">
        {/* Top Bar */}
        <div className="bg-slate-900 text-white border-b border-slate-800">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 py-7">
            <Link
              href="/admin"
              className="text-xs font-bold text-lime-400 hover:underline"
            >
              ← Kembali ke Dashboard Admin
            </Link>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mt-3">
              <div>
                <h1 className="text-2xl sm:text-3xl font-black">
                  Data Murid &amp; Kode Klaim
                </h1>
                <p className="text-sm text-slate-300 mt-1">
                  Kelola profil anggota dan bagikan kode tautan privat ke orang
                  tua.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowForm(!showForm)}
                className="px-5 py-3 rounded-xl bg-lime-400 hover:bg-lime-300 text-slate-950 font-extrabold text-sm transition-colors shrink-0"
              >
                {showForm ? "Tutup Form" : "+ Tambah Murid Baru"}
              </button>
            </div>
          </div>
        </div>

        <div className="max-w-5xl mx-auto px-4 sm:px-6 mt-6 space-y-6">
          {/* Form Tambah Murid */}
          {showForm && (
            <form
              onSubmit={handleAddStudent}
              className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 sm:p-7 space-y-4"
            >
              <h2 className="text-lg font-black text-slate-900">
                Pendaftaran Murid Baru
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Nama Lengkap Anak *
                  </label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Contoh: Arka Pratama"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Tanggal Lahir
                  </label>
                  <input
                    type="date"
                    value={birthDate}
                    onChange={(e) => setBirthDate(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Jenis Kelamin
                  </label>
                  <select
                    value={gender}
                    onChange={(e) => setGender(e.target.value as "L" | "P")}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm bg-white"
                  >
                    <option value="L">Laki-laki</option>
                    <option value="P">Perempuan</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Level Kemampuan Awal
                  </label>
                  <select
                    value={level}
                    onChange={(e) =>
                      setLevel(e.target.value as SkillLevelCategory)
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm bg-white"
                  >
                    <option value="Beginner">Beginner (Pemula)</option>
                    <option value="Intermediate">Intermediate (Menengah)</option>
                    <option value="Advanced">Advanced (Mahir)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Coach Pembina
                  </label>
                  <select
                    value={coachId}
                    onChange={(e) => setCoachId(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm bg-white"
                  >
                    <option value="">-- Pilih Coach (Opsional) --</option>
                    {coaches.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Status Keanggotaan
                  </label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as StudentStatus)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm bg-white"
                  >
                    <option value="active">Aktif</option>
                    <option value="pending">Pending (Menunggu Bayar)</option>
                    <option value="inactive">Nonaktif</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Nama Orang Tua / Wali
                  </label>
                  <input
                    type="text"
                    value={parentName}
                    onChange={(e) => setParentName(e.target.value)}
                    placeholder="Contoh: Ibu Rina"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Nomor WhatsApp Orang Tua
                  </label>
                  <input
                    type="tel"
                    value={parentWhatsapp}
                    onChange={(e) => setParentWhatsapp(e.target.value)}
                    placeholder="Contoh: 08123456789"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-300 text-sm font-bold text-slate-700"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-lime-400 text-sm font-extrabold disabled:opacity-60"
                >
                  {submitting ? "Menyimpan..." : "Simpan Data Murid"}
                </button>
              </div>
            </form>
          )}

          {/* Pencarian */}
          <div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari nama anak, kode murid, atau kode klaim..."
              className="w-full px-4 py-3 rounded-xl bg-white border border-slate-200 text-sm shadow-xs focus:outline-none focus:ring-2 focus:ring-lime-500"
            />
          </div>

          {/* Daftar Murid */}
          {loading ? (
            <div className="p-8 text-center text-sm text-slate-500 bg-white rounded-2xl border border-slate-200">
              Memuat daftar murid...
            </div>
          ) : filteredStudents.length === 0 ? (
            <div className="p-8 text-center bg-white rounded-2xl border border-slate-200 space-y-2">
              <p className="font-bold text-slate-900">Belum ada data murid</p>
              <p className="text-xs sm:text-sm text-slate-500">
                Ketuk tombol <strong>+ Tambah Murid Baru</strong> di atas untuk
                mendaftarkan murid pertama.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredStudents.map((student) => {
                const isLinked =
                  student.parentUids && student.parentUids.length > 0;
                return (
                  <div
                    key={student.id}
                    className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs flex flex-col justify-between space-y-4"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-md bg-slate-100 text-slate-700">
                          {student.studentCode}
                        </span>
                        <select
                          value={student.status}
                          onChange={(e) =>
                            handleStatusChange(
                              student.id,
                              e.target.value as StudentStatus
                            )
                          }
                          className={`text-xs font-extrabold px-2.5 py-1 rounded-full border ${
                            student.status === "active"
                              ? "bg-lime-100 text-slate-950 border-lime-400"
                              : student.status === "pending"
                              ? "bg-amber-50 text-amber-800 border-amber-300"
                              : "bg-slate-100 text-slate-600 border-slate-300"
                          }`}
                        >
                          <option value="active">AKTIF</option>
                          <option value="pending">PENDING</option>
                          <option value="expired">EXPIRED</option>
                          <option value="inactive">NONAKTIF</option>
                        </select>
                      </div>

                      <h3 className="text-lg font-black text-slate-900 mt-3">
                        {student.fullName}
                      </h3>
                      <p className="text-xs text-slate-600 mt-0.5">
                        Level: <strong>{student.level}</strong> • Coach:{" "}
                        <strong>{student.coachName || "-"}</strong>
                      </p>
                      <p className="text-xs text-slate-500 mt-1">
                        Wali: {student.parentName || "-"} (
                        {student.parentWhatsapp || "-"})
                      </p>
                    </div>

                    {/* Box Kode Klaim */}
                    <div className="p-3.5 rounded-xl bg-slate-900 text-white flex items-center justify-between gap-2">
                      <div>
                        <span className="block text-[10px] uppercase tracking-wider text-slate-400">
                          Kode Klaim Wali •{" "}
                          {isLinked ? "Sudah Tertaut" : "Belum Diklaim"}
                        </span>
                        <span className="font-mono text-base font-black text-lime-400 tracking-widest">
                          {student.claimCode}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleCopyClaimInfo(student)}
                          className="px-3 py-1.5 rounded-lg bg-lime-400 text-slate-950 text-xs font-extrabold hover:bg-lime-300"
                        >
                          {copiedCode === student.id
                            ? "Tersalin!"
                            : "Salin Pesan"}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteStudent(student)}
                          aria-label="Hapus murid"
                          className="p-1.5 rounded-lg bg-slate-800 text-red-400 hover:bg-red-950 text-xs font-bold"
                        >
                          Hapus
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </RoleGuard>
  );
}
