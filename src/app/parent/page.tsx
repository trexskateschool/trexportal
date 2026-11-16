"use client";

import { useEffect, useState, FormEvent } from "react";
import Link from "next/link";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  updateDoc,
  arrayUnion,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import RoleGuard from "@/components/RoleGuard";
import { DEFAULT_SKILLS, MASTERY_LABELS } from "@/lib/constants";
import {
  AttendanceRecord,
  MasteryLevel,
  MonthlyReport,
  ProgressRecord,
  StudentProfile,
} from "@/types/database";

const MONTH_NAMES = [
  "Januari",
  "Februari",
  "Maret",
  "April",
  "Mei",
  "Juni",
  "Juli",
  "Agustus",
  "September",
  "Oktober",
  "November",
  "Desember",
];

export default function ParentPortalPage() {
  const { firebaseUser, userProfile } = useAuth();
  const [children, setChildren] = useState<StudentProfile[]>([]);
  const [selectedChildId, setSelectedChildId] = useState("");
  const [loadingChildren, setLoadingChildren] = useState(true);

  // State Kode Klaim
  const [claimInput, setClaimInput] = useState("");
  const [claiming, setClaiming] = useState(false);
  const [claimError, setClaimError] = useState("");
  const [claimSuccess, setClaimSuccess] = useState("");
  const [showAddAnotherChild, setShowAddAnotherChild] = useState(false);

  // Detail data anak terpilih
  const [reports, setReports] = useState<MonthlyReport[]>([]);
  const [progressList, setProgressList] = useState<ProgressRecord[]>([]);
  const [attendanceList, setAttendanceList] = useState<AttendanceRecord[]>([]);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [activeTab, setActiveTab] = useState<"rapor" | "skill" | "absensi">(
    "rapor"
  );

  const fetchMyChildren = async () => {
    if (!firebaseUser) return;
    setLoadingChildren(true);
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
      if (list.length > 0 && !selectedChildId) {
        setSelectedChildId(list[0].id);
      } else if (list.length > 0 && !list.some((c) => c.id === selectedChildId)) {
        setSelectedChildId(list[0].id);
      }
    } catch (error) {
      console.error("Gagal memuat profil anak:", error);
    } finally {
      setLoadingChildren(false);
    }
  };

  useEffect(() => {
    fetchMyChildren();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [firebaseUser]);

  // Muat Rapor Terbit, Perkembangan Skill, dan Absensi anak terpilih
  useEffect(() => {
    async function fetchChildRecords() {
      if (!selectedChildId) return;
      setLoadingDetails(true);

      try {
        const [repSnap, progSnap, attSnap] = await Promise.all([
          getDocs(
            query(
              collection(db, "monthlyReports"),
              where("studentId", "==", selectedChildId),
              where("status", "==", "published")
            )
          ),
          getDocs(
            query(
              collection(db, "progressRecords"),
              where("studentId", "==", selectedChildId)
            )
          ),
          getDocs(
            query(
              collection(db, "attendance"),
              where("studentId", "==", selectedChildId)
            )
          ),
        ]);

        const repList: MonthlyReport[] = [];
        repSnap.forEach((d) => {
          repList.push({
            id: d.id,
            ...(d.data() as Omit<MonthlyReport, "id">),
          });
        });
        repList.sort((a, b) => {
          if (b.year !== a.year) return b.year - a.year;
          return b.month - a.month;
        });

        const progList: ProgressRecord[] = [];
        progSnap.forEach((d) => {
          progList.push({
            id: d.id,
            ...(d.data() as Omit<ProgressRecord, "id">),
          });
        });
        progList.sort((a, b) => b.date.localeCompare(a.date));

        const attList: AttendanceRecord[] = [];
        attSnap.forEach((d) => {
          attList.push({
            id: d.id,
            ...(d.data() as Omit<AttendanceRecord, "id">),
          });
        });
        attList.sort((a, b) => b.date.localeCompare(a.date));

        setReports(repList);
        setProgressList(progList);
        setAttendanceList(attList);
      } catch (error) {
        console.error("Gagal memuat riwayat anak:", error);
      } finally {
        setLoadingDetails(false);
      }
    }

    fetchChildRecords();
  }, [selectedChildId]);

  const handleClaimStudent = async (e: FormEvent) => {
    e.preventDefault();
    if (!firebaseUser) return;

    const cleanCode = claimInput.trim().toUpperCase();
    if (cleanCode.length < 4) {
      setClaimError("Masukkan 6 karakter Kode Klaim dari Admin TREX.");
      return;
    }

    setClaiming(true);
    setClaimError("");
    setClaimSuccess("");

    try {
      const codeRef = doc(db, "claimCodes", cleanCode);
      const codeSnap = await getDoc(codeRef);

      if (!codeSnap.exists()) {
        setClaimError(
          "Kode Klaim tidak ditemukan. Periksa kembali huruf dan angka dari Admin."
        );
        setClaiming(false);
        return;
      }

      const codeData = codeSnap.data();
      if (codeData.isClaimed) {
        setClaimError(
          "Kode Klaim ini sudah pernah digunakan. Hubungi Admin jika butuh kode baru."
        );
        setClaiming(false);
        return;
      }

      const studentId = codeData.studentId as string;

      // Tautkan UID orang tua ke dokumen murid
      await updateDoc(doc(db, "students", studentId), {
        parentUids: arrayUnion(firebaseUser.uid),
        updatedAt: serverTimestamp(),
      });

      // Tandai kode klaim sudah terpakai
      await updateDoc(codeRef, {
        isClaimed: true,
        claimedBy: firebaseUser.uid,
      });

      setClaimInput("");
      setShowAddAnotherChild(false);
      setClaimSuccess(
        `Profil ananda ${codeData.studentName} berhasil ditautkan ke akun Anda!`
      );
      await fetchMyChildren();
      setSelectedChildId(studentId);
    } catch (error) {
      console.error("Gagal menautkan kode klaim:", error);
      setClaimError(
        "Gagal memproses kode klaim. Pastikan koneksi internet stabil."
      );
    } finally {
      setClaiming(false);
    }
  };

  const activeChild =
    children.find((c) => c.id === selectedChildId) || children[0];

  // Hitung skor terkini untuk ke-8 skill
  const latestSkillStatus = DEFAULT_SKILLS.map((skill) => {
    const found = progressList.find((p) => p.skillId === skill.id);
    return {
      ...skill,
      masteryLevel: (found ? found.masteryLevel : 1) as MasteryLevel,
      lastUpdated: found?.date || null,
    };
  });

  const latestNoteRecord = progressList[0];
  const totalPresent = attendanceList.filter(
    (a) => a.status === "present"
  ).length;

  return (
    <RoleGuard allowedRoles={["parent"]}>
      <div className="min-h-[85vh] bg-slate-50 pb-16">
        {/* Header Portal Orang Tua */}
        <div className="bg-slate-900 text-white border-b border-slate-800">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <span className="inline-block px-3 py-1 rounded-full bg-lime-400 text-slate-950 text-xs font-extrabold uppercase tracking-wider">
                Portal Privat Orang Tua / Wali
              </span>

              {children.length > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    setShowAddAnotherChild(!showAddAnotherChild);
                    setClaimError("");
                    setClaimSuccess("");
                  }}
                  className="text-xs font-bold px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-lime-400 border border-slate-700 transition-colors"
                >
                  {showAddAnotherChild
                    ? "Tutup Form Kode"
                    : "+ Tautkan Anak Lain"}
                </button>
              )}
            </div>

            <h1 className="text-2xl sm:text-3xl font-black mt-3">
              Halo, {userProfile?.name || "Wali Murid"}
            </h1>
            <p className="text-sm text-slate-300 mt-1">
              Pantau perkembangan latihan sepatu roda, kehadiran Sabtu, dan
              rapor bulanan anak Anda.
            </p>
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-4 sm:px-6 mt-6 space-y-6">
          {claimSuccess && (
            <div className="p-4 rounded-xl bg-lime-100 border border-lime-400 text-slate-950 text-sm font-bold">
              ✓ {claimSuccess}
            </div>
          )}

          {loadingChildren ? (
            <div className="p-8 rounded-2xl bg-white border border-slate-200 text-center text-sm text-slate-600">
              Memuat profil anak yang terhubung...
            </div>
          ) : children.length === 0 || showAddAnotherChild ? (
            /* Form Penautan Kode Klaim */
            <div className="p-6 sm:p-8 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-5">
              <div>
                <span className="inline-block px-3 py-1 rounded-lg bg-lime-100 text-slate-950 text-xs font-extrabold">
                  AKTIVASI PROFIL ANAK
                </span>
                <h2 className="text-xl font-black text-slate-900 mt-2">
                  Masukkan Kode Klaim Murid
                </h2>
                <p className="text-sm text-slate-600 mt-1 leading-relaxed">
                  Ketik <strong>6 karakter Kode Klaim</strong> yang dikirimkan
                  oleh Admin TREX Skate School melalui WhatsApp untuk membuka
                  rapor dan catatan latihan anak Anda.
                </p>
              </div>

              {claimError && (
                <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-xs sm:text-sm text-red-800 font-medium">
                  {claimError}
                </div>
              )}

              <form
                onSubmit={handleClaimStudent}
                className="flex flex-col sm:flex-row gap-3"
              >
                <input
                  type="text"
                  maxLength={8}
                  required
                  value={claimInput}
                  onChange={(e) => setClaimInput(e.target.value.toUpperCase())}
                  placeholder="CONTOH: TRX8K2"
                  className="flex-1 px-4 py-3.5 rounded-xl border border-slate-300 font-mono text-lg font-black tracking-widest uppercase text-slate-900 focus:outline-none focus:ring-2 focus:ring-lime-500"
                />
                <button
                  type="submit"
                  disabled={claiming}
                  className="px-6 py-3.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-lime-400 font-extrabold text-sm transition-colors disabled:opacity-60 shrink-0"
                >
                  {claiming ? "Memverifikasi..." : "Hubungkan Profil Anak"}
                </button>
              </form>
            </div>
          ) : null}

          {/* Dashboard Anak Jika Sudah Terhubung */}
          {!loadingChildren && children.length > 0 && activeChild && (
            <>
              {/* Selector Jika Orang Tua Memiliki Lebih dari 1 Anak */}
              {children.length > 1 && (
                <div className="flex flex-wrap gap-2">
                  {children.map((child) => (
                    <button
                      key={child.id}
                      type="button"
                      onClick={() => setSelectedChildId(child.id)}
                      className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-extrabold border transition-colors ${
                        child.id === activeChild.id
                          ? "bg-slate-900 text-lime-400 border-slate-900"
                          : "bg-white text-slate-700 border-slate-200 hover:bg-slate-100"
                      }`}
                    >
                      {child.fullName}
                    </button>
                  ))}
                </div>
              )}

              {/* Kartu Identitas Murid */}
              <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs">
                <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                  <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-md bg-slate-100 text-slate-700">
                    ID: {activeChild.studentCode}
                  </span>
                  <span
                    className={`text-xs font-extrabold px-3 py-1 rounded-full ${
                      activeChild.status === "active"
                        ? "bg-lime-200 text-slate-950"
                        : "bg-amber-100 text-amber-900"
                    }`}
                  >
                    {activeChild.status === "active"
                      ? "ANGGOTA AKTIF"
                      : "MENUNGGU AKTIVASI"}
                  </span>
                </div>

                <h2 className="text-2xl font-black text-slate-900">
                  {activeChild.fullName}
                </h2>
                <p className="text-sm text-slate-600 mt-1">
                  Level: <strong>{activeChild.level}</strong> • Coach Pembina:{" "}
                  <strong>{activeChild.coachName || "Tim Coach TREX"}</strong>
                </p>

                <div className="mt-5 pt-4 border-t border-slate-100 grid grid-cols-3 gap-3 text-center sm:text-left">
                  <div>
                    <p className="text-xs text-slate-500">Jadwal Rutin</p>
                    <p className="text-sm font-extrabold text-slate-900 mt-0.5">
                      Sabtu 16.00
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Total Kehadiran</p>
                    <p className="text-sm font-extrabold text-slate-900 mt-0.5">
                      {totalPresent} Sesi Hadir
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Rapor Terbit</p>
                    <p className="text-sm font-extrabold text-blue-900 mt-0.5">
                      {reports.length} Dokumen
                    </p>
                  </div>
                </div>
              </div>

              {/* Navigasi Tab Data Anak */}
              <div className="grid grid-cols-3 gap-2 bg-slate-200/70 p-1.5 rounded-2xl">
                <button
                  type="button"
                  onClick={() => setActiveTab("rapor")}
                  className={`py-2.5 px-3 rounded-xl text-xs sm:text-sm font-extrabold transition-colors ${
                    activeTab === "rapor"
                      ? "bg-white text-slate-950 shadow-xs"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  Rapor Bulanan ({reports.length})
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("skill")}
                  className={`py-2.5 px-3 rounded-xl text-xs sm:text-sm font-extrabold transition-colors ${
                    activeTab === "skill"
                      ? "bg-white text-slate-950 shadow-xs"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  Progres 8 Skill
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("absensi")}
                  className={`py-2.5 px-3 rounded-xl text-xs sm:text-sm font-extrabold transition-colors ${
                    activeTab === "absensi"
                      ? "bg-white text-slate-950 shadow-xs"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  Absensi ({attendanceList.length})
                </button>
              </div>

              {loadingDetails ? (
                <div className="p-8 rounded-2xl bg-white border border-slate-200 text-center text-sm text-slate-500">
                  Memuat catatan perkembangan anak...
                </div>
              ) : activeTab === "rapor" ? (
                /* TAB 1: RAPOR BULANAN DIGITAL */
                <div className="space-y-4">
                  {reports.length === 0 ? (
                    <div className="p-6 rounded-2xl bg-white border border-slate-200 text-sm text-slate-600 space-y-1">
                      <p className="font-bold text-slate-900">
                        Belum ada rapor bulanan yang diterbitkan
                      </p>
                      <p className="text-xs sm:text-sm text-slate-500">
                        Rapor evaluasi bulanan akan muncul otomatis di sini
                        setelah Coach dan Admin menerbitkannya di akhir bulan.
                      </p>
                    </div>
                  ) : (
                    reports.map((rep) => (
                      <div
                        key={rep.id}
                        className="p-5 sm:p-6 rounded-2xl bg-white border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                      >
                        <div>
                          <span className="inline-block text-[11px] font-extrabold px-2.5 py-0.5 rounded bg-lime-100 text-slate-950">
                            RAPOR RESMI • TERBIT
                          </span>
                          <h3 className="text-lg font-black text-slate-900 mt-2">
                            Evaluasi Bulan {MONTH_NAMES[rep.month - 1]}{" "}
                            {rep.year}
                          </h3>
                          <p className="text-xs text-slate-600 mt-1">
                            Kehadiran: <strong>{rep.presentCount}</strong> dari{" "}
                            <strong>{rep.totalSessions}</strong> sesi • Skill
                            Dikuasai:{" "}
                            <strong>{rep.masteredSkills?.length || 0}</strong>{" "}
                            materi
                          </p>
                        </div>

                        <Link
                          href={`/parent/report/${rep.id}`}
                          className="inline-flex items-center justify-center px-5 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-lime-400 font-extrabold text-xs sm:text-sm transition-colors shrink-0"
                        >
                          Buka Detail Rapor →
                        </Link>
                      </div>
                    ))
                  )}
                </div>
              ) : activeTab === "skill" ? (
                /* TAB 2: PROGRES 8 MATERI SKILL */
                <div className="space-y-4">
                  {latestNoteRecord && (
                    <div className="p-5 rounded-2xl bg-slate-900 text-white space-y-2">
                      <span className="text-[11px] font-extrabold uppercase tracking-wider text-lime-400">
                        Catatan Evaluasi Terakhir ({latestNoteRecord.date})
                      </span>
                      <p className="text-sm text-slate-200 leading-relaxed">
                        &ldquo;
                        {latestNoteRecord.notes ||
                          "Anak mengikuti sesi latihan dengan baik."}
                        &rdquo;
                      </p>
                      {latestNoteRecord.nextRecommendation && (
                        <p className="text-xs text-lime-300 pt-1">
                          <strong>Fokus Berikutnya:</strong>{" "}
                          {latestNoteRecord.nextRecommendation}
                        </p>
                      )}
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {latestSkillStatus.map((skill) => {
                      const badge = MASTERY_LABELS[skill.masteryLevel];
                      return (
                        <div
                          key={skill.id}
                          className="p-4 rounded-2xl bg-white border border-slate-200 flex items-center justify-between gap-3"
                        >
                          <div>
                            <span className="text-[11px] font-bold text-slate-400">
                              MATERI 0{skill.order}
                            </span>
                            <h3 className="text-sm font-black text-slate-900">
                              {skill.name}
                            </h3>
                          </div>
                          <span
                            className={`text-xs font-extrabold px-3 py-1 rounded-full border shrink-0 ${badge.colorClass}`}
                          >
                            {skill.masteryLevel}/4 • {badge.label}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                /* TAB 3: RIWAYAT ABSENSI SABTU */
                <div className="space-y-3">
                  {attendanceList.length === 0 ? (
                    <div className="p-6 rounded-2xl bg-white border border-slate-200 text-sm text-slate-500">
                      Belum ada catatan kehadiran latihan yang tersimpan.
                    </div>
                  ) : (
                    attendanceList.map((att) => (
                      <div
                        key={att.id}
                        className="p-4 rounded-2xl bg-white border border-slate-200 flex items-center justify-between gap-3"
                      >
                        <div>
                          <p className="text-sm font-black text-slate-900">
                            Sabtu, {att.date}
                          </p>
                          {att.notes && (
                            <p className="text-xs text-slate-500 mt-0.5">
                              Catatan: {att.notes}
                            </p>
                          )}
                        </div>
                        <span
                          className={`text-xs font-extrabold px-3 py-1 rounded-full ${
                            att.status === "present"
                              ? "bg-lime-100 text-slate-950"
                              : att.status === "excused"
                              ? "bg-amber-100 text-amber-900"
                              : "bg-red-100 text-red-800"
                          }`}
                        >
                          {att.status === "present"
                            ? "HADIR"
                            : att.status === "excused"
                            ? "IZIN"
                            : "TIDAK HADIR"}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </RoleGuard>
  );
}
