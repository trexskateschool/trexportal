export default function Footer() {
  return (
    <footer className="bg-slate-950 text-slate-400 border-t border-slate-900">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Kolom 1: Identitas */}
          <div>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full overflow-hidden bg-white ring-2 ring-lime-400/70 shrink-0">
                <img
                  src="/logo.jpg"
                  alt="Logo TREX Skate School"
                  className="w-full h-full object-cover scale-[1.14]"
                />
              </div>
              <span className="text-white font-extrabold tracking-wide text-lg">
                TREX SKATE SCHOOL
              </span>
            </div>
            <p className="text-sm leading-relaxed text-slate-400">
              Akademi dan klub pembinaan sepatu roda anak dengan kurikulum
              terstruktur, pendampingan coach berpengalaman, dan pemantauan
              rapor perkembangan digital.
            </p>
          </div>

          {/* Kolom 2: Jadwal Rutin */}
          <div>
            <h3 className="text-white font-bold text-sm uppercase tracking-wider mb-3">
              Jadwal Latihan Rutin
            </h3>
            <ul className="space-y-2 text-sm">
              <li className="flex items-center gap-2">
                <span className="text-lime-400 font-bold">Hari:</span> Setiap
                Sabtu
              </li>
              <li className="flex items-center gap-2">
                <span className="text-lime-400 font-bold">Waktu:</span> 16.00 –
                18.00 WIB
              </li>
              <li className="flex items-center gap-2">
                <span className="text-lime-400 font-bold">Peserta:</span> Anak
                Usia Pemula hingga Mahir
              </li>
            </ul>
          </div>

          {/* Kolom 3: Akses Cepat */}
          <div>
            <h3 className="text-white font-bold text-sm uppercase tracking-wider mb-3">
              Navigasi
            </h3>
            <ul className="space-y-2 text-sm">
              <li>
                <a
                  href="#jadwal"
                  className="hover:text-lime-400 transition-colors"
                >
                  Informasi Latihan
                </a>
              </li>
              <li>
                <a
                  href="#kurikulum"
                  className="hover:text-lime-400 transition-colors"
                >
                  Materi Keterampilan
                </a>
              </li>
              <li>
                <a
                  href="#coach"
                  className="hover:text-lime-400 transition-colors"
                >
                  Profil Tim Coach
                </a>
              </li>
              <li>
                <a
                  href="#kompetisi"
                  className="hover:text-lime-400 transition-colors"
                >
                  Agenda Kompetisi
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-slate-900 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
          <p>
            © {new Date().getFullYear()} TREX Skate School. All rights reserved.
          </p>
          <p>Digital Management &amp; Student Progress System</p>
        </div>
      </div>
    </footer>
  );
}
