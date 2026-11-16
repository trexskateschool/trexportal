"use client";

import Link from "next/link";
import { DEFAULT_SKILLS } from "@/lib/constants";

export default function PublicSchedulePage() {
  return (
    <div className="min-h-[85vh] bg-slate-50 pb-16">
      <div className="bg-slate-900 text-white border-b border-slate-800">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
          <Link href="/" className="text-xs font-bold text-lime-400 hover:underline">
            ← Kembali ke Beranda
          </Link>
          <h1 className="text-2xl sm:text-3xl font-black mt-3">
            Jadwal Latihan &amp; Kurikulum TREX
          </h1>
          <p className="text-sm text-slate-300 mt-1">
            Agenda rutin latihan sepatu roda setiap hari Sabtu pukul 16.00 – 18.00 WIB.
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 mt-6 space-y-6">
        <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-3">
          <span className="text-[11px] font-extrabold px-2.5 py-0.5 rounded bg-lime-100 text-slate-950">
            JADWAL RUTIN MINGGUAN
          </span>
          <h2 className="text-xl font-black text-slate-900">
            Sesi Latihan Lapangan Sabtu Sore
          </h2>
          <p className="text-sm text-slate-600 leading-relaxed">
            Seluruh siswa berkumpul setiap hari Sabtu pukul 16.00 WIB di Lapangan Utama untuk latihan teknik dasar, slalom, speed, dan evaluasi penguasaan materi bersama tim pelatih.
          </p>
        </div>

        <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-4">
          <h2 className="text-lg font-black text-slate-900">
            8 Standar Materi Kurikulum Skill
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {DEFAULT_SKILLS.map((skill) => (
              <div key={skill.id} className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-start gap-3">
                <span className="w-7 h-7 rounded-lg bg-slate-900 text-lime-400 font-black text-xs flex items-center justify-center shrink-0">
                  {skill.order}
                </span>
                <div>
                  <h3 className="text-sm font-black text-slate-900">{skill.name}</h3>
                  <p className="text-xs text-slate-500 mt-0.5">{skill.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
