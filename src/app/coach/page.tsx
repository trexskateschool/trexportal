"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";

interface CoachItem {
  id: string;
  name: string;
  specialty: string;
  bio?: string;
}

export default function CoachesPublicPage() {
  const [coaches, setCoaches] = useState<CoachItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchCoaches() {
      try {
        const snap = await getDocs(collection(db, "coaches"));
        const list: CoachItem[] = [];
        snap.forEach((d) => {
          list.push({
            id: d.id,
            ...(d.data() as Omit<CoachItem, "id">),
          });
        });
        list.sort((a, b) => a.name.localeCompare(b.name));
        setCoaches(list);
      } catch (error) {
        console.error("Gagal memuat data coach:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchCoaches();
  }, []);

  return (
    <div className="min-h-[85vh] bg-slate-50 pb-16">
      <div className="bg-slate-900 text-white border-b border-slate-800">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
          <Link
            href="/"
            className="text-xs font-bold text-lime-400 hover:underline"
          >
            ← Kembali ke Beranda
          </Link>
          <span className="inline-block mt-3 px-3 py-1 rounded-full bg-lime-400 text-slate-950 text-xs font-extrabold uppercase tracking-wider">
            Pengajar Profesional
          </span>
          <h1 className="text-2xl sm:text-3xl font-black mt-2">
            Profil Tim Coach TREX Skate School
          </h1>
          <p className="text-sm text-slate-300 mt-1">
            Dibimbing langsung oleh pelatih berpengalaman untuk membangun teknik, keseimbangan, dan kepercayaan diri anak.
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 mt-6">
        {loading ? (
          <div className="p-8 rounded-2xl bg-white border border-slate-200 text-center text-sm text-slate-500">
            Memuat profil tim pelatih...
          </div>
        ) : coaches.length === 0 ? (
          <div className="p-8 rounded-2xl bg-white border border-slate-200 text-center space-y-2">
            <p className="text-base font-black text-slate-900">
              Profil Tim Coach Belum Dipublikasikan
            </p>
            <p className="text-xs sm:text-sm text-slate-500">
              Admin klub sedang memperbarui daftar pelatih aktif. Silakan cek kembali beberapa saat lagi.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {coaches.map((coach) => (
              <div
                key={coach.id}
                className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-3"
              >
                <span className="inline-block text-[11px] font-extrabold px-2.5 py-0.5 rounded bg-lime-100 text-slate-950">
                  {coach.specialty || "Pelatih Sepatu Roda"}
                </span>
                <h2 className="text-xl font-black text-slate-900">
                  {coach.name}
                </h2>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  {coach.bio ||
                    "Pelatih aktif TREX Skate School yang mendampingi latihan rutin hari Sabtu dan evaluasi perkembangan murid."}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
