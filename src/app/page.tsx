export default function HomePage() {
  const skills = [
    {
      step: "01",
      title: "Basic Standing",
      desc: "Postur tubuh dasar, posisi lutut, dan cara berdiri stabil di atas roda.",
    },
    {
      step: "02",
      title: "Balance & Safety Fall",
      desc: "Keseimbangan satu kaki dan teknik jatuh aman menggunakan pelindung.",
    },
    {
      step: "03",
      title: "Forward Skating",
      desc: "Teknik dorongan kaki (stride) dan meluncur lurus ke depan dengan efisien.",
    },
    {
      step: "04",
      title: "Stopping",
      desc: "Penguasaan teknik pengereman terkendali (Heel Brake & T-Stop).",
    },
    {
      step: "05",
      title: "Turning",
      desc: "Manuver belok halus (A-Frame Turn & Parallel Turn) tanpa kehilangan laju.",
    },
    {
      step: "06",
      title: "Backward Skating",
      desc: "Meluncur mundur dengan kontrol keseimbangan dan pandangan terjaga.",
    },
    {
      step: "07",
      title: "Cross Over",
      desc: "Teknik menyilangkan kaki untuk akselerasi cepat di tikungan lintasan.",
    },
    {
      step: "08",
      title: "Advanced Skating",
      desc: "Kombinasi kecepatan, kelincahan slalom, dan kesiapan kompetisi.",
    },
  ];

  const coaches = [
    {
      name: "Head Coach TREX",
      role: "Fundamental & Youth Development",
      exp: "Spesialis pengenalan dasar sepatu roda anak & teknik keseimbangan aman.",
    },
    {
      name: "Coach Tim Teknik",
      role: "Agility & Basic Speed",
      exp: "Fokus pada transisi gerak, pengereman presisi, dan kelincahan lintasan.",
    },
    {
      name: "Coach Tim Prestasi",
      role: "Competition Preparation",
      exp: "Pendampingan mental tanding dan teknik lanjutan untuk kejuaraan pemula.",
    },
  ];

  return (
    <div className="w-full">
      {/* 1. HERO SECTION */}
      <section className="relative bg-slate-900 text-white overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(163,230,53,0.16),_transparent_50%)]" />
        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 pt-10 pb-16 md:py-20">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-10">
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-800/90 border border-slate-700 text-lime-400 text-xs font-bold tracking-wide mb-6">
                <span className="w-2 h-2 rounded-full bg-lime-400 animate-pulse" />
                LATIHAN RUTIN • SABTU 16.00 – 18.00 WIB
              </div>

              <h1 className="text-3xl sm:text-5xl font-black tracking-tight leading-tight">
                Latih Keseimbangan, Keberanian, dan Teknik{" "}
                <span className="text-lime-400">Sepatu Roda Anak</span> Secara
                Terukur.
              </h1>

              <p className="mt-4 text-base sm:text-lg text-slate-300 leading-relaxed">
                Selamat datang di portal digital{" "}
                <strong className="text-white">TREX Skate School</strong>. Orang
                tua dapat memantau catatan evaluasi latihan setiap Sabtu dan
                mengunduh rapor bulanan anak secara privat.
              </p>

              <div className="mt-8 flex flex-col sm:flex-row gap-3.5">
                <a
                  href="#akses-portal"
                  className="inline-flex items-center justify-center px-6 py-3.5 rounded-xl bg-lime-400 text-slate-950 font-extrabold text-sm sm:text-base hover:bg-lime-300 transition-colors shadow-lg shadow-lime-400/15"
                >
                  Masuk Portal Wali &amp; Coach
                </a>
                <a
                  href="#kurikulum"
                  className="inline-flex items-center justify-center px-6 py-3.5 rounded-xl bg-slate-800 text-white font-semibold text-sm sm:text-base border border-slate-700 hover:bg-slate-700 transition-colors"
                >
                  Lihat Materi Latihan
                </a>
              </div>
            </div>

            {/* Official Emblem Showcase */}
            <div className="flex justify-center lg:justify-end shrink-0">
              <div className="relative w-44 h-44 sm:w-56 sm:h-56 rounded-full overflow-hidden bg-white ring-4 ring-lime-400 shadow-2xl shadow-lime-400/15">
                <img
                  src="/logo.jpg"
                  alt="Emblem Resmi TREX Skate School"
                  className="w-full h-full object-cover scale-[1.14]"
                />
              </div>
            </div>
          </div>

          {/* Highlight Metrics */}
          <div className="mt-12 grid grid-cols-3 gap-3 sm:gap-6 max-w-2xl pt-8 border-t border-slate-800">
            <div>
              <p className="text-xl sm:text-2xl font-black text-lime-400">
                Sabtu
              </p>
              <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
                16.00 – 18.00 WIB
              </p>
            </div>
            <div>
              <p className="text-xl sm:text-2xl font-black text-white">
                8 Materi
              </p>
              <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
                Kurikulum Bertahap
              </p>
            </div>
            <div>
              <p className="text-xl sm:text-2xl font-black text-white">
                Privat
              </p>
              <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
                Rapor Khusus Wali
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 2. JADWAL & INFO LATIHAN */}
      <section
        id="jadwal"
        className="py-14 sm:py-16 bg-white border-b border-slate-200/80"
      >
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
            <div>
              <span className="text-xs font-extrabold uppercase tracking-widest text-blue-900 bg-blue-50 px-3 py-1 rounded-full">
                Agenda Klub
              </span>
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900 mt-3">
                Jadwal &amp; Ketentuan Latihan
              </h2>
            </div>
            <p className="text-sm text-slate-600 max-w-md">
              Setiap sesi mencakup pemanasan dinamis, latihan teknik kelompok
              sesuai level, dan evaluasi progres individu oleh coach.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div className="p-6 rounded-2xl bg-slate-900 text-white shadow-sm">
              <div className="inline-block px-2.5 py-1 rounded-md bg-lime-400 text-slate-950 text-xs font-extrabold mb-4">
                SESI REGULER
              </div>
              <h3 className="text-xl font-bold">Setiap Hari Sabtu</h3>
              <p className="text-lime-400 font-extrabold text-2xl mt-1">
                16.00 – 18.00 WIB
              </p>
              <p className="text-sm text-slate-300 mt-3 leading-relaxed">
                Durasi 120 menit efektif. Murid diharapkan hadir 15 menit
                sebelum sesi dimulai untuk pemasangan perlengkapan.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200">
              <div className="inline-block px-2.5 py-1 rounded-md bg-blue-900 text-white text-xs font-bold mb-4">
                PERLENGKAPAN WAJIB
              </div>
              <h3 className="text-lg font-bold text-slate-900">
                Standar Keamanan Anak
              </h3>
              <ul className="mt-3 space-y-2 text-sm text-slate-700">
                <li>• Sepatu roda (Inline Skate) sesuai ukuran kaki</li>
                <li>• Helm pelindung kepala</li>
                <li>• Pelindung lutut, siku, dan telapak tangan (1 set)</li>
                <li>• Air minum pribadi</li>
              </ul>
            </div>

            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200">
              <div className="inline-block px-2.5 py-1 rounded-md bg-lime-200 text-slate-900 text-xs font-bold mb-4">
                SISTEM PENILAIAN
              </div>
              <h3 className="text-lg font-bold text-slate-900">
                4 Tingkat Penguasaan
              </h3>
              <ul className="mt-3 space-y-2 text-sm text-slate-700">
                <li>
                  <strong className="text-slate-900">
                    1. Belum Dipelajari:
                  </strong>{" "}
                  Materi tahap berikutnya
                </li>
                <li>
                  <strong className="text-slate-900">2. Sedang Belajar:</strong>{" "}
                  Pengenalan gerak dasar
                </li>
                <li>
                  <strong className="text-slate-900">
                    3. Mulai Berkembang:
                  </strong>{" "}
                  Sudah mampu dengan pengawasan
                </li>
                <li>
                  <strong className="text-slate-900">4. Sudah Dikuasai:</strong>{" "}
                  Stabil &amp; siap naik materi
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* 3. KURIKULUM KETERAMPILAN */}
      <section id="kurikulum" className="py-14 sm:py-16 bg-slate-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="max-w-2xl mb-10">
            <span className="text-xs font-extrabold uppercase tracking-widest text-blue-900 bg-blue-100/80 px-3 py-1 rounded-full">
              Kurikulum TREX
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 mt-3">
              Tahapan Materi Keterampilan Skating
            </h2>
            <p className="text-sm sm:text-base text-slate-600 mt-2">
              Setiap anak berkembang dengan ritmenya sendiri. Coach mencatat
              pencapaian anak pada setiap poin materi berikut.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {skills.map((skill) => (
              <div
                key={skill.step}
                className="p-5 rounded-2xl bg-white border border-slate-200/90 hover:border-lime-500 transition-colors shadow-xs"
              >
                <span className="inline-block text-xs font-black px-2.5 py-1 rounded-lg bg-slate-900 text-lime-400">
                  LEVEL {skill.step}
                </span>
                <h3 className="text-base font-extrabold text-slate-900 mt-3">
                  {skill.title}
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 mt-1.5 leading-relaxed">
                  {skill.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 4. PROFIL TIM COACH */}
      <section
        id="coach"
        className="py-14 sm:py-16 bg-white border-t border-slate-200/80"
      >
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="max-w-2xl mb-10">
            <span className="text-xs font-extrabold uppercase tracking-widest text-blue-900 bg-blue-50 px-3 py-1 rounded-full">
              Tim Pelatih
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 mt-3">
              Didampingi Coach Berpengalaman
            </h2>
            <p className="text-sm sm:text-base text-slate-600 mt-2">
              Setiap kelompok murid dibimbing langsung oleh coach yang memantau
              keamanan, teknik dasar, dan motivasi latihan anak.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {coaches.map((coach) => (
              <div
                key={coach.name}
                className="p-6 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col justify-between"
              >
                <div>
                  <div className="w-12 h-12 rounded-2xl bg-slate-900 text-lime-400 flex items-center justify-center font-black text-lg mb-4">
                    TX
                  </div>
                  <h3 className="text-lg font-extrabold text-slate-900">
                    {coach.name}
                  </h3>
                  <p className="text-xs font-bold text-blue-900 uppercase tracking-wide mt-0.5">
                    {coach.role}
                  </p>
                  <p className="text-sm text-slate-600 mt-3 leading-relaxed">
                    {coach.exp}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 5. INFO KOMPETISI & PORTAL AKSES */}
      <section id="kompetisi" className="py-14 sm:py-16 bg-slate-900 text-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
            <div>
              <span className="text-xs font-extrabold uppercase tracking-widest text-slate-950 bg-lime-400 px-3 py-1 rounded-full">
                Kompetisi &amp; Evaluasi
              </span>
              <h2 className="text-2xl sm:text-3xl font-black mt-4">
                Siap Mengikuti Kejuaraan Sepatu Roda Pemula &amp; Prestasi
              </h2>
              <p className="text-sm sm:text-base text-slate-300 mt-3 leading-relaxed">
                Informasi jadwal lomba, kategori usia, persyaratan, dan
                rekomendasi kesiapan anak akan diumumkan langsung melalui papan
                informasi di dalam portal anggota TREX Skate School.
              </p>
            </div>

            {/* Card Akses Portal */}
            <div
              id="akses-portal"
              className="p-6 sm:p-8 rounded-2xl bg-slate-800/90 border border-slate-700"
            >
              <h3 className="text-xl font-extrabold text-white">
                Portal Anggota TREX Skate School
              </h3>
              <p className="text-sm text-slate-300 mt-2 leading-relaxed">
                Akses data perkembangan anak, rapor bulanan PDF, absensi
                latihan, dan status pembayaran pendaftaran / daftar ulang.
              </p>

              <div className="mt-5 p-4 rounded-xl bg-slate-900/90 border border-slate-700/80 text-xs sm:text-sm text-slate-300 space-y-1.5">
                <p className="font-bold text-lime-400">
                  Privasi Data Terjamin:
                </p>
                <p>
                  Rapor dan catatan evaluasi hanya dapat diakses oleh akun
                  orang tua yang terhubung dengan profil anak masing-masing.
                </p>
              </div>

              <div className="mt-6">
                <button
                  type="button"
                  disabled
                  className="w-full py-3.5 px-5 rounded-xl bg-lime-400/90 text-slate-950 font-extrabold text-sm cursor-not-allowed opacity-90"
                >
                  Login Portal (Aktif di Fase 2 &amp; 3)
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
