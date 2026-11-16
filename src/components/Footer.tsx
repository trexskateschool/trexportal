import Link from "next/link";

export default function Footer() {
  return (
    <footer className="bg-slate-950 text-slate-300 border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Kolom 1: Identitas TREX Skate School (Tetap) */}
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <span className="w-10 h-10 rounded-full bg-lime-400 text-slate-950 font-black text-sm flex items-center justify-center shrink-0">
                TX
              </span>
              <span className="font-black text-lg text-white tracking-tight">
                TREX SKATE SCHOOL
              </span>
            </div>
            <p className="text-sm text-slate-400 leading-relaxed">
              Akademi dan klub pembinaan sepatu roda anak dengan kurikulum terstruktur, pendampingan coach berpengalaman, dan pemantauan rapor perkembangan digital.
            </p>
          </div>

          {/* Kolom 2: Jadwal Latihan Rutin (Tetap) */}
          <div className="space-y-3">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-white">
              JADWAL LATIHAN RUTIN
            </h3>
            <ul className="space-y-2 text-sm text-slate-300">
              <li>
                <span className="font-bold text-lime-400">Hari:</span> Setiap Sabtu
              </li>
              <li>
                <span className="font-bold text-lime-400">Waktu:</span> 16.00 – 18.00 WIB
              </li>
              <li>
                <span className="font-bold text-lime-400">Peserta:</span> Anak Usia Pemula hingga Mahir
              </li>
            </ul>
          </div>

          {/* Kolom 3: Navigasi (Diperbaiki agar bisa diklik) */}
          <div className="space-y-3">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-white">
              NAVIGASI
            </h3>
            <ul className="space-y-2.5 text-sm text-slate-400">
              <li>
                <Link
                  href="/schedule"
                  className="hover:text-lime-400 transition-colors"
                >
                  Informasi Latihan
                </Link>
              </li>
              <li>
                <Link
                  href="/curriculum"
                  className="hover:text-lime-400 transition-colors"
                >
                  Materi Keterampilan
                </Link>
              </li>
              <li>
                <Link
                  href="/coaches"
                  className="hover:text-lime-400 transition-colors"
                >
                  Profil Tim Coach
                </Link>
              </li>
              <li>
                <Link
                  href="/competitions"
                  className="hover:text-lime-400 transition-colors"
                >
                  Agenda Kompetisi
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Baris Copyright Bawah (Tetap) */}
        <div className="mt-10 pt-6 border-t border-slate-800/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs text-slate-400">
          <p>© 2026 TREX Skate School. All rights reserved.</p>
          <p>Digital Management &amp; Student Progress System</p>
        </div>
      </div>
    </footer>
  );
}
