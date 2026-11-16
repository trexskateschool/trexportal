"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";

interface CompetitionItem {
  id: string;
  title: string;
  eventDate: string;
  location: string;
  status: "open" | "upcoming" | "completed";
  description: string;
}

export default function CompetitionsPublicPage() {
  const [competitions, setCompetitions] = useState<CompetitionItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchCompetitions() {
      try {
        const snap = await getDocs(collection(db, "competitions"));
        const list: CompetitionItem[] = [];
        snap.forEach((d) => {
          list.push({
            id: d.id,
            ...(d.data() as Omit<CompetitionItem, "id">),
          });
        });
        list.sort((a, b) => b.eventDate.localeCompare(a.eventDate));
        setCompetitions(list);
      } catch (error) {
        console.error("Gagal memuat agenda kompetisi:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchCompetitions();
  }, []);

  const getStatusBadge = (status: CompetitionItem["status"]) => {
    if (status === "open") {
      return {
        label: "PENDAFTARAN DIBUKA",
        className: "bg-lime-200 text-slate-950",
      };
    }
    if (status === "completed") {
      return {
        label: "SELESAI",
        className: "bg-slate-200 text-slate-700",
      };
    }
    return {
      label: "AGENDA MENDATANG",
      className: "bg-blue-100 text-blue-900",
    };
  };

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
            Agenda &amp; Kejuaraan
          </span>
          <h1 className="text-2xl sm:text-3xl font-black mt-2">
            Agenda Kompetisi &amp; Festival Sepatu Roda
          </h1>
          <p className="text-sm text-slate-300 mt-1">
            Jadwal kejuaraan internal, try out, dan lomba sepatu roda untuk melatih mental bertanding siswa TREX Skate School.
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 mt-6 space-y-4">
        {loading ? (
          <div className="p-8 rounded-2xl bg-white border border-slate-200 text-center text-sm text-slate-500">
            Memuat agenda kompetisi...
          </div>
        ) : competitions.length === 0 ? (
          <div className="p-8 rounded-2xl bg-white border border-slate-200 text-center space-y-2">
            <p className="text-base font-black text-slate-900">
              Belum Ada Agenda Kompetisi Terjadwal
            </p>
            <p className="text-xs sm:text-sm text-slate-500">
              Jadwal kejuaraan dan festival berikutnya akan segera diumumkan oleh pengurus klub di halaman ini.
            </p>
          </div>
        ) : (
          competitions.map((comp) => {
            const badge = getStatusBadge(comp.status);
            return (
              <div
                key={comp.id}
                className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-3"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={`text-[11px] font-extrabold px-2.5 py-0.5 rounded ${badge.className}`}
                  >
                    {badge.label}
                  </span>
                  <span className="text-xs font-bold text-slate-500">
                    📅 {comp.eventDate} • 📍 {comp.location}
                  </span>
                </div>
                <h2 className="text-xl font-black text-slate-900">
                  {comp.title}
                </h2>
                <p className="text-sm text-slate-600 leading-relaxed">
                  {comp.description}
                </p>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
