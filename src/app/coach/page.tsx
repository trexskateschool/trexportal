"use client";

import Link from "next/link";

export default function CoachesPublicPage() {
  const coachesList = [
    {
      name: "Coach Rian Pratama",
      specialty: "Head Coach - Speed & Slalom",
      desc: "Berpengalaman lebih dari 8 tahun melatih atlet junior dan pembinaan teknik dasar profesional.",
    },
    {
      name: "Coach Dinda Lestari",
      specialty: "Coach Kelas Anak & Pemula",
      desc: "Fokus pada pendekatan psikologi anak, membangun rasa percaya diri, dan teknik keseimbangan dasar.",
    },
    {
      name: "Coach Fajar Nugraha",
      specialty: "Coach Freestyle & Slalom",
      desc: "Spesialis trik kelincahan, footwork, dan koreografi nomor slalom sepatu roda.",
    },
  ];

  return (
    <div className="min-h-[85vh] bg-slate-50 pb-16">
      <div className="bg-slate-900 text-white border-b border-slate-800">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
          <Link href="/" className="text-xs font-bold text-lime-400 hover:underline">
            ← Kembali ke Beranda
          </Link>
          <span className="inline-block mt-3 px-3 py-1 rounded-full bg-lime-400 text-slate-950 text-xs font-extrabold uppercase tracking-wider">
            Pengajar Profesional
          </span>
          <h1 className="text-2xl sm:text-3xl font-black mt-2">
            Tim Pelatih (Coach) TREX
          </h1>
          <p className="text-sm text-slate-300 mt-1">
            Dibimbing langsung oleh pelatih bersertifikasi yang berdedikasi tinggi terhadap perkembangan anak.
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
        {coachesList.map((coach, idx) => (
          <div key={idx} className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-3">
            <span className="text-[11px] font-extrabold px-2.5 py-0.5 rounded bg-lime-100 text-slate-950">
              {coach.specialty}
            </span>
            <h3 className="text-xl font-black text-slate-900">{coach.name}</h3>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              {coach.desc}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
