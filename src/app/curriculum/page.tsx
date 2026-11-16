"use client";

import Link from "next/link";
import { DEFAULT_SKILLS } from "@/lib/constants";

export default function CurriculumPage() {
  return (
    <div className="min-h-[85vh] bg-slate-50 pb-16">
      <div className="bg-slate-900 text-white border-b border-slate-800">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
          <Link href="/" className="text-xs font-bold text-lime-400 hover:underline">
            ← Kembali ke Beranda
          </Link>
          <span className="inline-block mt-3 px-3 py-1 rounded-full bg-lime-400 text-slate-950 text-xs font-extrabold uppercase tracking-wider">
            Kurikulum Resmi
          </span>
          <h1 className="text-2xl sm:text-3xl font-black mt-2">
            8 Standar Materi Skill TREX Skate School
          </h1>
          <p className="text-sm text-slate-300 mt-1">
            Kurikulum terstruktur yang diajarkan secara progresif kepada setiap siswa untuk membangun fondasi teknik sepatu roda yang kokoh.
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 mt-6 space-y-4">
        {DEFAULT_SKILLS.map((skill) => (
          <div
            key={skill.id}
            className="p-5 sm:p-6 rounded-2xl bg-white border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4"
          >
            <div className="flex items-start gap-4">
              <span className="w-10 h-10 rounded-xl bg-slate-900 text-lime-400 font-black text-base flex items-center justify-center shrink-0">
                0{skill.order}
              </span>
              <div>
                <h3 className="text-lg font-black text-slate-900">{skill.name}</h3>
                <p className="text-xs sm:text-sm text-slate-600 mt-1 leading-relaxed">
                  {skill.description}
                </p>
              </div>
            </div>
            <span className="text-xs font-extrabold px-3 py-1.5 rounded-xl bg-slate-100 text-slate-700 shrink-0 self-start sm:self-center">
              Skala Penilaian 1-4
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
