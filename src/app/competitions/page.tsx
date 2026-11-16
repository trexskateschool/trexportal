"use client";

import Link from "next/link";

export default function CompetitionsPublicPage() {
  return (
    <div className="min-h-[85vh] bg-slate-50 pb-16">
      <div className="bg-slate-900 text-white border-b border-slate-800">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
          <Link href="/" className="text-xs font-bold text-lime-400 hover:underline">
            ← Kembali ke Beranda
          </Link>
          <span className="inline-block mt-3 px-3 py-1 rounded-full bg-lime-400 text-slate-950 text-xs font-extrabold uppercase tracking-wider">
            Agenda &amp; Kejuaraan
          </span>
          <h1 className="text-2xl sm:text-3xl font-black mt-2">
            Kompetisi &amp; Festival Sepatu Roda
          </h1>
          <p className="text-sm text-slate-300 mt-1">
            Informasi kejuaraan internal maupun eksternal, try out, dan festival unjuk bakat siswa TREX Skate School.
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 mt-6 space-y-4">
        <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-3">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-extrabold px-2.5 py-0.5 rounded bg-blue-100 text-blue-900">
              AGENDA MENDATANG
            </span>
            <span className="text-xs text-slate-500">Desember 2026</span>
          </div>
          <h2 className="text-xl font-black text-slate-900">
            TREX Internal Cup &amp; Fun Slalom Exhibition
          </h2>
          <p className="text-sm text-slate-600 leading-relaxed">
            Ajang unjuk kemampuan bagi seluruh murid level pemula hingga mahir untuk melatih mental bertanding dalam suasana yang sportif dan menyenangkan. Informasi pendaftaran dibuka melalui dashboard orang tua dan pengumuman admin.
          </p>
        </div>
      </div>
    </div>
  );
}
